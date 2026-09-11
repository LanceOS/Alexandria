import type { CurriculumUnit } from '../types';

export interface LearningPathEntry {
  unit: CurriculumUnit;
  depth: number;
  index: number;
  ancestors: string[];
  children: LearningPathEntry[];
  moduleCount: number;
}

/** Follow the published hierarchy and ordering, including units with missing parents. */
export function buildLearningPath(units: CurriculumUnit[]) {
  const ids = new Set(units.map((unit) => unit.id));
  const children = new Map<string | null, CurriculumUnit[]>();
  for (const unit of units) {
    const parent = unit.parentUnitId && ids.has(unit.parentUnitId) ? unit.parentUnitId : null;
    children.set(parent, [...(children.get(parent) ?? []), unit]);
  }
  const entries: LearningPathEntry[] = [];
  function visit(unit: CurriculumUnit, index: number, ancestors: string[]): LearningPathEntry {
    const entry: LearningPathEntry = { unit, index, ancestors, depth: ancestors.length, children: [], moduleCount: unit.modules.length };
    entries.push(entry);
    entry.children = (children.get(unit.id) ?? [])
      .filter((child) => child.id !== unit.id && !ancestors.includes(child.id))
      .map((child, childIndex) => visit(child, childIndex, [...ancestors, unit.id]));
    entry.moduleCount += entry.children.reduce((total, child) => total + child.moduleCount, 0);
    return entry;
  }
  const roots = (children.get(null) ?? []).map((unit, index) => visit(unit, index, []));
  return { roots, entries };
}

export function initialExpandedUnits(entries: LearningPathEntry[], saved: string | null) {
  const collapsible = new Set(entries.filter((entry) => entry.depth > 0).map((entry) => entry.unit.id));
  if (saved !== null) {
    try {
      const ids: unknown = JSON.parse(saved);
      if (Array.isArray(ids) && ids.every((id) => typeof id === 'string')) {
        return new Set<string>(ids.filter((id) => collapsible.has(id)));
      }
    } catch { /* Ignore an unavailable or outdated view preference. */ }
  }
  const first = entries.find((entry) => entry.unit.modules.length > 0);
  return new Set(first ? [...first.ancestors, first.unit.id].filter((id) => collapsible.has(id)) : []);
}

export function revealUnit(entries: LearningPathEntry[], expanded: ReadonlySet<string>, unitId: string) {
  const entry = entries.find((candidate) => candidate.unit.id === unitId);
  if (!entry) return new Set(expanded);
  const visiblePath = new Set([...entry.ancestors, unitId]);
  return new Set([...expanded, ...entries.filter((candidate) => candidate.depth > 0 && visiblePath.has(candidate.unit.id)).map((candidate) => candidate.unit.id)]);
}
