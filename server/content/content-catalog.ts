import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defaultContentDirectory, loadContentBundle } from './load-content.js';
import type { ContentBundle } from './content-definition.js';

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

/** Cross-topic identities share database tables, even though files are loaded one root at a time. */
export function validateContentCatalog(bundles: ContentBundle[]): void {
  const ids = new Map<string, string>();
  const slugs = new Set<string>();
  for (const bundle of bundles) {
    const topic = bundle.topic.slug;
    if (slugs.has(topic)) throw new Error(`Duplicate topic slug in content catalog: ${topic}.`);
    slugs.add(topic);
    const ownedIds = [bundle.topic.id, ...bundle.units.flatMap((unit) => [unit.id,
      ...unit.modules.flatMap((module) => [module.id, module.versionId,
        ...module.parts.map((part) => part.id), ...module.sources.map((source) => source.id)])])];
    for (const id of ownedIds) {
      const previous = ids.get(id);
      if (previous !== undefined) throw new Error(`Duplicate content ID "${id}" in topics "${previous}" and "${topic}".`);
      ids.set(id, topic);
    }
  }
}

export function loadContentCatalog(names = listContentNames()): ContentBundle[] {
  const bundles = names.map(loadNamedContent);
  validateContentCatalog(bundles);
  return bundles;
}

export function readImportContentNames(args: string[]): string[] {
  if (args.length === 1 && args[0] === '--all') return listContentNames();
  return [readContentArgument(args, true)!];
}
