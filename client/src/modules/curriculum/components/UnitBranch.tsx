import { Icon } from '../../../components/ui';
import type { Navigate } from '../types';
import type { LearningPathEntry } from '../utils/learningPath';
import { ModuleCard } from './ModuleCard';

export function UnitBranch({ entry, topicSlug, navigate, expanded, onToggle, registerHeading }: {
  entry: LearningPathEntry; topicSlug: string; navigate: Navigate; expanded: ReadonlySet<string>;
  onToggle: (unitId: string) => void; registerHeading: (unitId: string, element: HTMLElement | null) => void;
}) {
  const { unit, children, depth, index, moduleCount } = entry;
  const isOpen = depth === 0 || expanded.has(unit.id);
  const headingId = `unit-${unit.id}`;
  const contentId = `unit-content-${unit.id}`;
  return <section className={`curriculum-unit ${depth === 0 ? 'curriculum-unit-root' : 'curriculum-unit-child'}`} aria-labelledby={`unit-${unit.id}`}>
    {depth === 0 ? <div className="curriculum-unit-heading">
      <span className="curriculum-unit-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <span className="curriculum-label">UNIT</span>
        <h3 id={headingId} tabIndex={-1} ref={(element) => registerHeading(unit.id, element)}>{unit.name}</h3>
        {unit.description && <p>{unit.description}</p>}
      </div>
      <Icon name="code" size={22} />
    </div> : <div className="curriculum-subunit-header">
      <h3 id={headingId}>
        <button type="button" className="curriculum-subunit-toggle" aria-expanded={isOpen} aria-controls={contentId}
          ref={(element) => registerHeading(unit.id, element)} onClick={() => onToggle(unit.id)}>
          <span className="curriculum-subunit-copy"><span className="curriculum-label">SUBUNIT {String(index + 1).padStart(2, '0')}</span><span className="curriculum-subunit-title">{unit.name}</span></span>
          <span className="curriculum-subunit-count">{moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</span>
          <Icon name="chevron-down" className="curriculum-subunit-chevron" size={19} />
        </button>
      </h3>
      {isOpen && unit.description && <p>{unit.description}</p>}
    </div>}
    <div id={contentId} className="curriculum-unit-content" hidden={!isOpen}>
      {unit.modules.length > 0 && <div className="curriculum-module-list">
        {unit.modules.map((module, moduleIndex) => <ModuleCard key={module.id} module={module} index={moduleIndex} topicSlug={topicSlug} navigate={navigate} />)}
      </div>}
      {children.map((child) => <UnitBranch key={child.unit.id} entry={child} topicSlug={topicSlug} navigate={navigate}
        expanded={expanded} onToggle={onToggle} registerHeading={registerHeading} />)}
      {!unit.modules.length && !children.length && <p className="curriculum-empty-unit">There are no modules in this unit yet.</p>}
    </div>
  </section>;
}
