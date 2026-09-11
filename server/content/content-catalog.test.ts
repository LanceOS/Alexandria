import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import { loadConfig } from '../config.js';
import { assertDatabaseIntegrity, initializeDatabase, openDatabase } from '../db/database.js';
import { readLibrary } from '../db/library.js';
import { readModuleDetail, readTopicOutline } from '../repositories/curriculum.js';
import { listContentNames, loadContentCatalog, readImportContentNames, validateContentCatalog } from './content-catalog.js';
import { installCppBasicsPath } from './cpp-basics-path.js';
import type { ContentBundle } from './content-definition.js';
import { installContentCatalog } from './install-content.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-full-catalog-'));
  const project = join(directory, 'project');
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent' }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  t.after(async () => { database.close(); await rm(directory, { recursive: true, force: true }); });
  return database;
}

const tables = ['topics', 'topic_categories', 'units', 'modules', 'module_versions', 'lesson_parts',
  'lesson_part_versions', 'source_references', 'module_version_sources'];
function snapshot(database: DatabaseSync) {
  return tables.map((table) => ({ table, rows: database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() }));
}

function tinyBundle(prefix: string): ContentBundle {
  return {
    topic: { id: `${prefix}_topic`, slug: prefix, name: prefix, description: 'Catalog transaction fixture.',
      categories: [{ id: 'category_software', position: 100 }] },
    units: [{ id: `${prefix}_unit`, name: 'Example', slug: 'example', description: '', position: 0, parentUnitId: null,
      modules: [{ id: `${prefix}_module`, versionId: `${prefix}_v1`, slug: 'example', title: 'Example', summary: '', position: 0,
        objectives: ['Check atomic publication.'], parts: [{ id: `${prefix}_part`, title: 'Example',
          blocks: [{ type: 'paragraph', text: 'A transaction fixture, not student content.' }] }],
        sources: [{ id: `${prefix}_source`, title: 'Test source', authors: ['Test'], url: 'https://example.com/', locator: 'Fixture only.' }] }],
    }],
  };
}

test('all-topic selection is explicit and rejects mixed flags and path traversal', () => {
  assert.deepEqual(readImportContentNames(['--all']), listContentNames());
  assert.deepEqual(readImportContentNames(['cpp']), ['cpp']);
  for (const args of [[], ['--all', 'cpp'], ['cpp', '--all'], ['../cpp'], ['--unknown']]) {
    assert.throws(() => readImportContentNames(args));
  }
});

test('catalog validation catches identities that collide across separately valid topics', () => {
  for (const collision of ['topic', 'unit', 'module', 'version', 'part', 'source'] as const) {
    const first = tinyBundle('first');
    const second = tinyBundle('second');
    const a = first.units[0]!.modules[0]!;
    const b = second.units[0]!.modules[0]!;
    if (collision === 'topic') second.topic.id = first.topic.id;
    if (collision === 'unit') second.units[0]!.id = first.units[0]!.id;
    if (collision === 'module') b.id = a.id;
    if (collision === 'version') b.versionId = a.versionId;
    if (collision === 'part') b.parts[0]!.id = a.parts[0]!.id;
    if (collision === 'source') b.sources[0]!.id = a.sources[0]!.id;
    assert.throws(() => validateContentCatalog([first, second]), /Duplicate content ID/, collision);
  }
  const first = tinyBundle('first');
  const second = tinyBundle('second');
  second.topic.slug = first.topic.slug;
  assert.throws(() => validateContentCatalog([first, second]), /Duplicate topic slug/);
});

test('a later topic failure rolls back earlier topic publication and preserves existing data', async (t) => {
  const database = await fixture(t);
  installCppBasicsPath(database);
  const before = snapshot(database);
  database.exec(`CREATE TRIGGER reject_catalog_tail BEFORE UPDATE OF status ON modules
    WHEN NEW.id = 'second_module'
    BEGIN SELECT RAISE(ABORT, 'simulated second topic failure'); END`);
  assert.throws(() => installContentCatalog(database, [tinyBundle('first'), tinyBundle('second')]), /simulated second topic failure/);
  assert.deepEqual(snapshot(database), before);
  assert.throws(() => installContentCatalog(database, []), /at least one topic/);
  assertDatabaseIntegrity(database);
});

test('the expanded curriculum imports over Basics and every module uses the shared reader format', async (t) => {
  const database = await fixture(t);
  installCppBasicsPath(database);
  const before = snapshot(database);
  const bundles = loadContentCatalog();
  const cpp = bundles.find((bundle) => bundle.topic.slug === 'cpp')!;
  assert.equal(cpp.units.filter((unit) => unit.parentUnitId !== null).length, 18);
  assert.equal(bundles.length, 25);
  const expectedModules = bundles.flatMap((bundle) => bundle.units.flatMap((unit) => unit.modules)).length;
  const result = installContentCatalog(database, bundles);
  assert.equal(result.modules, expectedModules);
  assert.equal(result.addedModules, expectedModules - 7);
  for (const { table, rows } of before) {
    const current = new Set(database.prepare(`SELECT * FROM ${table}`).all().map((row) => JSON.stringify(row)));
    for (const row of rows) assert.ok(current.has(JSON.stringify(row)), `Preserve ${table} data and timestamps`);
  }
  const library = readLibrary(database);
  assert.equal(library.topics.length, bundles.length);
  for (const bundle of bundles) {
    const outline = readTopicOutline(database, bundle.topic.slug);
    assert.equal(outline.units.length, bundle.units.length);
    for (const unit of bundle.units) {
      if (unit.parentUnitId !== null) assert.ok(unit.modules.length > 0, `No empty subunit: ${unit.slug}`);
      for (const module of unit.modules) {
        const detail = readModuleDetail(database, module.id);
        assert.equal(detail.parts.length, 3, module.title);
        assert.ok(detail.version.objectives.length > 0, module.title);
        assert.ok(detail.sources.length > 0, module.title);
        assert.ok(detail.sources.every((source) => source.locator && source.url?.startsWith('https://')), module.title);
        const blocks = detail.parts.flatMap((part) => part.blocks);
        assert.ok(blocks.some((block) => block.type === 'code'), `Worked example: ${module.title}`);
        assert.ok(blocks.some((block) => block.type === 'reflection'), `Practice: ${module.title}`);
        assert.equal(detail.units.at(-1)?.id, unit.id);
      }
    }
  }
  const writes = database.prepare('SELECT total_changes() AS count').get()?.count;
  assert.equal(installContentCatalog(database, bundles).created, false);
  assert.equal(database.prepare('SELECT total_changes() AS count').get()?.count, writes);
  assertDatabaseIntegrity(database);
});
