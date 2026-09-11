import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import { loadConfig } from '../config.js';
import { assertDatabaseIntegrity, initializeDatabase, openDatabase } from '../db/database.js';
import { readLibrary } from '../db/library.js';
import { readModuleDetail, readTopicOutline } from '../repositories/curriculum.js';
import type { ContentModule } from './content-definition.js';
import { installContentBundle } from './install-content.js';
import { defaultContentDirectory, loadContentBundle } from './load-content.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-content-import-'));
  const project = join(directory, 'project');
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent' }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  t.after(async () => { database.close(); await rm(directory, { recursive: true, force: true }); });
  const cppDirectory = join(directory, 'units', 'cpp');
  await cp(join(defaultContentDirectory, 'cpp'), cppDirectory, { recursive: true });
  return { database, directory, cppDirectory };
}

const contentTables = ['topics', 'topic_categories', 'units', 'modules', 'module_versions', 'lesson_parts',
  'lesson_part_versions', 'source_references', 'module_version_sources'];

function snapshot(database: DatabaseSync) {
  return contentTables.map((table) => ({ table, rows: database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() }));
}

function assertPreserved(database: DatabaseSync, before: ReturnType<typeof snapshot>): void {
  for (const { table, rows } of before) {
    const current = new Set(database.prepare(`SELECT * FROM ${table}`).all().map((row) => JSON.stringify(row)));
    for (const row of rows) assert.ok(current.has(JSON.stringify(row)), `Existing ${table} row must remain identical`);
  }
}

function moduleDefinition(prefix: string): ContentModule {
  return {
    id: `${prefix}_module`, versionId: `${prefix}_version`, slug: 'small-example', title: 'A small example',
    summary: 'An original test lesson.', position: 0, objectives: ['Read a short explanation.'],
    parts: [{ id: `${prefix}_part`, title: 'One idea', blocks: [{ type: 'paragraph', text: 'This is original integration-test content.' }] }],
    sources: [{ id: `${prefix}_source`, title: 'Test reference', authors: ['Test author'],
      url: 'https://example.com/reference', locator: 'A reference used only by this test.' }],
  };
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function addPracticeFolder(cppDirectory: string) {
  const directory = join(cppDirectory, 'basics', 'practice');
  await mkdir(directory);
  await writeJson(join(directory, 'unit.json'), {
    id: 'import_test_practice_unit', name: 'Practice', slug: 'practice', description: 'A new nested unit.', position: 0,
  });
  const module = moduleDefinition('import_test_new');
  await writeJson(join(directory, '01-example.json'), module);
  return module;
}

test('new folders add a nested unit and module while preserving existing content; matching reruns perform no writes', async (t) => {
  const { database, cppDirectory } = await fixture(t);
  const initial = loadContentBundle(cppDirectory);
  installContentBundle(database, initial);
  const before = snapshot(database);
  const module = await addPracticeFolder(cppDirectory);
  const expanded = loadContentBundle(cppDirectory);
  const parent = expanded.units.find((unit) => unit.slug === 'basics')!;
  const addedUnit = expanded.units.find((unit) => unit.id === 'import_test_practice_unit')!;
  assert.equal(addedUnit.parentUnitId, parent.id);
  assert.ok(expanded.units.indexOf(parent) < expanded.units.indexOf(addedUnit));

  const result = installContentBundle(database, expanded);
  assert.equal(result.created, true);
  assert.equal(result.addedModules, 1);
  assert.equal(result.units, initial.units.length + 1);
  assertPreserved(database, before);
  const outline = readTopicOutline(database, initial.topic.slug);
  assert.deepEqual(outline.units.find((unit) => unit.id === addedUnit.id)?.modules.map((entry) => entry.id), [module.id]);
  const detail = readModuleDetail(database, module.id);
  assert.deepEqual(detail.units.map((unit) => unit.id), [initial.units[0]!.id, parent.id, addedUnit.id]);
  assert.deepEqual(detail.parts[0]?.blocks, module.parts[0]!.blocks);

  const installed = snapshot(database);
  const writes = database.prepare('SELECT total_changes() AS count').get()?.count;
  assert.equal(installContentBundle(database, loadContentBundle(cppDirectory)).created, false);
  assert.equal(database.prepare('SELECT total_changes() AS count').get()?.count, writes);
  assert.deepEqual(snapshot(database), installed);
  assertDatabaseIntegrity(database);
});

test('a second root topic installs under another category without changing the existing topic', async (t) => {
  const { database, directory, cppDirectory } = await fixture(t);
  const cpp = loadContentBundle(cppDirectory);
  installContentBundle(database, cpp);
  const before = snapshot(database);
  const secondDirectory = join(directory, 'units', 'number-systems');
  await mkdir(secondDirectory);
  await writeJson(join(secondDirectory, 'unit.json'), {
    id: 'import_test_numbers_unit', name: 'Number systems', slug: 'number-systems', description: 'A separate test unit.', position: 0,
    topic: { id: 'import_test_numbers_topic', name: 'Number systems', slug: 'number-systems', description: 'A separate test topic.',
      categories: [{ id: 'category_mathematics', position: 2 }] },
  });
  const module = moduleDefinition('import_test_numbers');
  await writeJson(join(secondDirectory, '01-example.json'), module);
  const second = loadContentBundle(secondDirectory);
  assert.deepEqual(installContentBundle(database, second), {
    created: true, addedModules: 1, topicId: second.topic.id, topics: 1, units: 1, modules: 1, parts: 1,
  });
  assertPreserved(database, before);
  const library = readLibrary(database);
  assert.deepEqual(library.topics.find((topic) => topic.id === second.topic.id)?.categoryIds, ['category_mathematics']);
  assert.ok(library.topics.some((topic) => topic.id === cpp.topic.id));
  assert.equal(readModuleDetail(database, module.id).topic.id, second.topic.id);
  assert.equal(database.prepare('SELECT position FROM topic_categories WHERE topic_id = ?').get(second.topic.id)?.position, 2);
  assertDatabaseIntegrity(database);
});

test('a publication failure rolls back a new folder hierarchy and its module without touching installed content', async (t) => {
  const { database, cppDirectory } = await fixture(t);
  installContentBundle(database, loadContentBundle(cppDirectory));
  const before = snapshot(database);
  await addPracticeFolder(cppDirectory);
  database.exec(`CREATE TRIGGER reject_imported_module BEFORE UPDATE OF status ON modules
    WHEN NEW.id = 'import_test_new_module'
    BEGIN SELECT RAISE(ABORT, 'simulated imported module publication failure'); END`);
  assert.throws(() => installContentBundle(database, loadContentBundle(cppDirectory)), /simulated imported module publication failure/);
  assert.deepEqual(snapshot(database), before);
  assert.equal(database.prepare('SELECT id FROM units WHERE id = ?').get('import_test_practice_unit'), undefined);
  assertDatabaseIntegrity(database);
});

test('missing, extra, or modified placements on an existing topic are refused without repairing them', async (t) => {
  const { database, cppDirectory } = await fixture(t);
  const bundle = loadContentBundle(cppDirectory);
  installContentBundle(database, bundle);
  const topicId = bundle.topic.id;
  const placement = bundle.topic.categories[0]!;

  function assertRefused(pattern: RegExp) {
    const before = snapshot(database);
    const writes = database.prepare('SELECT total_changes() AS count').get()?.count;
    assert.throws(() => installContentBundle(database, bundle), pattern);
    assert.deepEqual(snapshot(database), before);
    assert.equal(database.prepare('SELECT total_changes() AS count').get()?.count, writes);
  }

  database.prepare('DELETE FROM topic_categories WHERE topic_id = ? AND category_id = ?').run(topicId, placement.id);
  assertRefused(/conflicts with existing topic_categories/);
  database.prepare('INSERT INTO topic_categories(topic_id, category_id, position) VALUES (?, ?, ?)')
    .run(topicId, placement.id, placement.position);
  database.prepare('INSERT INTO topic_categories(topic_id, category_id) VALUES (?, ?)').run(topicId, 'category_mathematics');
  assertRefused(/unexpected topic_categories associations/);
  database.prepare('DELETE FROM topic_categories WHERE topic_id = ? AND category_id = ?').run(topicId, 'category_mathematics');
  database.prepare('UPDATE topic_categories SET position = position + 1 WHERE topic_id = ?').run(topicId);
  assertRefused(/conflicts with existing topic_categories/);
  assertDatabaseIntegrity(database);
});
