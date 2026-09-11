import assert from 'node:assert/strict';
import { cpSync, readFileSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { defaultContentDirectory, loadContentBundle } from './load-content.js';
import { readContentArgument } from './content-catalog.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-json-loader-'));
  const root = join(directory, 'cpp');
  cpSync(join(defaultContentDirectory, 'cpp'), root, { recursive: true });
  t.after(() => rm(directory, { recursive: true, force: true }));
  return root;
}

function editJson(path: string, edit: (data: any) => void) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  edit(data);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

test('JSON discovery derives the unit hierarchy and uses positions rather than filenames for module order', async (t) => {
  const root = await fixture(t);
  renameSync(join(root, 'basics', '01-first-program.json'), join(root, 'basics', 'zz-first-program.json'));
  const bundle = loadContentBundle(root);
  assert.equal(bundle.topic.slug, 'cpp');
  assert.deepEqual(bundle.units.slice(0, 2).map((unit) => [unit.slug, unit.parentUnitId]), [['cpp', null], ['basics', 'cpp_starter_unit_cpp']]);
  const modules = bundle.units.find((unit) => unit.slug === 'basics')!.modules;
  assert.equal(modules.length, 7);
  assert.equal(modules[0]!.id, 'cpp_starter_module_first_program');
  assert.equal(modules[5]!.id, 'cpp_basics_module_functions');
  assert.equal(modules[6]!.id, 'cpp_basics_module_output');
});

test('validation identifies the filename for malformed JSON and rejects unsupported lesson fields', async (t) => {
  const root = await fixture(t);
  const path = join(root, 'basics', '02-variables.json');
  const original = readFileSync(path, 'utf8');
  writeFileSync(path, '{broken');
  assert.throws(() => loadContentBundle(root), /02-variables\.json/);
  writeFileSync(path, original);
  editJson(path, (data) => { data.parts[0].blocks[0].html = '<script>unexpected</script>'; });
  assert.throws(() => loadContentBundle(root), /02-variables\.json/);
  writeFileSync(path, original);
  editJson(path, (data) => { data.parts[0].blocks = []; });
  assert.throws(() => loadContentBundle(root), /02-variables\.json/);
});

test('semantic validation rejects ambiguous IDs, ordering, unit ownership, and unsafe reading links', async (t) => {
  const root = await fixture(t);
  const modulePath = join(root, 'basics', '02-variables.json');
  const original = readFileSync(modulePath, 'utf8');
  for (const edit of [
    (data: any) => { data.id = 'cpp_starter_module_first_program'; },
    (data: any) => { data.parts[1].id = data.parts[0].id; },
    (data: any) => { data.position = 0; },
    (data: any) => { data.sources[0].url = 'javascript:alert(1)'; },
    (data: any) => { data.sources[0].url = 'https://user:password@example.com/'; },
  ]) {
    editJson(modulePath, edit);
    assert.throws(() => loadContentBundle(root));
    writeFileSync(modulePath, original);
  }
  const unitPath = join(root, 'basics', 'unit.json');
  const originalUnit = readFileSync(unitPath, 'utf8');
  editJson(unitPath, (data) => { data.slug = 'a-different-folder'; });
  assert.throws(() => loadContentBundle(root), /unit\.json/);
  writeFileSync(unitPath, originalUnit);
  editJson(unitPath, (data) => { data.topic = JSON.parse(readFileSync(join(root, 'unit.json'), 'utf8')).topic; });
  assert.throws(() => loadContentBundle(root), /unit\.json/);
});

test('unit folders require metadata and cannot import a symlinked lesson', async (t) => {
  const root = await fixture(t);
  const unitPath = join(root, 'basics', 'unit.json');
  const hidden = join(root, 'basics', 'unit.saved');
  renameSync(unitPath, hidden);
  assert.throws(() => loadContentBundle(root));
  renameSync(hidden, unitPath);
  symlinkSync(join(root, 'basics', '01-first-program.json'), join(root, 'basics', 'linked.json'));
  assert.throws(() => loadContentBundle(root), /[Ss]ymbolic|symlink/);
});

test('content commands accept one explicit folder name without path traversal or silent defaults', () => {
  assert.equal(readContentArgument([], false), undefined);
  assert.equal(readContentArgument(['cpp'], true), 'cpp');
  for (const args of [[], ['../cpp'], ['/tmp/cpp'], ['cpp', 'python'], ['--unknown']]) {
    assert.throws(() => readContentArgument(args, true), /unit folder name/);
  }
});

test('module release numbers are optional positive safe integers and remain explicit when supplied', async (t) => {
  const root = await fixture(t);
  const path = join(root, 'basics', '02-variables.json');
  const original = readFileSync(path, 'utf8');
  editJson(path, (data) => { delete data.version; });
  assert.equal(loadContentBundle(root).units.find((unit) => unit.slug === 'basics')!.modules[1]!.version, undefined);
  editJson(path, (data) => { data.version = 2; });
  assert.equal(loadContentBundle(root).units.find((unit) => unit.slug === 'basics')!.modules[1]!.version, 2);
  for (const value of [0, -1, 1.5, '2', null, Number.MAX_SAFE_INTEGER + 1]) {
    writeFileSync(path, original);
    editJson(path, (data) => { data.version = value; });
    assert.throws(() => loadContentBundle(root), /02-variables\.json.*version/);
  }
});
