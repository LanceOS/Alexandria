import type { DatabaseSync } from 'node:sqlite';
import { cppBasicsIds, loadCppBasicsBundle } from './cpp-basics.js';
import { installContentBundle } from './install-content.js';

export const cppBasicsModules = loadCppBasicsBundle().units.flatMap((unit) => unit.modules)
  .filter((module) => module.id !== cppBasicsIds.module);

/** Existing operator command now discovers its content from the C++ unit folder. */
export function installCppBasicsPath(database: DatabaseSync) {
  return installContentBundle(database, loadCppBasicsBundle());
}
