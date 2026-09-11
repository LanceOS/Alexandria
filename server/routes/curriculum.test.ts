import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import Fastify from 'fastify';
import type { LessonBlock, ModuleDetail, TopicOutline } from '../../shared/curriculum.js';
import { loadConfig } from '../config.js';
import { initializeDatabase, openDatabase } from '../db/database.js';
import { registerErrors } from '../http/errors.js';
import { registerCurriculumRoutes } from './curriculum.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-curriculum-api-'));
  const project = join(directory, 'project');
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups') }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  const app = Fastify({ logger: false, ajv: { customOptions: { coerceTypes: false, removeAdditional: false } } });
  registerErrors(app);
  registerCurriculumRoutes(app, database);
  t.after(async () => { await app.close(); database.close(); await rm(directory, { recursive: true, force: true }); });
  database.exec(`
    INSERT INTO topics(id, slug, name, status) VALUES ('topic', 'test-cpp', 'Test C++', 'published');
    INSERT INTO topic_categories(topic_id, category_id) VALUES ('topic', 'category_software');
    INSERT INTO units(id, topic_id, name, slug, status) VALUES ('root', 'topic', 'C++', 'cpp', 'published');
    INSERT INTO units(id, topic_id, parent_unit_id, name, slug, status)
      VALUES ('basics', 'topic', 'root', 'Basics', 'basics', 'published');
  `);
  return { app, database };
}

function addModule(database: DatabaseSync, id = 'module', unit = 'basics') {
  database.prepare('INSERT INTO modules(id, unit_id, title, slug) VALUES (?, ?, ?, ?)').run(id, unit, 'Mutable catalog title', id);
}

function addVersion(database: DatabaseSync, moduleId: string, version: number, content: unknown, options: {
  objectives?: unknown; schema?: number; authors?: unknown; url?: string; privateExercise?: boolean; publish?: boolean;
} = {}) {
  const versionId = `${moduleId}-v${version}`;
  const partId = `${moduleId}-part${version}`;
  database.prepare(`INSERT INTO module_versions(id, module_id, version, title, summary, content_schema_version, objectives_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(versionId, moduleId, version, `Version ${version} title`, 'Published version summary',
    options.schema ?? 1, JSON.stringify(options.objectives ?? ['Read a small example.']));
  database.prepare('INSERT INTO lesson_parts(id, module_id) VALUES (?, ?)').run(partId, moduleId);
  database.prepare(`INSERT INTO lesson_part_versions(lesson_part_id, module_version_id, module_id, title, position, content_json)
    VALUES (?, ?, ?, 'First section', 0, ?)`).run(partId, versionId, moduleId, JSON.stringify(content));
  database.prepare(`INSERT INTO source_references(id, title, authors_json, edition, publication_year, url)
    VALUES (?, 'Original test source', ?, 'First', 2026, ?)`).run(`${versionId}-source`, JSON.stringify(options.authors ?? ['Test Author']),
    options.url ?? 'https://example.com/reference');
  database.prepare(`INSERT INTO module_version_sources(module_version_id, source_reference_id, locator)
    VALUES (?, ?, 'Section 1')`).run(versionId, `${versionId}-source`);
  if (options.privateExercise) {
    database.prepare('INSERT INTO exercises(id, module_id) VALUES (?, ?)').run(`${versionId}-exercise`, moduleId);
    database.prepare(`INSERT INTO exercise_versions(id, exercise_id, module_version_id, module_id, lesson_part_id,
      kind, prompt_json, grading_method) VALUES (?, ?, ?, ?, ?, 'text', '{"prompt":"Private test question"}', 'automatic')`)
      .run(`${versionId}-exercise-version`, `${versionId}-exercise`, versionId, moduleId, partId);
    database.prepare(`INSERT INTO exercise_grading_specs(exercise_version_id, spec_json, solution_json)
      VALUES (?, '{"private_key":"never expose this key"}', '{"answer":"never expose this solution"}')`)
      .run(`${versionId}-exercise-version`);
  }
  if (options.publish !== false) {
    database.prepare(`UPDATE module_versions SET status = 'published', revision = revision + 1,
      published_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).run(versionId);
    database.prepare("UPDATE modules SET status = 'published' WHERE id = ?").run(moduleId);
  }
  return versionId;
}

const paragraph = [{ type: 'paragraph', text: 'This is original test content.' }];

test('public curriculum returns the latest published version, its structured blocks and citations, and no private data', async (t) => {
  const { app, database } = await fixture(t);
  const blocks: LessonBlock[] = [
    { type: 'paragraph', text: 'A short original explanation.' },
    { type: 'code', language: 'cpp', code: 'int main() {}', caption: 'A minimal program.' },
    { type: 'code', language: 'shell', code: './example' },
    { type: 'code', language: 'text', code: 'Example output' },
    { type: 'callout', title: 'Notice', text: 'Read the example carefully.' },
    { type: 'list', items: ['Look at the entry point.', 'Look at the braces.'] },
    { type: 'reflection', prompt: 'Where does the program begin?', explanation: 'At main in this example.' },
  ];
  addModule(database);
  addVersion(database, 'module', 1, paragraph);
  addVersion(database, 'module', 2, blocks, { privateExercise: true });
  addVersion(database, 'module', 3, [{ type: 'paragraph', text: 'Unpublished next version.' }], { publish: false });
  addModule(database, 'draft-module');
  const response = await app.inject('/api/topics/test-cpp/outline');
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(response.headers['cache-control'], 'no-store');
  const outline = response.json<TopicOutline>();
  assert.deepEqual(outline.units.map((unit) => unit.id).sort(), ['basics', 'root']);
  assert.deepEqual(outline.units.find((unit) => unit.id === 'basics')?.modules, [{ id: 'module', slug: 'module',
    title: 'Version 2 title', summary: 'Published version summary', unitId: 'basics', versionId: 'module-v2', sectionCount: 1 }]);
  const lessonResponse = await app.inject('/api/modules/module');
  assert.equal(lessonResponse.statusCode, 200, lessonResponse.body);
  assert.equal(lessonResponse.headers['cache-control'], 'no-store');
  const lesson = lessonResponse.json<ModuleDetail>();
  assert.deepEqual(lesson.units, [{ id: 'root', name: 'C++', slug: 'cpp' }, { id: 'basics', name: 'Basics', slug: 'basics' }]);
  assert.deepEqual(lesson.version, { id: 'module-v2', number: 2, objectives: ['Read a small example.'] });
  assert.deepEqual(lesson.parts, [{ id: 'module-part2', title: 'First section', position: 0, blocks }]);
  assert.deepEqual(lesson.sources, [{ id: 'module-v2-source', title: 'Original test source', authors: ['Test Author'],
    edition: 'First', publicationYear: 2026, locator: 'Section 1', url: 'https://example.com/reference' }]);
  assert.deepEqual(Object.keys(lesson).sort(), ['module', 'parts', 'sources', 'topic', 'units', 'version']);
  assert.doesNotMatch(lessonResponse.body, /never expose|private_key|grading|solution|credentials|Unpublished/);
});

test('public curriculum hides unpublished ancestors, modules, topics, and category placements', async (t) => {
  const { app, database } = await fixture(t);
  database.exec(`INSERT INTO units(id, topic_id, parent_unit_id, name, slug, status)
    VALUES ('nested', 'topic', 'basics', 'Nested', 'nested', 'published');`);
  addModule(database, 'module', 'nested');
  addVersion(database, 'module', 1, paragraph);
  for (const ancestor of ['root', 'basics']) {
    for (const status of ['draft', 'archived']) {
      database.prepare('UPDATE units SET status = ? WHERE id = ?').run(status, ancestor);
      assert.equal((await app.inject('/api/modules/module')).statusCode, 404);
      const outline = (await app.inject('/api/topics/test-cpp/outline')).json<TopicOutline>();
      assert.equal(outline.units.some((unit) => unit.id === 'nested' || unit.id === ancestor), false);
      database.prepare("UPDATE units SET status = 'published' WHERE id = ?").run(ancestor);
    }
  }
  database.exec("UPDATE modules SET status = 'archived' WHERE id = 'module'");
  assert.equal((await app.inject('/api/modules/module')).statusCode, 404);
  assert.ok((await app.inject('/api/topics/test-cpp/outline')).json<TopicOutline>().units.every((unit) => unit.modules.length === 0));
  database.exec("UPDATE modules SET status = 'published' WHERE id = 'module'");
  for (const table of ['topics', 'categories']) {
    database.exec(`UPDATE ${table} SET status = 'archived'`);
    assert.equal((await app.inject('/api/topics/test-cpp/outline')).statusCode, 404);
    assert.equal((await app.inject('/api/modules/module')).statusCode, 404);
    database.exec(`UPDATE ${table} SET status = 'published'`);
  }
  database.exec('DELETE FROM topic_categories');
  assert.equal((await app.inject('/api/topics/test-cpp/outline')).statusCode, 404);
  assert.equal((await app.inject('/api/modules/module')).statusCode, 404);
});

test('public curriculum rejects malformed stored blocks, objectives, citations, and unsupported schemas without leaking them', async (t) => {
  const { app, database } = await fixture(t);
  const cases: Array<{ content: unknown; options?: Parameters<typeof addVersion>[4] }> = [
    { content: [{ type: 'html', text: '<script>private payload</script>' }] },
    { content: [{ type: 'paragraph', text: 'Example', private_key: 'private payload' }] },
    { content: [{ type: 'code', language: 'javascript', code: 'private payload' }] },
    { content: [{ type: 'list', items: [42] }] },
    { content: [{ type: 'reflection', prompt: 'Example' }] },
    { content: [null] },
    { content: [] },
    { content: Array.from({ length: 101 }, () => paragraph[0]) },
    { content: [{ type: 'paragraph', text: 'x'.repeat(30_001) }] },
    { content: paragraph, options: { objectives: [{ private_key: 'private payload' }] } },
    { content: paragraph, options: { authors: [{ private_key: 'private payload' }] } },
    { content: paragraph, options: { url: 'https://user:private-payload@example.com/' } },
    { content: paragraph, options: { schema: 2 } },
  ];
  for (const [index, item] of cases.entries()) {
    const id = `invalid-${index}`;
    addModule(database, id);
    addVersion(database, id, 1, item.content, item.options);
    const response = await app.inject(`/api/modules/${id}`);
    assert.equal(response.statusCode, 500, `${index}: ${response.body}`);
    assert.equal(response.json().code, 'CONTENT_UNAVAILABLE');
    assert.equal(response.json().message, 'This lesson cannot be displayed right now.');
    assert.doesNotMatch(response.body, /private payload|private_key|script|https:/);
  }
});

test('public curriculum returns consistent missing-resource responses and validates route parameter length', async (t) => {
  const { app } = await fixture(t);
  for (const url of ['/api/modules/missing', '/api/topics/missing/outline', '/api/modules/%27%20OR%201%3D1--']) {
    const response = await app.inject(url);
    assert.equal(response.statusCode, 404, response.body);
    assert.equal(response.json().code, 'NOT_FOUND');
  }
  assert.equal((await app.inject(`/api/modules/${'x'.repeat(201)}`)).statusCode, 414);
});
