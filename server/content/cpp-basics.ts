import type { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { installContentBundle } from './install-content.js';
import { defaultContentDirectory, loadContentBundle } from './load-content.js';

// Stable identifiers retained for existing links and the original starter installer.
export const cppBasicsIds = {
  topic: 'cpp_starter_topic',
  unit: 'cpp_starter_unit_cpp',
  basics: 'cpp_starter_unit_basics',
  module: 'cpp_starter_module_first_program',
  version: 'cpp_starter_version_1',
} as const;

export function loadCppBasicsBundle() {
  return loadContentBundle(join(defaultContentDirectory, 'cpp'));
}

const starter = loadCppBasicsBundle().units.flatMap((unit) => unit.modules)
  .find((module) => module.id === cppBasicsIds.module);
if (!starter) throw new Error('The C++ starter module is missing from its unit folder.');
export const cppBasicsParts = starter.parts;

/** Compatibility entry point for installing only the original introductory lesson. */
export function installCppBasics(database: DatabaseSync) {
  const bundle = loadCppBasicsBundle();
  const result = installContentBundle(database, { ...bundle, units: bundle.units.map((unit) => ({
    ...unit, modules: unit.modules.filter((module) => module.id === cppBasicsIds.module),
  })) });
  const { addedModules: _addedModules, ...counts } = result;
  return { ...counts, moduleId: cppBasicsIds.module };
}
