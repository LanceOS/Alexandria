import { closeSync, mkdtempSync, openSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Authoring-only verification of reviewed repository examples. Never invoked by
// the server, reader, importer, or default test suite. Shell blocks are not run.
const content = fileURLToPath(new URL('../content/units/', import.meta.url));
const requested = process.argv[2];
if (process.argv.length > 3 || (requested !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requested))) {
  throw new Error('Provide at most one topic folder, for example: cpp.');
}
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link in content: ${path}`);
    return entry.isDirectory() ? files(path) : entry.name.endsWith('.json') && entry.name !== 'unit.json' ? [path] : [];
  });
}
const compiler = process.env.CXX ?? 'g++';
const flags = ['-std=c++20', '-Wall', '-Wextra', '-Werror', '-pedantic-errors', '-pthread'];
const directory = mkdtempSync(join(tmpdir(), 'alexandria-cpp-examples-'));
// File descriptors also work in authoring sandboxes that disallow Node's pipe setup.
function run(executable, args, timeout, input = '') {
  const paths = ['stdin', 'stdout', 'stderr'].map((name) => join(directory, name));
  writeFileSync(paths[0], input);
  const descriptors = paths.map((path, index) => openSync(path, index === 0 ? 'r' : 'w'));
  let result;
  try {
    result = spawnSync(executable, args, { cwd: directory, stdio: descriptors, timeout });
  } finally {
    descriptors.forEach((descriptor) => closeSync(descriptor));
  }
  if (paths.slice(1).some((path) => statSync(path).size > 1024 * 1024)) throw new Error('Example output exceeds 1 MiB.');
  return { ...result, stdout: readFileSync(paths[1], 'utf8'), stderr: readFileSync(paths[2], 'utf8') };
}
const failures = [];
let checked = 0;
let compilerVersion;
try {
  compilerVersion = run(compiler, ['--version'], 10_000);
  if (compilerVersion.error || compilerVersion.status !== 0) throw new Error(`Cannot run compiler ${compiler}: ${compilerVersion.error?.message ?? compilerVersion.stderr}. Set CXX to its executable path.`);
  for (const path of files(requested ? join(content, requested) : content)) {
    const module = JSON.parse(readFileSync(path, 'utf8'));
    let example = 0;
    for (const part of module.parts) {
      for (const [index, block] of part.blocks.entries()) {
        if (block.type !== 'code' || block.language !== 'cpp') continue;
        const key = `${module.id}:${example++}`;
        const following = part.blocks.slice(index + 1);
        const nextProgram = following.findIndex((item) => item.type === 'code' && item.language === 'cpp');
        const outputs = (nextProgram < 0 ? following : following.slice(0, nextProgram))
          .filter((item) => item.type === 'code' && item.language === 'text'
            && /expected (?:standard )?output|program output when standard input/i.test(item.caption ?? ''));
        if (outputs.length !== 1) {
          failures.push({ key, path, error: 'Each complete C++ example needs exactly one following expected-output block in its section.' });
          continue;
        }
        const source = join(directory, 'main.cpp');
        const executable = join(directory, 'lesson');
        writeFileSync(source, block.code);
        const compiled = run(compiler, [...flags, source, '-o', executable], 30_000);
        if (compiled.error || compiled.status !== 0) {
          failures.push({ key, path, error: compiled.error?.message ?? compiled.stderr });
          continue;
        }
        const input = key === 'cpp_basics_module_output:2' ? '3\n' : '';
        const result = run(executable, [], 5_000, input);
        if (result.error || result.status !== 0 || result.stdout !== outputs[0].code || result.stderr !== '') {
          failures.push({ key, path, error: result.error?.message ?? 'Exit status, stdout, or stderr differs.',
            status: result.status, expected: outputs[0].code, stdout: result.stdout, stderr: result.stderr });
          continue;
        }
        checked += 1;
      }
    }
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
console.log(JSON.stringify({ compiler: compilerVersion.stdout.split('\n')[0], flags, checked, failures }, null, 2));
if (failures.length) process.exitCode = 1;
