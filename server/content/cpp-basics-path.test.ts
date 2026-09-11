import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import { loadConfig } from '../config.js';
import { assertDatabaseIntegrity, initializeDatabase, openDatabase } from '../db/database.js';
import { readModuleDetail, readTopicOutline } from '../repositories/curriculum.js';
import { cppBasicsIds, installCppBasics, loadCppBasicsBundle } from './cpp-basics.js';
import { cppBasicsModules, installCppBasicsPath } from './cpp-basics-path.js';

import { installContentBundle } from './install-content.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-cpp-path-'));
  const project = join(directory, 'project');
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent' }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  t.after(async () => { database.close(); await rm(directory, { recursive: true, force: true }); });
  return database;
}

const contentTables = ['topics', 'topic_categories', 'units', 'modules', 'module_versions', 'lesson_parts',
  'lesson_part_versions', 'source_references', 'module_version_sources'];

// Captured from the published TypeScript-backed lessons before their lossless JSON conversion.
// These version-one lessons are immutable; a format refactor must preserve their public payloads.
const publishedHashes: Record<string, string> = {
  cpp_starter_module_first_program: 'bc04c5f1b143881e7dae1ffb00b96eb6d463ce8dc0ab4c01be7ebaa08f4ff25a',
  cpp_basics_module_variables: '2a8d5d3c0fe63a837044f828fb4de42fab142e00b505fed0e32bbbebf546f7c5',
  cpp_basics_module_expressions: 'a5f811a0acd6570e3c6a3afc6e4c0ac3cc8043f2fda7938b0d0c1256d0e71ac1',
  cpp_basics_module_decisions: '2aba3c5a4bff24e8f418d3b69e8d211567cd9b7732f655c60964ab24d6c9f8f1',
  cpp_basics_module_loops: '4fb86f1e0e254330025bf5aa63dcdd10e8c6fce64bb01b771c194fee9c6e7c79',
  cpp_basics_module_functions: '2d5b4b010ffafdcf8ea6ec0db686d37baad4c370a04d2afb70ae9121ca98830f',
};

function snapshot(database: DatabaseSync) {
  return contentTables.map((table) => ({ table, rows: database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() }));
}

test('the complete Basics path is published in order and every lesson and reading link can be served', async (t) => {
  const database = await fixture(t);
  assert.deepEqual(installCppBasicsPath(database), {
    created: true, addedModules: 7, addedVersions: 7, revisedModules: 0,
    topicId: cppBasicsIds.topic, topics: 1, units: 2, modules: 7, parts: 21,
  });
  const outline = readTopicOutline(database, 'cpp');
  assert.equal(outline.units.length, 2);
  const moduleIds = outline.units.find((unit) => unit.id === cppBasicsIds.basics)!.modules.map((module) => module.id);
  assert.deepEqual(moduleIds, [cppBasicsIds.module, 'cpp_basics_module_variables', 'cpp_basics_module_expressions',
    'cpp_basics_module_decisions', 'cpp_basics_module_loops', 'cpp_basics_module_functions', 'cpp_basics_module_output']);
  for (const id of moduleIds) {
    const detail = readModuleDetail(database, id);
    const authored = loadCppBasicsBundle().units.flatMap((unit) => unit.modules).find((module) => module.id === id)!;
    if (detail.version.number === 1 && publishedHashes[id]) {
      assert.equal(createHash('sha256').update(JSON.stringify(detail)).digest('hex'), publishedHashes[id], `Published content changed: ${id}`);
    }
    assert.equal(detail.version.id, authored.versionId);
    assert.equal(detail.version.number, authored.version ?? 1);
    assert.deepEqual(detail.parts.map((part) => part.blocks), authored.parts.map((part) => part.blocks));
    assert.equal(detail.parts.length, 3);
    assert.ok(detail.version.objectives.length > 0);
    assert.ok(detail.sources.some((source) => source.url === 'https://www.stroustrup.com/4th.html' && source.authors.includes('Bjarne Stroustrup')));
    assert.ok(detail.sources.some((source) => source.url?.startsWith('https://timsong-cpp.github.io/cppwp/n4861/')
      || source.url?.startsWith('https://eel.is/c++draft/')));
    assert.ok(detail.sources.every((source) => source.url?.startsWith('https://') && source.locator.length > 0));
    assert.doesNotMatch(JSON.stringify(detail), /\/run\/media|file:\/\/|\.pdf/i);
  }
  for (const table of ['users', 'exercises', 'exercise_versions', 'exercise_grading_specs',
    'user_module_progress', 'user_lesson_part_progress', 'exercise_attempts']) {
    assert.equal(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count, 0, table);
  }
  assertDatabaseIntegrity(database);
});

test('upgrading preserves every starter record and unrelated curriculum; reruns perform no writes', async (t) => {
  const database = await fixture(t);
  installCppBasics(database);
  database.prepare("INSERT INTO modules(id, unit_id, title, slug) VALUES ('custom', ?, 'My lesson', 'my-lesson')")
    .run(cppBasicsIds.basics);
  const before = snapshot(database);
  assert.equal(installCppBasicsPath(database).addedModules, 6);
  for (const { table, rows } of before) {
    const after = new Set(database.prepare(`SELECT * FROM ${table}`).all().map((row) => JSON.stringify(row)));
    for (const row of rows) assert.ok(after.has(JSON.stringify(row)), `Existing ${table} row must stay identical`);
  }
  const writes = database.prepare('SELECT total_changes() AS count').get()?.count;
  assert.equal(installCppBasicsPath(database).created, false);
  assert.equal(database.prepare('SELECT total_changes() AS count').get()?.count, writes);
  assertDatabaseIntegrity(database);
});

test('a reserved source ID conflict rolls back a fresh starter and the whole expansion', async (t) => {
  const database = await fixture(t);
  const lastModule = cppBasicsModules.at(-1)!;
  database.prepare('INSERT INTO source_references(id, title) VALUES (?, ?)').run(lastModule.sources[0]!.id, 'Existing reference');
  const before = snapshot(database);
  assert.throws(() => installCppBasicsPath(database), /conflicts with existing/);
  assert.deepEqual(snapshot(database), before);
  assertDatabaseIntegrity(database);
});

test('an existing module slug or partial owned module is refused without replacing content', async (t) => {
  const database = await fixture(t);
  installCppBasics(database);
  const module = cppBasicsModules[0]!;
  database.prepare('INSERT INTO modules(id, unit_id, title, slug) VALUES (?, ?, ?, ?)')
    .run('custom', cppBasicsIds.basics, 'Existing variables lesson', module.slug);
  const before = snapshot(database);
  assert.throws(() => installCppBasicsPath(database), /different module already uses/);
  assert.deepEqual(snapshot(database), before);
  database.prepare('UPDATE modules SET slug = ? WHERE id = ?').run('custom-variables', 'custom');
  database.prepare('INSERT INTO modules(id, unit_id, title, slug) VALUES (?, ?, ?, ?)')
    .run(module.id, cppBasicsIds.basics, 'Incomplete content', module.slug);
  const partial = snapshot(database);
  assert.throws(() => installCppBasicsPath(database), /conflicts with existing/);
  assert.deepEqual(snapshot(database), partial);
});

test('modified installed modules are reported instead of silently reset', async (t) => {
  const database = await fixture(t);
  installCppBasicsPath(database);
  database.prepare('UPDATE modules SET summary = ? WHERE id = ?').run('My edited summary', cppBasicsModules[1]!.id);
  const before = snapshot(database);
  const writes = database.prepare('SELECT total_changes() AS count').get()?.count;
  assert.throws(() => installCppBasicsPath(database), /conflicts with existing modules/);
  assert.deepEqual(snapshot(database), before);
  assert.equal(database.prepare('SELECT total_changes() AS count').get()?.count, writes);
});

test('a failure publishing the last new module rolls back all additions and preserves the installed starter', async (t) => {
  const database = await fixture(t);
  installCppBasics(database);
  const before = snapshot(database);
  database.exec(`CREATE TRIGGER reject_last_module BEFORE UPDATE OF status ON modules
    WHEN NEW.id = 'cpp_basics_module_output'
    BEGIN SELECT RAISE(ABORT, 'simulated final publication failure'); END`);
  assert.throws(() => installCppBasicsPath(database), /simulated final publication failure/);
  assert.deepEqual(snapshot(database), before);
  assertDatabaseIntegrity(database);
});

test('adding output nuances preserves the previously published six-module path', async (t) => {
  const database = await fixture(t);
  const bundle = loadCppBasicsBundle();
  for (const unit of bundle.units) unit.modules = unit.modules.filter((module) => module.id !== 'cpp_basics_module_output');
  installContentBundle(database, bundle);
  const before = snapshot(database);
  assert.equal(installCppBasicsPath(database).addedModules, 1);
  for (const { table, rows } of before) {
    const after = new Set(database.prepare(`SELECT * FROM ${table}`).all().map((row) => JSON.stringify(row)));
    for (const row of rows) assert.ok(after.has(JSON.stringify(row)), `Existing ${table} row must stay identical`);
  }
  assert.equal(readModuleDetail(database, 'cpp_basics_module_output').parts.length, 3);
});
