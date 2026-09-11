import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import { loadConfig } from '../config.js';
import { assertDatabaseIntegrity, initializeDatabase, openDatabase } from './database.js';

const userId = '11111111-1111-4111-8111-111111111111';
const startedAt = '2030-01-01T10:00:00.000Z';
const activityAt = '2030-01-01T10:05:00.000Z';
const laterAt = '2030-01-01T10:10:00.000Z';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-curriculum-'));
  const project = join(directory, 'project');
  mkdirSync(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent' }, project);
  initializeDatabase(config);
  const db = openDatabase(config, { writable: true });
  t.after(async () => { db.close(); await rm(directory, { recursive: true, force: true }); });
  return { db, config };
}

function catalog(db: DatabaseSync) {
  db.exec(`
    INSERT INTO users(id, username, display_name, role, status, created_at, updated_at)
      VALUES ('${userId}', 'learner', 'Learner', 'member', 'active', '${startedAt}', '${startedAt}');
    INSERT INTO topics(id, slug, name) VALUES ('topic', 'topic', 'Topic'), ('other_topic', 'other-topic', 'Other topic');
    INSERT INTO units(id, topic_id, name, slug) VALUES ('root', 'topic', 'Root', 'root'), ('other_root', 'other_topic', 'Other', 'root');
    INSERT INTO units(id, topic_id, parent_unit_id, name, slug) VALUES ('child', 'topic', 'root', 'Child', 'child');
    INSERT INTO units(id, topic_id, parent_unit_id, name, slug) VALUES ('grandchild', 'topic', 'child', 'Grandchild', 'grandchild');
    INSERT INTO modules(id, unit_id, title, slug) VALUES ('module', 'root', 'Module', 'module'), ('other_module', 'other_root', 'Other module', 'module');
  `);
}

function version(db: DatabaseSync, id = 'version', module = 'module', number = 1, includeSpec = true) {
  db.prepare('INSERT INTO module_versions(id, module_id, version, title) VALUES (?, ?, ?, ?)').run(id, module, number, `Version ${number}`);
  db.prepare('INSERT INTO lesson_parts(id, module_id) VALUES (?, ?) ON CONFLICT DO NOTHING').run(`part_${module}`, module);
  db.prepare('INSERT INTO lesson_part_versions(lesson_part_id, module_version_id, module_id, title) VALUES (?, ?, ?, ?)')
    .run(`part_${module}`, id, module, 'Lesson part');
  db.prepare('INSERT INTO exercises(id, module_id) VALUES (?, ?) ON CONFLICT DO NOTHING').run(`exercise_${module}`, module);
  db.prepare(`INSERT INTO exercise_versions(id, exercise_id, module_version_id, module_id, lesson_part_id, kind, prompt_json, grading_method)
    VALUES (?, ?, ?, ?, ?, 'structured', '{}', 'manual')`).run(`exercise_${id}`, `exercise_${module}`, id, module, `part_${module}`);
  if (includeSpec) db.prepare('INSERT INTO exercise_grading_specs(exercise_version_id, spec_json) VALUES (?, ?)').run(`exercise_${id}`, '{}');
}

function publish(db: DatabaseSync, id = 'version') {
  db.prepare("UPDATE module_versions SET status = 'published', published_at = created_at, revision = revision + 1 WHERE id = ?").run(id);
}

function start(db: DatabaseSync, module = 'module', id = 'version') {
  db.prepare(`INSERT INTO user_module_progress(user_id, module_id, last_module_version_id, started_at, last_activity_at)
    VALUES (?, ?, ?, ?, ?)`).run(userId, module, id, startedAt, startedAt);
}

function attempt(db: DatabaseSync, id = 'attempt', key = 'request-1', versionId = 'version', module = 'module') {
  return db.prepare(`INSERT INTO exercise_attempts(id, user_id, module_id, module_version_id, exercise_version_id, submission_key, response_json, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, '{}', ?)`).run(id, userId, module, versionId, `exercise_${versionId}`, key, activityAt);
}

test('initialization creates empty curriculum and sparse learner tables without lesson seeds', async (t) => {
  const { db } = await fixture(t);
  for (const table of ['units', 'modules', 'module_versions', 'lesson_parts', 'lesson_part_versions', 'exercises', 'exercise_versions',
    'exercise_grading_specs', 'source_references', 'module_version_sources', 'user_module_progress', 'user_lesson_part_progress',
    'exercise_drafts', 'exercise_attempts', 'exercise_attempt_results']) {
    assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count, 0, table);
  }
  catalog(db);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM user_module_progress').get()?.count, 0);
  assertDatabaseIntegrity(db);
});

test('unit hierarchy rejects cross-topic parents and arbitrary cycles, including deferred inserts', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  assert.throws(() => db.exec("UPDATE units SET parent_unit_id = 'other_root' WHERE id = 'child'"), /FOREIGN KEY/);
  assert.throws(() => db.exec("UPDATE units SET parent_unit_id = 'root' WHERE id = 'root'"), /cycle|CHECK/);
  assert.throws(() => db.exec("UPDATE units SET parent_unit_id = 'grandchild' WHERE id = 'root'"), /cycle/);
  assert.throws(() => db.exec("UPDATE units SET topic_id = 'other_topic' WHERE id = 'root'"), /immutable/);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec("UPDATE units SET name = 'Temporary name' WHERE id = 'child'");
    assert.throws(() => db.exec("UPDATE units SET parent_unit_id = 'grandchild' WHERE id = 'root'"), /cycle/);
  } finally { db.exec('ROLLBACK'); }
  assert.equal(db.prepare("SELECT name FROM units WHERE id = 'child'").get()?.name, 'Child');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('PRAGMA defer_foreign_keys = ON');
    db.exec("INSERT INTO units(id, topic_id, parent_unit_id, name, slug) VALUES ('a', 'topic', 'b', 'A', 'a')");
    assert.throws(() => db.exec("INSERT INTO units(id, topic_id, parent_unit_id, name, slug) VALUES ('b', 'topic', 'a', 'B', 'b')"), /cycle/);
  } finally { db.exec('ROLLBACK'); }
  assert.equal(db.prepare("SELECT id FROM units WHERE id = 'a'").get(), undefined);
  db.exec("UPDATE units SET parent_unit_id = 'root' WHERE id = 'grandchild'");
  assert.equal(db.prepare("SELECT parent_unit_id FROM units WHERE id = 'grandchild'").get()?.parent_unit_id, 'root');
  assert.throws(() => db.exec("DELETE FROM units WHERE id = 'root'"), /FOREIGN KEY/);
  assertDatabaseIntegrity(db);
});

test('catalog ordering, slugs, lifecycle fields and timestamps have database constraints', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  for (const sql of [
    "UPDATE units SET position = -1 WHERE id = 'root'",
    "UPDATE units SET status = 'unknown' WHERE id = 'root'",
    "UPDATE units SET updated_at = 'invalid' WHERE id = 'root'",
    "UPDATE modules SET position = -1 WHERE id = 'module'",
    "UPDATE modules SET is_required = 2 WHERE id = 'module'",
    "UPDATE modules SET status = 'unknown' WHERE id = 'module'",
    "INSERT INTO units(id, topic_id, name, slug) VALUES ('duplicate', 'topic', 'Duplicate', 'root')",
    "INSERT INTO modules(id, unit_id, title, slug) VALUES ('duplicate', 'root', 'Duplicate', 'module')",
  ]) assert.throws(() => db.exec(sql), /CHECK|UNIQUE/);
  assert.throws(() => db.exec("UPDATE modules SET status = 'published' WHERE id = 'module'"), /published version/);
  db.exec("UPDATE units SET parent_unit_id = 'root', position = 0 WHERE id = 'grandchild'");
  assert.deepEqual(db.prepare("SELECT id FROM units WHERE parent_unit_id = 'root' ORDER BY position, id").all().map((row) => row.id), ['child', 'grandchild']);
});

test('version ownership prevents combining another module or lesson part with an exercise', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  version(db);
  version(db, 'other_version', 'other_module');
  for (const sql of [
    "UPDATE lesson_part_versions SET module_id = 'other_module' WHERE module_version_id = 'version'",
    "UPDATE lesson_part_versions SET lesson_part_id = 'part_other_module' WHERE module_version_id = 'version'",
    "UPDATE exercise_versions SET exercise_id = 'exercise_other_module' WHERE id = 'exercise_version'",
    "UPDATE exercise_versions SET lesson_part_id = 'part_other_module' WHERE id = 'exercise_version'",
    "UPDATE exercise_versions SET module_version_id = 'other_version' WHERE id = 'exercise_version'",
    "INSERT INTO exercise_grading_specs(exercise_version_id, spec_json) VALUES ('missing', '{}')",
  ]) assert.throws(() => db.exec(sql), /FOREIGN KEY/);
  assert.throws(() => db.exec("INSERT INTO module_versions(id, module_id, version, title) VALUES ('duplicate', 'module', 1, 'Title')"), /UNIQUE/);
  assert.throws(() => db.exec("INSERT INTO module_versions(id, module_id, version, title) VALUES ('zero', 'module', 0, 'Title')"), /CHECK/);
  assert.throws(() => db.exec("UPDATE lesson_part_versions SET content_json = '{}' WHERE module_version_id = 'version'"), /CHECK/);
  assert.throws(() => db.exec("UPDATE exercise_grading_specs SET spec_json = 'not JSON'"), /CHECK|malformed JSON/);
  version(db, 'version_2', 'module', 2);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM lesson_parts WHERE module_id = 'module'").get()?.count, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM exercise_versions WHERE exercise_id = 'exercise_module'").get()?.count, 2);
  assertDatabaseIntegrity(db);
});

test('publication validates associations and freezes content, grading keys, and citations', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  db.exec("INSERT INTO module_versions(id, module_id, version, title) VALUES ('empty', 'module', 1, 'Empty')");
  assert.throws(() => publish(db, 'empty'), /lesson parts/);
  db.exec("DELETE FROM module_versions WHERE id = 'empty'");
  version(db, 'version', 'module', 1, false);
  assert.throws(() => publish(db), /grading specifications/);
  db.exec("INSERT INTO exercise_grading_specs(exercise_version_id, spec_json, solution_json) VALUES ('exercise_version', '{}', '{\"answer\":42}')");
  db.exec(`
    INSERT INTO source_references(id, title) VALUES ('source', 'Reference title'), ('extra_source', 'Another reference');
    INSERT INTO module_version_sources(module_version_id, source_reference_id, locator) VALUES ('version', 'source', 'Chapter 2');
    UPDATE lesson_part_versions SET content_json = '[{"type":"explanation"}]' WHERE module_version_id = 'version';
    UPDATE exercise_versions SET prompt_json = '{"prompt":"Updated"}' WHERE id = 'exercise_version';
    UPDATE exercise_grading_specs SET spec_json = '{"rubric":"Updated"}' WHERE exercise_version_id = 'exercise_version';
    UPDATE module_version_sources SET locator = 'Chapter 3' WHERE module_version_id = 'version';
    UPDATE source_references SET title = 'Corrected reference title' WHERE id = 'source';
  `);
  assert.throws(() => db.exec("UPDATE module_versions SET title = 'Stale write' WHERE id = 'version'"), /revision/);
  db.exec("UPDATE module_versions SET title = 'Reviewed', revision = revision + 1 WHERE id = 'version'");
  publish(db);
  db.exec("UPDATE modules SET status = 'published' WHERE id = 'module'");
  for (const sql of [
    "UPDATE module_versions SET title = 'Edited', revision = revision + 1 WHERE id = 'version'",
    "DELETE FROM module_versions WHERE id = 'version'",
    "UPDATE lesson_part_versions SET title = 'Edited' WHERE module_version_id = 'version'",
    "DELETE FROM lesson_part_versions WHERE module_version_id = 'version'",
    "INSERT OR REPLACE INTO lesson_part_versions(lesson_part_id, module_version_id, module_id, title) VALUES ('part_module', 'version', 'module', 'Replacement')",
    "UPDATE exercise_versions SET prompt_json = '{}' WHERE id = 'exercise_version'",
    "DELETE FROM exercise_versions WHERE id = 'exercise_version'",
    "UPDATE exercise_grading_specs SET spec_json = '{}' WHERE exercise_version_id = 'exercise_version'",
    "DELETE FROM exercise_grading_specs WHERE exercise_version_id = 'exercise_version'",
    "INSERT OR REPLACE INTO exercise_grading_specs(exercise_version_id, spec_json) VALUES ('exercise_version', '{}')",
    "UPDATE module_version_sources SET locator = 'Changed' WHERE module_version_id = 'version'",
    "DELETE FROM module_version_sources WHERE module_version_id = 'version'",
    "INSERT INTO module_version_sources(module_version_id, source_reference_id) VALUES ('version', 'extra_source')",
    "UPDATE source_references SET title = 'Changed' WHERE id = 'source'",
  ]) assert.throws(() => db.exec(sql), /immutable/);
  assert.throws(() => db.exec("DELETE FROM source_references WHERE id = 'source'"), /FOREIGN KEY/);
  assert.throws(() => db.exec("INSERT INTO source_references(id, title, url) VALUES ('private', 'Private', 'file:///private/book.pdf')"), /CHECK/);
  for (const table of ['lesson_parts', 'exercises', 'modules', 'units', 'topics']) {
    assert.throws(() => db.exec(`DELETE FROM ${table}`), /FOREIGN KEY/);
  }
  // Further drafts can reuse stable identities while the earlier release stays frozen.
  version(db, 'version_2', 'module', 2);
  db.exec("UPDATE lesson_part_versions SET title = 'New draft' WHERE module_version_id = 'version_2'");
  assert.equal(db.prepare("SELECT title FROM lesson_part_versions WHERE module_version_id = 'version'").get()?.title, 'Lesson part');
});

test('progress enforces published ownership, sparse starts, statuses, and completion consistency', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  version(db);
  version(db, 'other_version', 'other_module');
  assert.throws(() => start(db), /published/);
  publish(db);
  publish(db, 'other_version');
  assert.throws(() => attempt(db), /FOREIGN KEY/);
  assert.throws(() => start(db, 'module', 'other_version'), /FOREIGN KEY/);
  start(db);
  for (const sql of [
    "UPDATE user_module_progress SET last_lesson_part_id = 'part_other_module', revision = revision + 1",
    "UPDATE user_module_progress SET last_module_version_id = 'other_version', revision = revision + 1",
    `UPDATE user_module_progress SET status = 'completed', completed_at = '${startedAt}', completed_module_version_id = 'other_version', revision = revision + 1`,
  ]) assert.throws(() => db.exec(sql), /FOREIGN KEY/);
  for (const sql of [
    "UPDATE user_module_progress SET status = 'not_started', revision = revision + 1",
    "UPDATE user_module_progress SET status = 'completed', revision = revision + 1",
    `UPDATE user_module_progress SET completed_at = '${startedAt}', revision = revision + 1`,
    "UPDATE user_module_progress SET last_activity_at = 'invalid', revision = revision + 1",
  ]) assert.throws(() => db.exec(sql), /CHECK/);
  assert.throws(() => start(db), /existing progress/);
  db.exec("UPDATE user_module_progress SET last_lesson_part_id = 'part_module', revision = revision + 1");
  assertDatabaseIntegrity(db);
});

test('progress revision checks handle competing writers and preserve completion during later resumes', async (t) => {
  const { db, config } = await fixture(t);
  catalog(db);
  version(db);
  version(db, 'version_2', 'module', 2);
  publish(db);
  publish(db, 'version_2');
  start(db);
  const otherWriter = openDatabase(config, { writable: true });
  try {
    const observedRevision = db.prepare('SELECT revision FROM user_module_progress').get()?.revision;
    otherWriter.prepare('UPDATE user_module_progress SET last_activity_at = ?, revision = revision + 1 WHERE revision = ?').run(activityAt, observedRevision!);
    assert.equal(db.prepare('UPDATE user_module_progress SET last_lesson_part_id = ?, revision = revision + 1 WHERE revision = ?')
      .run('part_module', observedRevision!).changes, 0);
  } finally { otherWriter.close(); }
  assert.throws(() => db.exec('UPDATE user_module_progress SET revision = revision'), /revision/);
  assert.throws(() => db.exec(`UPDATE user_module_progress SET last_activity_at = '${startedAt}', revision = revision + 1`), /activity/);
  db.exec(`UPDATE user_module_progress SET status = 'completed', completed_at = '${activityAt}', completed_module_version_id = 'version', revision = revision + 1`);
  assert.throws(() => db.exec("UPDATE user_module_progress SET status = 'in_progress', completed_at = NULL, completed_module_version_id = NULL, revision = revision + 1"), /cannot regress/);
  assert.throws(() => db.exec("UPDATE user_module_progress SET completed_module_version_id = 'version_2', revision = revision + 1"), /cannot regress/);
  assert.throws(() => db.exec('DELETE FROM user_module_progress'), /cannot be deleted/);
  db.exec('PRAGMA recursive_triggers = OFF');
  assert.throws(() => db.exec(`INSERT OR REPLACE INTO user_module_progress(user_id, module_id, last_module_version_id, started_at, last_activity_at)
    VALUES ('${userId}', 'module', 'version', '${startedAt}', '${startedAt}')`), /existing progress/);
  db.exec(`UPDATE user_module_progress SET last_module_version_id = 'version_2', last_lesson_part_id = 'part_module', last_activity_at = '${laterAt}', revision = revision + 1`);
  const progress = db.prepare('SELECT * FROM user_module_progress').get();
  assert.equal(progress?.status, 'completed');
  assert.equal(progress?.completed_module_version_id, 'version');
  assert.equal(progress?.last_module_version_id, 'version_2');
  assert.equal(progress?.started_at, startedAt);
});

test('lesson completions and exercise drafts require owned versions and real module starts', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  version(db);
  version(db, 'other_version', 'other_module');
  publish(db);
  publish(db, 'other_version');
  const lesson = db.prepare(`INSERT INTO user_lesson_part_progress(user_id, module_id, module_version_id, lesson_part_id, completed_at) VALUES (?, ?, ?, ?, ?)`);
  assert.throws(() => lesson.run(userId, 'module', 'version', 'part_module', activityAt), /FOREIGN KEY/);
  start(db);
  assert.throws(() => lesson.run(userId, 'module', 'other_version', 'part_other_module', activityAt), /FOREIGN KEY/);
  assert.throws(() => lesson.run(userId, 'module', 'version', 'part_module', '2029-01-01T00:00:00.000Z'), /precede/);
  lesson.run(userId, 'module', 'version', 'part_module', activityAt);
  assert.throws(() => db.exec('DELETE FROM user_lesson_part_progress'), /immutable/);
  assert.throws(() => db.exec(`UPDATE user_lesson_part_progress SET completed_at = '${laterAt}'`), /immutable/);
  assert.throws(() => lesson.run(userId, 'module', 'version', 'part_module', laterAt), /immutable/);
  const draft = db.prepare(`INSERT INTO exercise_drafts(user_id, module_id, module_version_id, exercise_version_id, response_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
  assert.throws(() => draft.run(userId, 'module', 'other_version', 'exercise_other_version', '{}', activityAt), /FOREIGN KEY/);
  assert.throws(() => draft.run(userId, 'module', 'version', 'exercise_version', '[]', activityAt), /CHECK/);
  draft.run(userId, 'module', 'version', 'exercise_version', '{"answer":"Work in progress"}', activityAt);
  assert.throws(() => db.exec("UPDATE exercise_drafts SET response_json = '{}'"), /revision/);
  assert.throws(() => db.exec(`UPDATE exercise_drafts SET updated_at = '${startedAt}', revision = revision + 1`), /timestamp/);
  assert.equal(db.prepare("UPDATE exercise_drafts SET response_json = '{}', revision = revision + 1 WHERE revision = 1").run().changes, 1);
  assert.equal(db.prepare("UPDATE exercise_drafts SET response_json = '{}', revision = revision + 1 WHERE revision = 1").run().changes, 0);
  db.exec('DELETE FROM exercise_drafts');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM exercise_drafts').get()?.count, 0);
});

test('attempts retain versioned submitted work, isolate idempotency, and append grading history', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  version(db);
  version(db, 'version_2', 'module', 2);
  version(db, 'other_version', 'other_module');
  publish(db);
  publish(db, 'version_2');
  publish(db, 'other_version');
  start(db);
  attempt(db);
  assert.throws(() => attempt(db, 'duplicate', 'request-1'), /duplicated/);
  assert.throws(() => attempt(db, 'mismatched', 'request-other', 'other_version', 'module'), /FOREIGN KEY/);
  attempt(db, 'retry', 'request-2', 'version_2');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM exercise_attempts').get()?.count, 2);
  assert.throws(() => db.exec("UPDATE exercise_attempts SET response_json = '{\"answer\":42}'"), /immutable/);
  assert.throws(() => db.exec('DELETE FROM exercise_attempts'), /immutable/);
  db.exec('PRAGMA recursive_triggers = OFF');
  assert.throws(() => db.exec(`INSERT OR REPLACE INTO exercise_attempts(id, user_id, module_id, module_version_id, exercise_version_id, submission_key, response_json, submitted_at)
    VALUES ('attempt', '${userId}', 'module', 'version', 'exercise_version', 'replacement', '{}', '${activityAt}')`), /replaced/);
  const result = db.prepare(`INSERT INTO exercise_attempt_results(attempt_id, sequence, status, outcome, error_code, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`);
  assert.throws(() => result.run('attempt', 2, 'running', null, null, activityAt), /sequence/);
  assert.throws(() => result.run('attempt', 1, 'running', null, null, startedAt), /backwards/);
  assert.throws(() => result.run('attempt', 1, 'failed', 'incorrect', 'TIMEOUT', activityAt), /CHECK/);
  result.run('attempt', 1, 'running', null, null, activityAt);
  result.run('attempt', 2, 'failed', null, 'RUNNER_UNAVAILABLE', activityAt);
  result.run('attempt', 3, 'running', null, null, laterAt);
  result.run('attempt', 4, 'graded', 'incorrect', null, laterAt);
  assert.throws(() => result.run('attempt', 5, 'graded', 'correct', null, laterAt), /final grade/);
  assert.throws(() => db.exec("UPDATE exercise_attempt_results SET outcome = 'correct' WHERE status = 'graded'"), /immutable/);
  assert.throws(() => db.exec('DELETE FROM exercise_attempt_results'), /immutable/);
  assert.equal(db.prepare("SELECT status FROM exercise_attempt_results WHERE attempt_id = 'attempt' ORDER BY sequence DESC LIMIT 1").get()?.status, 'graded');
  assert.equal(db.prepare("SELECT module_version_id FROM exercise_attempts WHERE id = 'attempt'").get()?.module_version_id, 'version');
  assert.throws(() => db.exec(`DELETE FROM users WHERE id = '${userId}'`), /FOREIGN KEY/);
  assertDatabaseIntegrity(db);
});

test('submission and progress writes can roll back atomically without leaving an orphan attempt', async (t) => {
  const { db } = await fixture(t);
  catalog(db);
  version(db);
  publish(db);
  start(db);
  db.exec('BEGIN IMMEDIATE');
  try {
    attempt(db);
    assert.throws(() => db.exec("UPDATE user_module_progress SET status = 'completed', revision = revision + 1"), /CHECK/);
  } finally { db.exec('ROLLBACK'); }
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM exercise_attempts').get()?.count, 0);
  assert.equal(db.prepare('SELECT status FROM user_module_progress').get()?.status, 'in_progress');
  assertDatabaseIntegrity(db);
});
