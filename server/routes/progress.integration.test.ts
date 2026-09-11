import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import type { FastifyInstance } from 'fastify';
import type { SessionResponse } from '../../shared/auth.js';
import type { ModuleDetail } from '../../shared/curriculum.js';
import type { LearningProgress } from '../../shared/progress.js';
import { buildApp } from '../app.js';
import { createAuthService } from '../auth/service.js';
import { loadConfig } from '../config.js';
import { cppBasicsIds, installCppBasics } from '../content/cpp-basics.js';
import { initializeDatabase, openDatabase } from '../db/database.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-progress-integration-'));
  const project = join(directory, 'project');
  const apps: FastifyInstance[] = [];
  t.after(async () => {
    for (const app of apps) await app.close();
    await rm(directory, { recursive: true, force: true });
  });
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'),
    APP_ORIGIN: 'http://localhost:3000', LOG_LEVEL: 'silent' }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  const password = 'a test account password';
  try {
    installCppBasics(database);
    const auth = createAuthService(database, config);
    for (const username of ['alice', 'bob']) {
      await auth.createAccount({ username, displayName: username, role: 'member', password });
    }
  } finally {
    database.close();
  }
  async function openApp() {
    const app = await buildApp(config, { logger: false });
    apps.push(app);
    return app;
  }
  const app = await openApp();
  async function login(username: string) {
    const response = await app.inject({ method: 'POST', url: '/api/auth/login',
      headers: { 'x-alexandria-request': '1' }, payload: { username, password } });
    assert.equal(response.statusCode, 200, response.body);
    const session = response.json<Exclude<SessionResponse, { user: null }>>();
    return { cookie: String(response.headers['set-cookie']).split(';')[0]!, 'x-csrf-token': session.csrfToken,
      'x-alexandria-request': '1' };
  }
  const alice = await login('alice');
  const bob = await login('bob');
  const detailResponse = await app.inject(`/api/modules/${cppBasicsIds.module}`);
  assert.equal(detailResponse.statusCode, 200, detailResponse.body);
  const detail = detailResponse.json<ModuleDetail>();
  return { app, openApp, alice, bob, detail,
    sectionUrl: `/api/progress/modules/${detail.module.id}/sections/${detail.parts[0]!.id}` };
}

test('progress routes enforce application origin, request marker and session identity together', async (t) => {
  const f = await fixture(t);
  const changes = [
    { method: 'PUT' as const, url: f.sectionUrl, payload: { versionId: f.detail.version.id } },
    { method: 'PATCH' as const, url: '/api/progress/goal', payload: { weeklyGoal: 7 } },
  ];
  const { 'x-alexandria-request': _marker, ...withoutMarker } = f.alice;
  const { 'x-csrf-token': _token, ...withoutToken } = f.alice;
  const rejectedHeaders = [
    withoutMarker,
    withoutToken,
    { ...f.alice, origin: 'https://foreign.example' },
    { ...f.alice, 'sec-fetch-site': 'cross-site' },
    { ...f.alice, 'x-csrf-token': '0'.repeat(64) },
    { ...f.alice, cookie: f.bob.cookie },
  ];
  for (const change of changes) {
    for (const headers of rejectedHeaders) {
      const response = await f.app.inject({ ...change, headers });
      assert.equal(response.statusCode, 403, response.body);
      assert.equal(response.headers['cache-control'], 'no-store');
    }
    const encoded = await f.app.inject({ ...change, url: change.url.replace('/api/', '/%61pi/'), headers: withoutMarker });
    assert.equal(encoded.statusCode, 403, encoded.body);
    assert.equal(encoded.json().code, 'REQUEST_HEADER_REQUIRED');
  }
  for (const headers of [withoutToken, { ...f.alice, cookie: f.bob.cookie }]) {
    const response = await f.app.inject({ url: '/api/progress', headers });
    assert.equal(response.statusCode, 403, response.body);
    assert.equal(response.json().code, 'CSRF_INVALID');
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal('modules' in response.json(), false);
  }
  for (const headers of [f.alice, f.bob]) {
    const response = await f.app.inject({ url: '/api/progress', headers });
    assert.equal(response.statusCode, 200, response.body);
    const progress = response.json<LearningProgress>();
    assert.deepEqual(progress.modules, []);
    assert.equal(progress.totalXp, 0);
    assert.equal(progress.weeklyGoal, 3);
  }
  for (const change of changes) {
    const response = await f.app.inject({ ...change, headers: { ...f.alice, origin: 'http://localhost:3000' } });
    assert.equal(response.statusCode, 200, response.body);
  }
  const saved = (await f.app.inject({ url: '/api/progress', headers: f.alice })).json<LearningProgress>();
  assert.equal(saved.weeklyGoal, 7);
  assert.equal(saved.totalXp, 10);
  assert.deepEqual(saved.modules[0]?.completedPartIds, [f.detail.parts[0]!.id]);
  const other = (await f.app.inject({ url: '/api/progress', headers: f.bob })).json<LearningProgress>();
  assert.deepEqual(other.modules, []);
  assert.equal(other.weeklyGoal, 3);
});

test('saved reading and goals survive app restart, and logout revokes access to them', async (t) => {
  const f = await fixture(t);
  const goal = await f.app.inject({ method: 'PATCH', url: '/api/progress/goal', headers: f.alice, payload: { weeklyGoal: 5 } });
  assert.equal(goal.statusCode, 200, goal.body);
  for (const part of f.detail.parts) {
    const response = await f.app.inject({ method: 'PUT',
      url: `/api/progress/modules/${f.detail.module.id}/sections/${part.id}`,
      headers: f.alice, payload: { versionId: f.detail.version.id } });
    assert.equal(response.statusCode, 200, response.body);
  }
  const saved = (await f.app.inject({ url: '/api/progress', headers: f.alice })).json<LearningProgress>();
  assert.equal(saved.completedModules, 1);
  assert.equal(saved.totalXp, f.detail.parts.length * 10 + 20);
  assert.equal(saved.weeklyGoal, 5);
  await f.app.close();
  const reopened = await f.openApp();
  const restored = await reopened.inject({ url: '/api/progress', headers: f.alice });
  assert.equal(restored.statusCode, 200, restored.body);
  assert.deepEqual(restored.json(), saved);
  const retry = await reopened.inject({ method: 'PUT', url: f.sectionUrl, headers: f.alice,
    payload: { versionId: f.detail.version.id } });
  assert.equal(retry.statusCode, 200, retry.body);
  assert.deepEqual(retry.json(), saved);
  assert.equal((await reopened.inject({ method: 'POST', url: '/api/auth/logout', headers: f.alice })).statusCode, 204);
  for (const request of [
    { method: 'GET' as const, url: '/api/progress' },
    { method: 'PUT' as const, url: f.sectionUrl, payload: { versionId: f.detail.version.id } },
    { method: 'PATCH' as const, url: '/api/progress/goal', payload: { weeklyGoal: 2 } },
  ]) {
    const response = await reopened.inject({ ...request, headers: f.alice });
    assert.equal(response.statusCode, 401, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
  }
});
