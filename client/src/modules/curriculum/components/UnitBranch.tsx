import { Icon } from '../../../components/ui';
import type { CurriculumUnit, Navigate } from '../types';
import { ModuleCard } from './ModuleCard';

export function UnitBranch({ unit, units, depth, index, topicSlug, navigate, ancestors = [] }: {
  unit: CurriculumUnit; units: CurriculumUnit[]; depth: number; index: number; topicSlug: string;
  navigate: Navigate; ancestors?: string[];
}) {
  if (ancestors.includes(unit.id)) return null;
  const children = units.filter((candidate) => candidate.parentUnitId === unit.id);
  return <section className={`curriculum-unit ${depth === 0 ? 'curriculum-unit-root' : 'curriculum-unit-child'}`} aria-labelledby={`unit-${unit.id}`}>
    <div className="curriculum-unit-heading">
      <span className="curriculum-unit-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <span className="curriculum-label">{depth === 0 ? 'UNIT' : 'SUBUNIT'}</span>
        <h3 id={`unit-${unit.id}`}>{unit.name}</h3>
        {unit.description && <p>{unit.description}</p>}
      </div>
      {depth === 0 && <Icon name="code" size={22} />}
    </div>
    {unit.modules.length > 0 && <div className="curriculum-module-list">
      {unit.modules.map((module, moduleIndex) => <ModuleCard key={module.id} module={module} index={moduleIndex} topicSlug={topicSlug} navigate={navigate} />)}
    </div>}
    {children.map((child, childIndex) => <UnitBranch key={child.id} unit={child} units={units} depth={depth + 1} index={childIndex}
      topicSlug={topicSlug} navigate={navigate} ancestors={[...ancestors, unit.id]} />)}
    {!unit.modules.length && !children.length && <p className="curriculum-empty-unit">There are no modules in this unit yet.</p>}
  </section>;
}

