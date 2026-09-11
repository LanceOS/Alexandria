import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../app.js';
import { createAuthService } from '../auth/service.js';
import { loadConfig } from '../config.js';
import { initializeDatabase, openDatabase } from '../db/database.js';

test('HTTP catalog protects writes, validates pagination, and preserves revisions and public discovery', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-api-test-'));
  const project = join(directory, 'project');
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent' }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  const auth = createAuthService(database, config);
  const app = await buildApp(config, { logger: false });
  t.after(async () => { await app.close(); database.close(); await rm(directory, { recursive: true, force: true }); });
  const password = 'local test password only';
  for (const role of ['admin', 'member'] as const) await auth.createAccount({ username: role, displayName: role, role, password });
  const marker = { 'x-alexandria-request': '1' };
  for (const url of ['/api/auth/login', '/%61pi/auth/login', '/a%70i/auth/login']) {
    assert.equal((await app.inject({ method: 'POST', url, payload: { username: 'admin', password } })).statusCode, 403, url);
    assert.equal((await app.inject({ method: 'POST', url, headers: { ...marker, origin: 'https://foreign.example' },
      payload: { username: 'admin', password } })).statusCode, 403, url);
  }
  const headersFor = async (username: string) => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: marker, payload: { username, password } });
    assert.equal(response.statusCode, 200, response.body);
    return { ...marker, cookie: String(response.headers['set-cookie']).split(';')[0]!, 'x-csrf-token': response.json().csrfToken as string };
  };
  const admin = await headersFor('admin');
  const member = await headersFor('member');
  for (const url of ['/api/admin/categories', '/api/admin/topics', '/api/admin/categories/category_software']) {
    assert.equal((await app.inject(url)).statusCode, 401);
    assert.equal((await app.inject({ url, headers: member })).statusCode, 403);
  }
  const create = { slug: 'api-test-topic', name: 'API test topic' };
  const post = (headers: Record<string, string>, payload: Record<string, unknown> = create) => app.inject({ method: 'POST', url: '/api/admin/topics', headers, payload });
  assert.equal((await post(member)).statusCode, 403);
  assert.equal((await post({ ...marker, cookie: admin.cookie })).statusCode, 403);
  assert.equal((await post({ ...admin, origin: 'https://foreign.example' })).statusCode, 403);
  assert.equal((await post({ ...admin, 'sec-fetch-site': 'cross-site' })).statusCode, 403);
  assert.equal((await post(admin, { ...create, unexpected: true })).statusCode, 400);
  const created = await post(admin);
  assert.equal(created.statusCode, 201, created.body);
  const topic = created.json();
  assert.equal(created.headers.location, `/api/admin/topics/${topic.id}`);
  assert.equal(created.headers['cache-control'], 'no-store');
  assert.equal(topic.status, 'draft');
  assert.deepEqual((await app.inject('/api/library')).json().topics, []);
  const list = await app.inject({ url: '/api/admin/categories?limit=1&offset=1&status=published', headers: admin });
  assert.equal(list.statusCode, 200, list.body);
  assert.deepEqual(list.json().pagination, { limit: 1, offset: 1, total: 3 });
  for (const query of ['limit=101', 'limit=-1', 'limit=1.5', 'offset=abc', 'extra=1']) {
    assert.equal((await app.inject({ url: `/api/admin/categories?${query}`, headers: admin })).statusCode, 400, query);
  }
  const publish = await app.inject({ method: 'PATCH', url: `/api/admin/topics/${topic.id}`, headers: admin,
    payload: { revision: topic.revision, status: 'published', categoryPlacements: [{ categoryId: 'category_software', position: 0 }] } });
  assert.equal(publish.statusCode, 200, publish.body);
  const stale = await app.inject({ method: 'PATCH', url: `/api/admin/topics/${topic.id}`, headers: admin,
    payload: { revision: topic.revision, name: 'Stale update' } });
  assert.equal(stale.statusCode, 409);
  assert.equal(stale.json().code, 'REVISION_CONFLICT');
  assert.equal(stale.json().requestId, stale.headers['x-request-id']);
  const library = (await app.inject('/api/library')).json();
  assert.equal(library.topics[0].name, create.name);
  assert.deepEqual(library.topics[0].categoryIds, ['category_software']);
  assert.equal(Object.hasOwn(library.topics[0], 'categoryPlacements'), false);
});
