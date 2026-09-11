import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import { loadConfig } from '../config.js';
import { assertDatabaseIntegrity, initializeDatabase, openDatabase } from '../db/database.js';
import { cppBasicsIds, cppBasicsParts, installCppBasics, loadCppBasicsBundle } from './cpp-basics.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-cpp-starter-'));
  const project = join(directory, 'project');
  mkdirSync(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent' }, project);
  initializeDatabase(config);
  const db = openDatabase(config, { writable: true });
  t.after(async () => { db.close(); await rm(directory, { recursive: true, force: true }); });
  return db;
}

function count(db: DatabaseSync, table: string) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count;
}

function assertNoLearningRecords(db: DatabaseSync) {
  for (const table of ['users', 'exercises', 'exercise_versions', 'exercise_grading_specs', 'user_module_progress',
    'user_lesson_part_progress', 'exercise_drafts', 'exercise_attempts', 'exercise_attempt_results']) {
    assert.equal(count(db, table), 0, table);
  }
}

test('explicit content installation publishes one topic, two nested units, and one original three-part module', async (t) => {
  const db = await fixture(t);
  const originalInstance = db.prepare('SELECT * FROM instance_metadata').get();
  const originalCategories = db.prepare('SELECT * FROM categories ORDER BY id').all();
  assert.equal(installCppBasics(db).created, true);
  assert.equal(count(db, 'topics'), 1);
  assert.equal(count(db, 'units'), 2);
  assert.equal(count(db, 'modules'), 1);
  assert.equal(count(db, 'module_versions'), 1);
  assert.equal(count(db, 'lesson_parts'), 3);
  assert.equal(count(db, 'lesson_part_versions'), 3);
  assert.equal(db.prepare('SELECT parent_unit_id FROM units WHERE id = ?').get(cppBasicsIds.basics)?.parent_unit_id, cppBasicsIds.unit);
  assert.equal(db.prepare('SELECT unit_id, status FROM modules WHERE id = ?').get(cppBasicsIds.module)?.unit_id, cppBasicsIds.basics);
  const current = loadCppBasicsBundle().units.flatMap((unit) => unit.modules).find((module) => module.id === cppBasicsIds.module)!;
  const version = db.prepare('SELECT * FROM module_versions WHERE id = ?').get(current.versionId);
  assert.equal(version?.version, current.version ?? 1);
  assert.equal(version?.status, 'published');
  assert.equal(version?.revision, 2);
  assert.equal(version?.completion_policy_json, '{}');
  assert.ok(version?.published_at);
  assert.deepEqual(db.prepare('SELECT * FROM instance_metadata').get(), originalInstance);
  assert.deepEqual(db.prepare('SELECT * FROM categories ORDER BY id').all(), originalCategories);
  assert.deepEqual(db.prepare('SELECT content_json FROM lesson_part_versions ORDER BY position').all().map((row) => JSON.parse(String(row.content_json))), cppBasicsParts.map((part) => part.blocks));
  const sources = JSON.stringify(db.prepare('SELECT * FROM source_references').all());
  assert.match(sources, /9780321563842/);
  assert.doesNotMatch(sources, /\/run\/media|\.pdf|file:\/\//i);
  assertNoLearningRecords(db);
  assertDatabaseIntegrity(db);
});

test('reinstalling matching content performs no database writes and preserves unrelated curriculum', async (t) => {
  const db = await fixture(t);
  installCppBasics(db);
  db.prepare('INSERT INTO topics(id, slug, name) VALUES (?, ?, ?)').run('another-topic', 'another-topic', 'Another topic');
  const before = db.prepare('SELECT total_changes() AS count').get()?.count;
  assert.equal(installCppBasics(db).created, false);
  assert.equal(db.prepare('SELECT total_changes() AS count').get()?.count, before);
  assert.equal(count(db, 'topics'), 2);
  assertNoLearningRecords(db);
});

test('an unrelated C++ topic or a partial starter record prevents installation without overwriting work', async (t) => {
  const db = await fixture(t);
  db.prepare('INSERT INTO topics(id, slug, name) VALUES (?, ?, ?)').run('existing', 'cpp', 'My existing C++ topic');
  assert.throws(() => installCppBasics(db), /different topic.*cpp slug/);
  assert.equal(count(db, 'topics'), 1);
  assert.equal(count(db, 'units'), 0);
  db.prepare('UPDATE topics SET slug = ? WHERE id = ?').run('my-cpp', 'existing');
  const current = loadCppBasicsBundle().units.flatMap((unit) => unit.modules).find((module) => module.id === cppBasicsIds.module)!;
  db.prepare('INSERT INTO source_references(id, title) VALUES (?, ?)').run(current.sources[0]!.id, 'My reference');
  assert.throws(() => installCppBasics(db), /conflicts with existing/);
  assert.equal(count(db, 'topics'), 1);
  assert.equal(count(db, 'units'), 0);
  assert.equal(db.prepare('SELECT title FROM source_references').get()?.title, 'My reference');
});

test('modified starter records are rejected instead of silently reset', async (t) => {
  const db = await fixture(t);
  installCppBasics(db);
  db.prepare('UPDATE units SET name = ? WHERE id = ?').run('My renamed basics', cppBasicsIds.basics);
  const before = db.prepare('SELECT total_changes() AS count').get()?.count;
  assert.throws(() => installCppBasics(db), /conflicts with existing units/);
  assert.equal(db.prepare('SELECT total_changes() AS count').get()?.count, before);
  assert.equal(db.prepare('SELECT name FROM units WHERE id = ?').get(cppBasicsIds.basics)?.name, 'My renamed basics');
  assertDatabaseIntegrity(db);
});

test('a failure during publication rolls back every content record', async (t) => {
  const db = await fixture(t);
  db.exec("CREATE TRIGGER reject_starter_publication BEFORE UPDATE OF status ON modules BEGIN SELECT RAISE(ABORT, 'simulated publication failure'); END");
  assert.throws(() => installCppBasics(db), /simulated publication failure/);
  for (const table of ['topics', 'topic_categories', 'units', 'modules', 'module_versions', 'lesson_parts', 'lesson_part_versions', 'source_references', 'module_version_sources']) {
    assert.equal(count(db, table), 0, table);
  }
  assertNoLearningRecords(db);
  assertDatabaseIntegrity(db);
});

test('the installer requires the published Software category', async (t) => {
  const db = await fixture(t);
  db.exec("UPDATE categories SET status = 'archived' WHERE id = 'category_software'");
  assert.throws(() => installCppBasics(db), /published category.*category_software/);
  assert.equal(count(db, 'topics'), 0);
});
