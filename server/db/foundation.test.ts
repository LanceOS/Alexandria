import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { copyFile, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import type { FastifyInstance } from 'fastify';
import type { LibraryResponse } from '../../shared/library.js';
import { buildApp } from '../app.js';
import { loadConfig } from '../config.js';
import { createBackup, withMaintenanceLock } from './backup.js';
import { assertDatabaseIntegrity, configureDatabase, initializeDatabase, openDatabase } from './database.js';
import { readLibrary } from './library.js';
import { applyMigrations, assertMigrationHistory, defineMigration, migrations } from './migrations.js';

async function fixture(t: TestContext, initialize = true) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-test-'));
  const project = join(directory, 'project');
  mkdirSync(project);
  const env = { DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent' };
  const config = loadConfig(env, project);
  const apps: FastifyInstance[] = [];
  t.after(async () => {
    for (const app of apps) await app.close();
    await rm(directory, { recursive: true, force: true });
  });
  if (initialize) initializeDatabase(config);
  return {
    directory, project, config, env,
    async app(options: Parameters<typeof buildApp>[1] = {}) {
      const app = await buildApp(config, { logger: false, ...options });
      apps.push(app);
      return app;
    },
  };
}

test('configuration validates storage containment, symlinks, port, and origin', async (t) => {
  const f = await fixture(t, false);
  assert.equal(f.config.host, '127.0.0.1');
  assert.equal(f.config.port, 3000);
  assert.equal(loadConfig({ ...f.env, APP_ORIGIN: 'http://localhost:3000/' }, f.project).appOrigin, 'http://localhost:3000');
  for (const value of ['0', '65536', '3.1', 'abc']) assert.throws(() => loadConfig({ ...f.env, PORT: value }, f.project), /PORT/);
  assert.throws(() => loadConfig({ ...f.env, DATA_DIR: 'relative' }, f.project), /absolute/);
  assert.throws(() => loadConfig({ ...f.env, DATA_DIR: join(f.project, 'data') }, f.project), /outside/);
  assert.throws(() => loadConfig({ ...f.env, DATABASE_PATH: join(f.directory, 'elsewhere.sqlite') }, f.project), /inside DATA_DIR/);
  assert.throws(() => loadConfig({ ...f.env, BACKUP_DIR: join(f.config.dataDir, 'backups') }, f.project), /non-nested/);
  for (const value of ['ftp://localhost', 'https://user:pass@localhost', 'http://localhost/path', 'http://localhost?x=1']) {
    assert.throws(() => loadConfig({ ...f.env, APP_ORIGIN: value }, f.project), /APP_ORIGIN/);
  }
  mkdirSync(f.config.dataDir);
  const outside = join(f.directory, 'outside');
  mkdirSync(outside);
  symlinkSync(outside, join(f.config.dataDir, 'database'));
  assert.throws(() => loadConfig(f.env, f.project), /inside DATA_DIR/);
  const redirected = join(f.directory, 'redirected');
  symlinkSync(f.project, redirected);
  assert.throws(() => loadConfig({ ...f.env, DATA_DIR: join(redirected, 'new-data') }, f.project), /outside/);
});

test('startup refuses missing storage and explicit initialization never overwrites data', async (t) => {
  const f = await fixture(t, false);
  await assert.rejects(f.app(), /database is missing/i);
  assert.equal(existsSync(f.config.databasePath), false);
  initializeDatabase(f.config);
  const database = openDatabase(f.config);
  const before = readLibrary(database).instance;
  database.close();
  assert.throws(() => initializeDatabase(f.config), /already exists/);
  const reopened = openDatabase(f.config);
  assert.deepEqual(readLibrary(reopened).instance, before);
  reopened.close();
});

test('SQLite sidecars cannot redirect storage and stale journals block initialization', async (t) => {
  const f = await fixture(t);
  const outside = join(f.directory, 'private-file');
  writeFileSync(outside, 'untouched');
  symlinkSync(outside, `${f.config.databasePath}-wal`);
  assert.throws(() => openDatabase(f.config), /sidecar files must be regular/);
  assert.equal(readFileSync(outside, 'utf8'), 'untouched');
  const fresh = await fixture(t, false);
  mkdirSync(join(fresh.config.dataDir, 'database'), { recursive: true });
  writeFileSync(`${fresh.config.databasePath}-wal`, 'left from an older database');
  assert.throws(() => initializeDatabase(fresh.config), /sidecar files already exist/);
  assert.equal(existsSync(fresh.config.databasePath), false);
});

test('database persists its instance and empty catalog with enforced SQLite settings', async (t) => {
  const f = await fixture(t);
  let database = openDatabase(f.config, { maintenance: true });
  assert.equal(database.prepare('PRAGMA journal_mode').get()?.journal_mode, 'wal');
  assert.equal(database.prepare('PRAGMA synchronous').get()?.synchronous, 2);
  assert.equal(database.prepare('PRAGMA busy_timeout').get()?.timeout, 5000);
  assert.equal(database.prepare('PRAGMA foreign_keys').get()?.foreign_keys, 1);
  assert.equal(database.prepare('PRAGMA recursive_triggers').get()?.recursive_triggers, 1);
  assert.throws(() => database.prepare('INSERT INTO topic_categories (topic_id, category_id) VALUES (?, ?)').run('missing', 'category_software'), /FOREIGN KEY/);
  const initial = readLibrary(database);
  assert.equal(initial.topics.length, 0);
  assert.deepEqual(initial.categories.map((category) => category.slug), ['software', 'mathematics', 'artificial-intelligence']);
  assert.ok(initial.instance.id);
  assert.ok(Number.isFinite(Date.parse(initial.instance.createdAt)));
  assert.deepEqual(database.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name").all().map((row) => row.name), [
    'categories', 'exercise_attempt_results', 'exercise_attempts', 'exercise_drafts', 'exercise_grading_specs',
    'exercise_versions', 'exercises', 'instance_metadata', 'lesson_part_versions', 'lesson_parts',
    'module_version_sources', 'module_versions', 'modules', 'schema_migrations', 'sessions', 'source_references',
    'topic_categories', 'topics', 'units', 'user_credentials', 'user_lesson_part_progress', 'user_module_progress',
    'user_settings', 'users',
  ]);
  database.prepare('UPDATE categories SET description = ? WHERE id = ?').run('Persisted description', initial.categories[0]!.id);
  database.close();
  database = openDatabase(f.config);
  assert.deepEqual(readLibrary(database).instance, initial.instance);
  assert.equal(readLibrary(database).categories[0]?.description, 'Persisted description');
  assert.throws(() => database.exec("UPDATE categories SET description = 'forbidden'"), /readonly/i);
  database.close();
});

test('startup rejects changed, unknown, and incomplete migration histories', async (t) => {
  for (const mutation of [
    { sql: "UPDATE schema_migrations SET checksum = 'tampered'", message: /checksum mismatch/ },
    { sql: "INSERT INTO schema_migrations VALUES ('9999_future', 'unknown', '2026-01-01')", message: /incompatible/ },
    { sql: 'DELETE FROM schema_migrations', message: /pending migrations/ },
  ]) {
    const f = await fixture(t);
    const database = openDatabase(f.config, { maintenance: true });
    database.exec(mutation.sql);
    database.close();
    await assert.rejects(f.app(), mutation.message);
  }
});

test('a failed migration rolls back schema and history together', async (t) => {
  const f = await fixture(t);
  const database = openDatabase(f.config, { maintenance: true });
  try {
    assert.equal(applyMigrations(database), 0);
    const badMigration = defineMigration('0006_transaction_test', 'CREATE TABLE rollback_probe (id INTEGER); INSERT INTO nonexistent_table VALUES (1);');
    assert.throws(() => applyMigrations(database, [...migrations, badMigration]), /no such table/);
    assert.equal(database.prepare("SELECT name FROM sqlite_schema WHERE name = 'rollback_probe'").get(), undefined);
    assert.equal(assertMigrationHistory(database), migrations.length);
    assertDatabaseIntegrity(database);
  } finally {
    database.close();
  }
});

test('library API serves persisted categories and a truthful empty catalog', async (t) => {
  const f = await fixture(t);
  const app = await f.app();
  assert.deepEqual((await app.inject('/health/live')).json(), { status: 'ok' });
  assert.deepEqual((await app.inject('/health/ready')).json(), { status: 'ready' });
  const response = await app.inject('/api/library');
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['cache-control'], 'no-store');
  const library = response.json<LibraryResponse>();
  assert.equal(library.categories.length, 3);
  assert.deepEqual(library.topics, []);
  assert.ok(library.instance.id);
  assert.equal((await app.inject({ method: 'POST', url: '/api/library', headers: { 'x-alexandria-request': '1' }, payload: {} })).statusCode, 404);
  assert.equal((await app.inject({ url: '/api/missing', headers: { accept: 'text/html' } })).statusCode, 404);
});

test('discovery exposes only published topics with published category placements', async (t) => {
  const f = await fixture(t);
  const database = openDatabase(f.config, { maintenance: true });
  try {
    database.exec(`
      INSERT INTO topics (id, slug, name, status) VALUES
        ('topic_public', 'public', 'Public topic', 'published'),
        ('topic_draft', 'draft', 'Draft topic', 'draft'),
        ('topic_unplaced', 'unplaced', 'Unplaced topic', 'published');
      INSERT INTO topic_categories (topic_id, category_id) VALUES
        ('topic_public', 'category_software'), ('topic_public', 'category_ai'),
        ('topic_draft', 'category_software');
    `);
    const result = readLibrary(database);
    assert.equal(result.topics.length, 1);
    assert.deepEqual(result.topics[0]?.categoryIds, ['category_software', 'category_ai']);
  } finally {
    database.close();
  }
});

test('readiness returns 503 if schema compatibility changes after startup', async (t) => {
  const f = await fixture(t);
  const app = await f.app();
  const database = openDatabase(f.config, { maintenance: true });
  database.exec("UPDATE schema_migrations SET checksum = 'changed' WHERE id = '0001_library_foundation'");
  database.close();
  const response = await app.inject('/health/ready');
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), { status: 'not_ready' });
  assert.equal((await app.inject('/health/live')).statusCode, 200);
});

test('static serving respects file boundaries and separates SPA routes from errors', async (t) => {
  const f = await fixture(t);
  mkdirSync(join(f.config.clientDir, 'assets'), { recursive: true });
  writeFileSync(join(f.config.clientDir, 'index.html'), '<!doctype html><h1>Alexandria</h1>');
  writeFileSync(join(f.config.clientDir, 'assets', 'app.js'), 'console.log("local");');
  writeFileSync(join(f.directory, 'private.txt'), 'private file');
  symlinkSync(join(f.directory, 'private.txt'), join(f.config.clientDir, 'escape.txt'));
  const app = await f.app({ requireClient: true });
  for (const url of ['/', '/library', '/library/software']) {
    const response = await app.inject({ url, headers: { accept: 'text/html' } });
    assert.equal(response.statusCode, 200, url);
    assert.match(response.body, /<h1>Alexandria/);
  }
  const asset = await app.inject('/assets/app.js');
  assert.equal(asset.statusCode, 200);
  assert.match(String(asset.headers['cache-control']), /immutable/);
  for (const url of ['/api/missing', '/api', '/health/missing', '/assets/missing.js', '/assets/missing', '/missing.js', '/escape.txt', '/.env', '/%2e%2e/private.txt']) {
    const response = await app.inject({ url, headers: { accept: 'text/html' } });
    assert.equal(response.statusCode, 404, url);
    assert.match(String(response.headers['content-type']), /application\/json/);
    assert.equal(response.json().error, 'Not Found');
  }
  assert.equal((await app.inject('/library')).statusCode, 404);
  assert.equal((await app.inject({ url: '/library', headers: { accept: 'text/html;q=0' } })).statusCode, 404);
  assert.equal((await app.inject({ method: 'POST', url: '/library' })).statusCode, 404);
  assert.equal((await app.inject({ method: 'HEAD', url: '/library', headers: { accept: 'text/html' } })).statusCode, 404);
});

test('production requires a built frontend and rejects an external root symlink', async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.app({ requireClient: true }), /Built frontend is missing/);
  mkdirSync(join(f.project, 'dist'));
  symlinkSync(f.config.dataDir, f.config.clientDir);
  await assert.rejects(f.app(), /frontend must remain inside/);
});

test('APP_ORIGIN rejects explicit foreign browser origins', async (t) => {
  const f = await fixture(t);
  f.config.appOrigin = 'http://localhost:3000';
  const app = await f.app();
  assert.equal((await app.inject({ url: '/api/library', headers: { origin: 'https://other.example' } })).statusCode, 403);
  assert.equal((await app.inject({ url: '/api/library', headers: { origin: 'http://localhost:3000' } })).statusCode, 200);
  assert.equal((await app.inject('/api/library')).statusCode, 200);
});

test('online backup includes committed WAL data and restores with a verified manifest', async (t) => {
  const f = await fixture(t);
  const writer = openDatabase(f.config, { maintenance: true });
  const reader = openDatabase(f.config);
  try {
    writer.prepare('UPDATE categories SET description = ? WHERE id = ?').run('A commit still in the WAL', 'category_software');
    const backupPath = await withMaintenanceLock(f.config, () => createBackup(f.config, reader));
    const names = await readdir(backupPath);
    assert.deepEqual(names.sort(), ['alexandria.sqlite', 'manifest.json']);
    assert.equal(existsSync(join(f.config.dataDir, '.maintenance.lock')), false);
    const manifest = JSON.parse(readFileSync(join(backupPath, 'manifest.json'), 'utf8'));
    assert.equal(manifest.files.length, 1);
    assert.equal(manifest.files[0].sha256, createHash('sha256').update(readFileSync(join(backupPath, 'alexandria.sqlite'))).digest('hex'));
    const restored = await fixture(t, false);
    mkdirSync(join(restored.config.dataDir, 'database'), { recursive: true });
    await copyFile(join(backupPath, 'alexandria.sqlite'), restored.config.databasePath);
    const restoredDatabase = openDatabase(restored.config);
    try {
      assertDatabaseIntegrity(restoredDatabase);
      const library = readLibrary(restoredDatabase);
      assert.equal(library.categories[0]?.description, 'A commit still in the WAL');
      assert.deepEqual(library.instance, readLibrary(reader).instance);
    } finally {
      restoredDatabase.close();
    }
  } finally {
    reader.close();
    writer.close();
  }
});

test('maintenance commands refuse overlapping locks and release failed operations', async (t) => {
  const f = await fixture(t);
  await withMaintenanceLock(f.config, async () => {
    await assert.rejects(withMaintenanceLock(f.config, async () => undefined), /maintenance lock exists/);
  });
  await assert.rejects(withMaintenanceLock(f.config, async () => { throw new Error('Simulated failure'); }), /Simulated failure/);
  assert.equal(existsSync(join(f.config.dataDir, '.maintenance.lock')), false);
});


test('upgrading the original library schema preserves instance and catalog with a restorable prior snapshot', async (t) => {
  const f = await fixture(t, false);
  mkdirSync(join(f.config.dataDir, 'database'), { recursive: true });
  const original = new DatabaseSync(f.config.databasePath);
  configureDatabase(original);
  const first = migrations[0]!;
  original.exec(`CREATE TABLE schema_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;`);
  original.exec(first.sql);
  original.prepare('INSERT INTO schema_migrations VALUES (?, ?, ?)').run(first.id, first.checksum, new Date().toISOString());
  original.exec("UPDATE categories SET description = 'Existing library description' WHERE id = 'category_software'");
  const before = readLibrary(original);
  original.close();
  await assert.rejects(f.app(), /pending migrations/);
  const database = openDatabase(f.config, { maintenance: true, allowPending: true });
  try {
    const backupPath = await withMaintenanceLock(f.config, () => createBackup(f.config, database));
    assert.equal(applyMigrations(database), migrations.length - 1);
    assert.deepEqual(readLibrary(database), before);
    for (const table of ['users', 'sessions', 'user_settings', 'units', 'modules', 'module_versions', 'exercises', 'exercise_attempts', 'user_module_progress']) {
      assert.equal(database.prepare(`SELECT count(*) AS count FROM ${table}`).get()?.count, 0, table);
    }
    assert.equal(database.prepare('SELECT revision FROM categories LIMIT 1').get()?.revision, 1);
    assertDatabaseIntegrity(database);
    assert.equal(applyMigrations(database), 0);
    const snapshot = new DatabaseSync(join(backupPath, 'alexandria.sqlite'), { readOnly: true });
    try {
      assert.equal(assertMigrationHistory(snapshot, true), 1);
      assert.deepEqual(readLibrary(snapshot), before);
      assertDatabaseIntegrity(snapshot);
    } finally { snapshot.close(); }
  } finally { database.close(); }
  assert.equal((await (await f.app()).inject('/health/ready')).statusCode, 200);
});
