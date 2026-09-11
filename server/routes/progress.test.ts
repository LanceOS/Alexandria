import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import Fastify from 'fastify';
import type { LearningProgress } from '../../shared/progress.js';
import { createAuthService, sessionCookieName } from '../auth/service.js';
import { applyMigrations, assertMigrationHistory, initializeSchema, migrations } from '../db/migrations.js';
import { registerErrors } from '../http/errors.js';
import { ProgressService, progressTimeZone, progressWeek } from '../services/progress.js';
import { registerProgressRoutes } from './progress.js';

function fixture(t: TestContext) {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON; PRAGMA recursive_triggers = ON;');
  initializeSchema(database);
  const app = Fastify({ logger: false, ajv: { customOptions: { coerceTypes: false, removeAdditional: false } } });
  registerErrors(app);
  registerProgressRoutes(app, createAuthService(database, { appOrigin: 'http://localhost:3000' }), database);
  t.after(async () => { await app.close(); database.close(); });
  database.exec(`INSERT INTO topics(id, slug, name, status) VALUES ('topic', 'test-cpp', 'Test C++', 'published');
    INSERT INTO topic_categories(topic_id, category_id) VALUES ('topic', 'category_software');
    INSERT INTO units(id, topic_id, name, slug, status) VALUES ('root', 'topic', 'C++', 'cpp', 'published');
    INSERT INTO units(id, topic_id, parent_unit_id, name, slug, status)
      VALUES ('basics', 'topic', 'root', 'Basics', 'basics', 'published');`);
  function account(username: string, token: string) {
    const id = randomUUID();
    const csrfToken = token.repeat(64);
    const now = new Date().toISOString();
    database.prepare(`INSERT INTO users(id, username, display_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, 'member', 'active', ?, ?)`).run(id, username, username, now, now);
    database.prepare(`INSERT INTO sessions(token_hash, user_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`)
      .run(createHash('sha256').update(csrfToken).digest('hex'), id, csrfToken, Date.now(), Date.now() + 60_000);
    const cookie = `${sessionCookieName}=${csrfToken}`;
    return { id, cookie, headers: { cookie, 'x-csrf-token': csrfToken } };
  }
  const alice = account('alice', 'a');
  const bob = account('bob', 'b');
  function addVersion(moduleId = 'module', version = 1, options: { parts?: string[]; publish?: boolean; policy?: object; requiredExercise?: boolean } = {}) {
    const versionId = `${moduleId}-v${version}`;
    database.prepare('INSERT OR IGNORE INTO modules(id, unit_id, title, slug) VALUES (?, ?, ?, ?)')
      .run(moduleId, 'basics', moduleId, moduleId);
    database.prepare(`INSERT INTO module_versions(id, module_id, version, title, completion_policy_json)
      VALUES (?, ?, ?, ?, ?)`).run(versionId, moduleId, version, moduleId, JSON.stringify(options.policy ?? {}));
    for (const [position, part] of (options.parts ?? ['first', 'second']).entries()) {
      const partId = `${moduleId}-${part}`;
      database.prepare('INSERT OR IGNORE INTO lesson_parts(id, module_id) VALUES (?, ?)').run(partId, moduleId);
      database.prepare(`INSERT INTO lesson_part_versions(lesson_part_id, module_version_id, module_id, title, position, content_json)
        VALUES (?, ?, ?, ?, ?, '[{"type":"paragraph","text":"A small example."}]')`).run(partId, versionId, moduleId, part, position);
    }
    if (options.requiredExercise) {
      database.prepare('INSERT INTO exercises(id, module_id) VALUES (?, ?)').run(`${versionId}-exercise`, moduleId);
      database.prepare(`INSERT INTO exercise_versions(id, exercise_id, module_version_id, module_id, lesson_part_id,
        kind, prompt_json, grading_method) VALUES (?, ?, ?, ?, ?, 'text', '{}', 'automatic')`)
        .run(`${versionId}-exercise-version`, `${versionId}-exercise`, versionId, moduleId, `${moduleId}-${options.parts?.[0] ?? 'first'}`);
      database.prepare(`INSERT INTO exercise_grading_specs(exercise_version_id, spec_json) VALUES (?, '{}')`)
        .run(`${versionId}-exercise-version`);
    }
    if (options.publish !== false) {
      database.prepare(`UPDATE module_versions SET status = 'published', revision = revision + 1,
        published_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).run(versionId);
      database.prepare("UPDATE modules SET status = 'published' WHERE id = ?").run(moduleId);
    }
    return versionId;
  }
  return { database, app, alice, bob, addVersion,
    read: (headers = alice.headers) => app.inject({ url: '/api/progress', headers }),
    mark: (part = 'first', module = 'module', version = `${module}-v1`, headers = alice.headers) => app.inject({
      method: 'PUT', url: `/api/progress/modules/${module}/sections/${module}-${part}`, headers, payload: { versionId: version },
    }),
  };
}

test('progress API requires authentication, CSRF, strict request shapes and a named timezone', async (t) => {
  const f = fixture(t);
  f.addVersion();
  assert.equal((await f.app.inject('/api/progress')).statusCode, 401);
  assert.equal((await f.app.inject({ method: 'PUT', url: '/api/progress/modules/module/sections/module-first',
    payload: { versionId: 'module-v1' } })).statusCode, 401);
  for (const headers of [{ cookie: f.alice.cookie }, { cookie: f.alice.cookie, 'x-csrf-token': '0'.repeat(64) }]) {
    assert.equal((await f.app.inject({ url: '/api/progress', headers })).statusCode, 403);
    assert.equal((await f.app.inject({ method: 'PUT', url: '/api/progress/modules/module/sections/module-first',
      headers, payload: { versionId: 'module-v1' } })).statusCode, 403);
    assert.equal((await f.app.inject({ method: 'PATCH', url: '/api/progress/goal', headers, payload: { weeklyGoal: 2 } })).statusCode, 403);
  }
  // Another tab can replace the browser cookie after the UI fetched Alice's
  // identity. Do not return Bob's progress to a client still holding Alice's token.
  assert.equal((await f.app.inject({ url: '/api/progress',
    headers: { cookie: f.bob.cookie, 'x-csrf-token': f.alice.headers['x-csrf-token'] } })).statusCode, 403);
  for (const payload of [{}, { versionId: 1 }, { versionId: '' }, { versionId: 'module-v1', userId: f.bob.id }]) {
    assert.equal((await f.app.inject({ method: 'PUT', url: '/api/progress/modules/module/sections/module-first',
      headers: f.alice.headers, payload })).statusCode, 400);
  }
  for (const query of ['timeZone=Moon%2FCrater', 'timeZone=%2B01%3A00', 'timeZone=', 'userId=alice', 'timeZone=UTC&timeZone=UTC']) {
    assert.equal((await f.app.inject({ url: `/api/progress?${query}`, headers: f.alice.headers })).statusCode, 400, query);
  }
  const response = await f.app.inject({ url: '/api/progress?timeZone=America%2FNew_York', headers: f.alice.headers });
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.json<LearningProgress>().timeZone, 'America/New_York');
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_module_progress').get()!.count, 0);
});

test('section completion is sparse, atomic, retry-safe and isolated; only all sections complete a module', async (t) => {
  const f = fixture(t);
  f.addVersion();
  const empty = (await f.read()).json<LearningProgress>();
  assert.deepEqual(empty.modules, []);
  assert.equal(empty.totalXp, 0);
  assert.equal(empty.weeklyGoal, 3);
  const first = await f.mark();
  assert.equal(first.statusCode, 200, first.body);
  const firstProgress = first.json<LearningProgress>();
  assert.equal(firstProgress.totalXp, 10);
  assert.equal(firstProgress.completedModules, 0);
  assert.deepEqual(firstProgress.modules[0]?.completedPartIds, ['module-first']);
  assert.equal(firstProgress.modules[0]?.completedAt, null);
  const revision = f.database.prepare('SELECT revision FROM user_module_progress').get()!.revision;
  assert.deepEqual((await f.mark()).json(), firstProgress);
  assert.equal(f.database.prepare('SELECT revision FROM user_module_progress').get()!.revision, revision);
  const second = await f.mark('second');
  assert.equal(second.statusCode, 200, second.body);
  const completed = second.json<LearningProgress>();
  assert.equal(completed.totalXp, 40);
  assert.equal(completed.completedSections, 2);
  assert.equal(completed.completedModules, 1);
  assert.equal(completed.weeklyCompleted, 1);
  assert.ok(completed.modules[0]?.completedAt);
  assert.equal(completed.modules[0]?.completedVersionId, 'module-v1');
  assert.equal(completed.modules[0]?.lastPartId, 'module-second');
  assert.deepEqual((await f.mark('second')).json(), completed);
  assert.deepEqual((await f.read(f.bob.headers)).json(), empty);
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_lesson_part_progress').get()!.count, 2);
});

test('new versions require rereading current sections without awarding repeated XP or overwriting historical completion', async (t) => {
  const f = fixture(t);
  f.addVersion();
  await f.mark();
  const completed = (await f.mark('second')).json<LearningProgress>();
  f.addVersion('module', 2, { parts: ['first', 'third'] });
  f.addVersion('module', 3, { parts: ['private-draft'], publish: false });
  const updated = (await f.read()).json<LearningProgress>();
  assert.equal(updated.modules[0]?.versionId, 'module-v2');
  assert.deepEqual(updated.modules[0]?.completedPartIds, []);
  assert.equal(updated.modules[0]?.lastPartId, null);
  assert.equal(updated.modules[0]?.completedAt, completed.modules[0]?.completedAt);
  assert.equal((await f.mark()).statusCode, 409);
  assert.equal((await f.mark('private-draft', 'module', 'module-v3')).statusCode, 409);
  assert.equal((await f.mark('second', 'module', 'module-v2')).statusCode, 404);
  const reread = (await f.mark('first', 'module', 'module-v2')).json<LearningProgress>();
  assert.equal(reread.totalXp, 40);
  assert.deepEqual(reread.modules[0]?.completedPartIds, ['module-first']);
  const finished = (await f.mark('third', 'module', 'module-v2')).json<LearningProgress>();
  assert.equal(finished.totalXp, 50);
  assert.equal(finished.completedSections, 3);
  assert.equal(finished.completedModules, 1);
  assert.equal(finished.modules[0]?.completedVersionId, 'module-v1');
  assert.equal(finished.modules[0]?.completedAt, completed.modules[0]?.completedAt);
  assert.equal(finished.weeklyCompleted, 1);
});

test('sections read across different versions cannot combine into a first module completion', async (t) => {
  const f = fixture(t);
  f.addVersion();
  await f.mark('first');
  f.addVersion('module', 2);
  const partial = (await f.mark('second', 'module', 'module-v2')).json<LearningProgress>();
  assert.equal(partial.totalXp, 20);
  assert.equal(partial.completedModules, 0);
  assert.deepEqual(partial.modules[0]?.completedPartIds, ['module-second']);
  const complete = (await f.mark('first', 'module', 'module-v2')).json<LearningProgress>();
  assert.equal(complete.totalXp, 40);
  assert.equal(complete.completedModules, 1);
  assert.equal(complete.modules[0]?.completedVersionId, 'module-v2');
});

test('hidden content cannot be read or mutated via progress, while earned totals are retained', async (t) => {
  const f = fixture(t);
  f.addVersion();
  await f.mark();
  await f.mark('second');
  for (const [table, id] of [['modules', 'module'], ['units', 'root'], ['units', 'basics'], ['topics', 'topic'], ['categories', 'category_software']]) {
    f.database.prepare(`UPDATE ${table} SET status = 'archived' WHERE id = ?`).run(id!);
    const response = await f.read();
    const progress = response.json<LearningProgress>();
    assert.deepEqual(progress.modules, [], `${table} ${id}`);
    assert.equal(progress.totalXp, 40);
    assert.doesNotMatch(response.body, /module-v1|module-first|module-second/);
    assert.equal((await f.mark()).statusCode, 404);
    f.database.prepare(`UPDATE ${table} SET status = 'published' WHERE id = ?`).run(id!);
  }
  f.database.exec('DELETE FROM topic_categories');
  assert.deepEqual((await f.read()).json<LearningProgress>().modules, []);
  assert.equal((await f.mark()).statusCode, 404);
  assert.equal((await f.mark('first', 'missing')).statusCode, 404);
});

test('unsupported completion policies and required exercises cannot be bypassed by reading', async (t) => {
  const f = fixture(t);
  f.addVersion('policy', 1, { policy: { requiredScore: 1 } });
  f.addVersion('exercise', 1, { requiredExercise: true });
  for (const id of ['policy', 'exercise']) {
    const response = await f.mark('first', id);
    assert.equal(response.statusCode, 409, response.body);
    assert.equal(response.json().code, 'COMPLETION_UNSUPPORTED');
  }
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_module_progress').get()!.count, 0);
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_lesson_part_progress').get()!.count, 0);
});

test('weekly goals are bounded, saved per account, and reject extra data', async (t) => {
  const f = fixture(t);
  const save = (payload: object, query = '') => f.app.inject({ method: 'PATCH', url: `/api/progress/goal${query}`, headers: f.alice.headers, payload });
  for (const payload of [{}, { weeklyGoal: 0 }, { weeklyGoal: 15 }, { weeklyGoal: 2.5 }, { weeklyGoal: '3' }, { weeklyGoal: 2, userId: f.bob.id }]) {
    assert.equal((await save(payload)).statusCode, 400);
  }
  assert.equal((await save({ weeklyGoal: 4 }, '?timeZone=not-a-zone')).statusCode, 400);
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_learning_goals').get()!.count, 0);
  for (const weeklyGoal of [1, 14, 4]) {
    const response = await save({ weeklyGoal });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json<LearningProgress>().weeklyGoal, weeklyGoal);
  }
  assert.equal(new ProgressService(f.database).read(f.alice.id).weeklyGoal, 4);
  assert.equal((await f.read(f.bob.headers)).json<LearningProgress>().weeklyGoal, 3);
  assert.throws(() => f.database.prepare('UPDATE user_learning_goals SET weekly_goal = 0').run());
});

test('the additive learning-goals migration preserves existing completion history', async (t) => {
  const f = fixture(t);
  f.addVersion();
  await f.mark();
  await f.mark('second');
  const before = (await f.read()).json<LearningProgress>();
  // Recreate the preceding release's schema in this disposable in-memory fixture.
  f.database.exec('DROP TABLE user_learning_goals');
  f.database.prepare('DELETE FROM schema_migrations WHERE id = ?').run('0006_learning_goals');
  assert.equal(assertMigrationHistory(f.database, true), migrations.length - 1);
  assert.equal(applyMigrations(f.database), 1);
  assert.equal(applyMigrations(f.database), 0);
  assert.deepEqual((await f.read()).json(), before);
  assert.deepEqual(f.database.prepare('PRAGMA foreign_key_check').all(), []);
});

test('weekly completions use Monday in the learner timezone across DST and year boundaries', (t) => {
  const f = fixture(t);
  let now = new Date('2026-03-09T03:59:00Z'); // Sunday 23:59 after the New York DST transition.
  const progress = new ProgressService(f.database, () => now);
  f.addVersion('previous', 1, { parts: ['first'] });
  progress.completeSection(f.alice.id, 'previous', 'previous-first', 'previous-v1', 'America/New_York');
  now = new Date('2026-03-09T04:00:00Z'); // Local Monday starts, only 167 hours after last Monday.
  let state = progress.read(f.alice.id, 'America/New_York');
  assert.equal(state.weekStartsOn, '2026-03-09');
  assert.equal(state.weeklyCompleted, 0);
  assert.equal(progress.read(f.alice.id, 'UTC').weeklyCompleted, 1);
  f.addVersion('current', 1, { parts: ['first'] });
  progress.completeSection(f.alice.id, 'current', 'current-first', 'current-v1', 'America/New_York');
  state = progress.read(f.alice.id, 'America/New_York');
  assert.equal(state.weeklyCompleted, 1);
  assert.equal(state.completedModules, 2);
  assert.deepEqual(progressWeek(new Date('2026-11-02T04:59:00Z'), 'America/New_York'), { startsOn: '2026-10-26', endsBefore: '2026-11-02' });
  assert.deepEqual(progressWeek(new Date('2026-11-02T05:00:00Z'), 'America/New_York'), { startsOn: '2026-11-02', endsBefore: '2026-11-09' });
  assert.deepEqual(progressWeek(new Date('2026-01-01T12:00:00Z'), 'Pacific/Auckland'), { startsOn: '2025-12-29', endsBefore: '2026-01-05' });
  assert.equal(progressTimeZone('UTC'), 'UTC');
});
