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
import type { ContentBundle, ContentModule } from './content-definition.js';
import { installContentBundle, installContentCatalog } from './install-content.js';
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
    created: true, addedModules: 1, addedVersions: 1, revisedModules: 0,
    topicId: second.topic.id, topics: 1, units: 1, modules: 1, parts: 1,
  });
  assertPreserved(database, before);
  const library = readLibrary(database);
  assert.deepEqual(library.topics.find((topic) => topic.id === second.topic.id)?.categoryIds, ['category_mathematics']);
  assert.ok(library.topics.some((topic) => topic.id === cpp.topic.id));
  assert.equal(readModuleDetail(database, module.id).topic.id, second.topic.id);
  assert.equal(database.prepare('SELECT position FROM topic_categories WHERE topic_id = ?').get(second.topic.id)?.position, 2);
  assertDatabaseIntegrity(database);
});

function revisionBundle(prefix = 'release'): ContentBundle {
  return {
    topic: { id: `${prefix}_topic`, name: 'Release fixture', slug: prefix, description: '',
      categories: [{ id: 'category_software', position: 0 }] },
    units: [{ id: `${prefix}_unit`, name: 'Release fixture', slug: prefix, description: '', position: 0, parentUnitId: null,
      modules: [moduleDefinition(prefix)] }],
  };
}

function nextRelease(bundle: ContentBundle): ContentBundle {
  const revised = structuredClone(bundle);
  const module = revised.units[0]!.modules[0]!;
  module.version = (module.version ?? 1) + 1;
  module.versionId = `${module.id}_v${module.version}`;
  module.objectives = ['Understand the corrected explanation.'];
  module.parts[0]!.blocks = [{ type: 'paragraph', text: 'A corrected explanation in a separately published release.' }];
  module.sources[0]!.locator = 'Corrected section locator; the bibliographic source is unchanged.';
  return revised;
}

test('a corrected release preserves every old row and learner completion, reuses identities, and becomes the current reader version', async (t) => {
  const { database } = await fixture(t);
  const initial = revisionBundle();
  const original = initial.units[0]!.modules[0]!;
  original.sources.push({ ...original.sources[0]!, id: 'release_correction_source', title: 'Bibliography needing correction' });
  installContentBundle(database, initial);
  const learner = '11111111-1111-4111-8111-111111111111';
  const when = '2030-01-01T10:00:00.000Z';
  database.prepare(`INSERT INTO users(id, username, display_name, role, status, created_at, updated_at)
    VALUES (?, 'learner', 'Learner', 'member', 'active', ?, ?)`).run(learner, when, when);
  database.prepare(`INSERT INTO user_module_progress(user_id, module_id, status, last_module_version_id, last_lesson_part_id,
    completed_module_version_id, started_at, last_activity_at, completed_at) VALUES (?, ?, 'completed', ?, ?, ?, ?, ?, ?)`)
    .run(learner, original.id, original.versionId, original.parts[0]!.id, original.versionId, when, when, when);
  database.prepare(`INSERT INTO user_lesson_part_progress(user_id, module_id, module_version_id, lesson_part_id, completed_at)
    VALUES (?, ?, ?, ?, ?)`).run(learner, original.id, original.versionId, original.parts[0]!.id, when);
  const before = snapshot(database);
  const progressTables = ['users', 'user_module_progress', 'user_lesson_part_progress'];
  const progressBefore = progressTables.map((table) => database.prepare(`SELECT * FROM ${table}`).all());

  const revised = nextRelease(initial);
  const updated = revised.units[0]!.modules[0]!;
  updated.sources[1]!.id = 'release_corrected_source_v2';
  updated.sources[1]!.title = 'Corrected bibliographic title';
  const result = installContentBundle(database, revised);
  assert.equal(result.addedModules, 0);
  assert.equal(result.addedVersions, 1);
  assert.equal(result.revisedModules, 1);
  assertPreserved(database, before);
  assert.deepEqual(progressTables.map((table) => database.prepare(`SELECT * FROM ${table}`).all()), progressBefore);
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM lesson_parts').get()?.count, 1);
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM source_references').get()?.count, 3);
  assert.equal(readModuleDetail(database, original.id).version.id, updated.versionId);
  assert.deepEqual(readModuleDetail(database, original.id).parts[0]!.blocks, updated.parts[0]!.blocks);
  assert.equal(database.prepare('SELECT locator FROM module_version_sources WHERE module_version_id = ? AND source_reference_id = ?')
    .get(updated.versionId, original.sources[0]!.id)?.locator, updated.sources[0]!.locator);

  const installed = snapshot(database);
  const writes = database.prepare('SELECT total_changes() AS count').get()?.count;
  assert.equal(installContentBundle(database, revised).created, false);
  assert.equal(database.prepare('SELECT total_changes() AS count').get()?.count, writes);
  assert.deepEqual(snapshot(database), installed);
  assertDatabaseIntegrity(database);
});

test('fresh installations may start at the current explicit release without inventing older content', async (t) => {
  const { database } = await fixture(t);
  const bundle = nextRelease(revisionBundle());
  const module = bundle.units[0]!.modules[0]!;
  const result = installContentBundle(database, bundle);
  assert.equal(result.addedModules, 1);
  assert.equal(result.addedVersions, 1);
  assert.equal(result.revisedModules, 0);
  assert.deepEqual(database.prepare('SELECT id, version FROM module_versions').all().map((row) => ({ ...row })), [
    { id: module.versionId, version: 2 },
  ]);
  assert.equal(installContentBundle(database, bundle).created, false);
  assertDatabaseIntegrity(database);
});

test('release number, version identity, source metadata, and part ownership conflicts are refused before writing', async (t) => {
  const { database } = await fixture(t);
  const initial = revisionBundle();
  const other = revisionBundle('other-release');
  installContentCatalog(database, [initial, other]);
  const original = initial.units[0]!.modules[0]!;
  const otherModule = other.units[0]!.modules[0]!;
  const before = snapshot(database);
  const writes = database.prepare('SELECT total_changes() AS count').get()?.count;
  const invalidEdits: Array<(module: ContentModule) => void> = [
    (module) => { module.version = 1; },
    (module) => { module.version = 3; },
    (module) => { module.version = 0; },
    (module) => { module.version = 1.5; },
    (module) => { module.version = Number.MAX_SAFE_INTEGER + 1; },
    (module) => { module.versionId = original.versionId; },
    (module) => { module.versionId = otherModule.versionId; },
    (module) => { module.sources[0]!.title = 'Changed metadata without a new source ID'; },
    (module) => { module.parts[0]!.id = otherModule.parts[0]!.id; },
    (module) => { module.sources[0] = { ...otherModule.sources[0]! }; },
    (module) => {
      module.versionId = original.sources[0]!.id;
      module.sources[0]!.id = 'a_new_corrected_source';
    },
    (module) => { module.summary = 'Changed stable module metadata'; },
  ];
  for (const edit of invalidEdits) {
    const revised = nextRelease(initial);
    edit(revised.units[0]!.modules[0]!);
    assert.throws(() => installContentBundle(database, revised), /No content was changed/);
    assert.deepEqual(snapshot(database), before);
    assert.equal(database.prepare('SELECT total_changes() AS count').get()?.count, writes);
  }
  installContentBundle(database, nextRelease(initial));
  const upgraded = snapshot(database);
  assert.throws(() => installContentBundle(database, initial), /older release/);
  assert.deepEqual(snapshot(database), upgraded);
  assertDatabaseIntegrity(database);
});

test('an existing draft release or an orphan part is not adopted by a correction import', async (t) => {
  const { database } = await fixture(t);
  const initial = revisionBundle();
  const module = initial.units[0]!.modules[0]!;
  installContentBundle(database, initial);
  database.prepare('INSERT INTO lesson_parts(id, module_id) VALUES (?, ?)').run('orphan_part', module.id);
  const revised = nextRelease(initial);
  revised.units[0]!.modules[0]!.parts[0]!.id = 'orphan_part';
  const withOrphan = snapshot(database);
  assert.throws(() => installContentBundle(database, revised), /existing lesson_parts identities/);
  assert.deepEqual(snapshot(database), withOrphan);
  database.prepare('INSERT INTO module_versions(id, module_id, version, title) VALUES (?, ?, 2, ?)')
    .run('unrelated_draft_release', module.id, 'Work in progress');
  const withDraft = snapshot(database);
  assert.throws(() => installContentBundle(database, nextRelease(initial)), /draft releases/);
  assert.deepEqual(snapshot(database), withDraft);
  assertDatabaseIntegrity(database);
});

test('a later publication failure rolls back every new release and preserves old content', async (t) => {
  const { database } = await fixture(t);
  const first = revisionBundle('first-release');
  const second = revisionBundle('second-release');
  installContentCatalog(database, [first, second]);
  const before = snapshot(database);
  database.exec(`CREATE TRIGGER reject_correction_tail BEFORE UPDATE OF status ON module_versions
    WHEN NEW.module_id = 'second-release_module' AND NEW.version = 2
    BEGIN SELECT RAISE(ABORT, 'simulated corrected release failure'); END`);
  assert.throws(() => installContentCatalog(database, [nextRelease(first), nextRelease(second)]), /simulated corrected release failure/);
  assert.deepEqual(snapshot(database), before);
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
