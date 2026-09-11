import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const scope = process.argv[2] ?? 'all';
if (!['all', 'client', 'server'].includes(scope) || process.argv.length > 3) {
  throw new Error('Test scope must be all, client, or server.');
}

function discover(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? discover(path) : /\.test\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

const roots = scope === 'all' ? ['server', 'client/src'] : [scope === 'client' ? 'client/src' : 'server'];
const files = roots.flatMap((root) => discover(join(project, root))).sort();
if (files.length === 0) throw new Error(`No tests found for ${scope}.`);
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], { cwd: project, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
