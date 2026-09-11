import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

test('features expose public entry points and shared UI does not depend on feature internals', () => {
  for (const feature of ['library', 'curriculum']) {
    const root = join(sourceRoot, 'modules', feature);
    assert.ok(existsSync(join(root, 'index.ts')));
    for (const directory of ['hooks', 'utils', 'components', 'pages', 'tests']) {
      assert.ok(readdirSync(join(root, directory)).length > 0, `${feature}/${directory} must contain its implementation`);
    }
  }
  for (const file of sourceFiles(sourceRoot)) {
    if (file.includes(`${sep}tests${sep}`)) continue;
    const local = relative(sourceRoot, file).split(sep);
    const feature = local[0] === 'modules' ? local[1] : undefined;
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith('.')) continue;
      const target = relative(sourceRoot, resolve(dirname(file), specifier.text)).split(sep);
      if (target[0] !== 'modules') continue;
      if (['components', 'hooks', 'utils'].includes(local[0]!)) {
        assert.fail(`Shared ${local.join('/')} must not depend on feature ${target.join('/')}`);
      }
      if (target[1] !== feature) {
        assert.ok(target.length === 2 || (target.length === 3 && /^index(?:\.ts)?$/.test(target[2]!)),
          `${local.join('/')} must use the public entry point for ${target[1]}`);
      }
    }
  }
});
