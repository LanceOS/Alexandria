import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test, { type TestContext } from 'node:test';
import Fastify from 'fastify';
import { isModulePractice, type ModulePractice } from '../../shared/practice.js';
import { loadPracticeCatalog, validatePracticeVersions } from '../content/practice.js';
import { loadCppBasicsBundle } from '../content/cpp-basics.js';
import { loadNamedContent } from '../content/content-catalog.js';
import { installContentBundle } from '../content/install-content.js';
import { loadConfig } from '../config.js';
import { initializeDatabase, openDatabase } from '../db/database.js';
import { registerErrors } from '../http/errors.js';
import { registerPracticeRoutes } from './practice.js';

test('practice targets reviewed lesson versions and uses valid, distinct self-check choices', () => {
  const modules = loadCppBasicsBundle().units.flatMap((unit) => unit.modules);
  const catalog = loadPracticeCatalog();
  assert.equal(catalog.length, 7);
  assert.equal(catalog.flatMap((entry) => entry.quests).filter((quest) => quest.boss).length, 3);
  for (const entry of catalog) {
    assert.equal(modules.find((module) => module.id === entry.moduleId)?.versionId, entry.versionId);
    assert.ok(isModulePractice(entry));
    for (const quest of entry.quests) assert.equal(new Set(quest.choices).size, quest.choices.length);
  }
  const entry = catalog[0]!;
  assert.equal(isModulePractice({ ...entry, quests: [{ ...entry.quests[0], answerIndex: 99 }] }), false);
  assert.equal(isModulePractice({ ...entry, quests: [null] }), false);
});

test('practice validation rejects malformed JSON shapes and indistinguishable answers without throwing', () => {
  const entry = loadPracticeCatalog()[0]!;
  const quest = entry.quests[0]!;
  const invalid: unknown[] = [null, true, 7, 'text', [], {},
    { ...entry, moduleId: 'x'.repeat(201) }, { ...entry, versionId: '' }, { ...entry, extra: 'field' },
    ...[null, false, 1, 'quest', [], {}, { ...quest, extra: true }, { ...quest, choices: 'answers' },
      { ...quest, choices: [null, 'answer'] }, { ...quest, answerIndex: -1 }, { ...quest, answerIndex: 0.5 },
      { ...quest, answerIndex: '0' }, { ...quest, choices: ['Same answer', 'Same answer'] },
      { ...quest, choices: ['Same answer', '  Same\nanswer '] }, { ...quest, hint: '' }]
      .map((badQuest) => ({ ...entry, quests: [badQuest] })),
    { ...entry, quests: [quest, quest] },
  ];
  for (const value of invalid) {
    assert.equal(isModulePractice(JSON.parse(JSON.stringify(value))), false, JSON.stringify(value));
  }
  assert.equal(isModulePractice({ ...entry, quests: [] }), true, 'Modules without practice are a valid API response');
});

test('content validation requires a reviewed current lesson for every practice entry', () => {
  const bundle = loadCppBasicsBundle();
  validatePracticeVersions([bundle]);
  assert.throws(() => validatePracticeVersions([]), /Review practice quests/);
  const changed = structuredClone(bundle);
  const first = changed.units.flatMap((unit) => unit.modules).find((module) => module.id === loadPracticeCatalog()[0]!.moduleId)!;
  first.versionId = 'new-unreviewed-version';
  assert.throws(() => validatePracticeVersions([changed]), /Review practice quests/);
});

async function fixture(t: TestContext, loadCatalog?: () => ModulePractice[]) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-practice-'));
  const project = join(directory, 'project');
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups') }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  const bundle = loadNamedContent('cpp');
  installContentBundle(database, bundle);
  const app = Fastify({ logger: false });
  registerErrors(app);
  registerPracticeRoutes(app, database, loadCatalog);
  t.after(async () => { await app.close(); database.close(); await rm(directory, { recursive: true, force: true }); });
  const entry = loadPracticeCatalog()[0]!;
  const url = `/api/modules/${entry.moduleId}/practice`;
  return { database, app, bundle, entry, url };
}

test('practice API follows curriculum visibility, returns empty sets for other modules and never creates learner evidence', async (t) => {
  const { database, app, bundle, entry, url } = await fixture(t);
  const response = await app.inject(url);
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.deepEqual(response.json<ModulePractice>(), entry);
  const other = bundle.units.flatMap((unit) => unit.modules).find((module) => !loadPracticeCatalog().some((item) => item.moduleId === module.id))!;
  assert.deepEqual((await app.inject(`/api/modules/${other.id}/practice`)).json<ModulePractice>().quests, []);
  database.exec("UPDATE categories SET status = 'archived'");
  assert.equal((await app.inject(url)).statusCode, 404);
  assert.equal((await app.inject('/api/modules/unknown/practice')).statusCode, 404);
  assert.equal(database.prepare('SELECT count(*) AS count FROM user_module_progress').get()?.count, 0);
  assert.equal(database.prepare('SELECT count(*) AS count FROM exercise_attempts').get()?.count, 0);
});

test('practice for a different lesson version is withheld', async (t) => {
  const catalog = loadPracticeCatalog().map((entry) => ({ ...entry, versionId: 'old-reviewed-version' }));
  const { app, entry, url } = await fixture(t, () => catalog);
  const response = await app.inject(url);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { moduleId: entry.moduleId, versionId: entry.versionId, quests: [] });
});

test('damaged optional practice does not block startup; a later request can recover and cache the catalog', async (t) => {
  let attempts = 0;
  const { app, entry, url } = await fixture(t, () => {
    attempts += 1;
    if (attempts === 1) throw new Error('A damaged optional practice asset.');
    return loadPracticeCatalog();
  });
  app.get('/available', async () => ({ available: true }));
  await app.ready();
  assert.equal(attempts, 0);
  assert.equal((await app.inject('/available')).statusCode, 200);
  assert.equal((await app.inject('/api/modules/unknown/practice')).statusCode, 404);
  assert.equal(attempts, 0, 'Visibility is checked before loading practice');
  const failed = await app.inject(url);
  assert.equal(failed.statusCode, 500);
  assert.doesNotMatch(failed.body, /damaged optional practice asset/);
  assert.deepEqual((await app.inject(url)).json(), entry);
  assert.deepEqual((await app.inject(url)).json(), entry);
  assert.equal(attempts, 2, 'A successful catalog load is reused');
});
