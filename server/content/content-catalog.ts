import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defaultContentDirectory, loadContentBundle } from './load-content.js';

export function readContentArgument(args: string[], required: boolean): string | undefined {
  if (args.length > 1 || (required && args.length !== 1) || (args[0] !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args[0]))) {
    throw new Error(`Provide ${required ? 'one' : 'at most one'} unit folder name, for example: cpp.`);
  }
  return args[0];
}

export function loadNamedContent(name: string) {
  readContentArgument([name], true);
  return loadContentBundle(join(defaultContentDirectory, name));
}

export function listContentNames(): string[] {
  const entries = readdirSync(defaultContentDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`Expected a unit folder in ${defaultContentDirectory}: ${entry.name}`);
    }
  }
  return entries.map((entry) => entry.name).sort();
}
