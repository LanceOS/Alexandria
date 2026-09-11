import { readFileSync } from 'node:fs';
import { isModulePractice, type ModulePractice } from '../../shared/practice.js';
import type { ContentBundle } from './content-definition.js';

export function loadPracticeCatalog(): ModulePractice[] {
  const data: unknown = JSON.parse(readFileSync(new URL('../../content/practice/cpp-basics.json', import.meta.url), 'utf8'));
  if (!Array.isArray(data) || !data.every(isModulePractice)
    || new Set(data.map((entry) => entry.moduleId)).size !== data.length) {
    throw new Error('Invalid practice quest catalog.');
  }
  return data;
}

export function validatePracticeVersions(bundles: ContentBundle[]): void {
  const modules = new Map(bundles.flatMap((bundle) => bundle.units.flatMap((unit) => unit.modules)).map((module) => [module.id, module.versionId]));
  for (const entry of loadPracticeCatalog()) {
    if (modules.get(entry.moduleId) !== entry.versionId) throw new Error(`Review practice quests against the current lesson version: ${entry.moduleId}.`);
  }
}
