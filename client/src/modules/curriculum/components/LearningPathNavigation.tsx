import { useId, useState } from 'react';
import { Button, Icon } from '../../../components/ui';
import type { Navigate } from '../types';
import type { LearningPathEntry } from '../utils/learningPath';

export function LearningPathNavigation({ entries, topicSlug, navigate, onJumpToUnit, allExpanded, onToggleAll, collapsibleCount }: {
  entries: LearningPathEntry[]; topicSlug: string; navigate: Navigate; onJumpToUnit: (unitId: string) => void;
  allExpanded: boolean; onToggleAll: () => void; collapsibleCount: number;
}) {
  const selectId = useId();
  const [selection, setSelection] = useState('');
  const groups = entries.filter((entry) => entry.depth > 0 || entry.unit.modules.length > 0);
  const names = new Map(entries.map((entry) => [entry.unit.id, entry.unit.name]));

  function goToSelection() {
    for (const entry of groups) {
      if (selection === `unit:${entry.unit.id}`) {
        onJumpToUnit(entry.unit.id);
        setSelection('');
        return;
      }
      const module = entry.unit.modules.find((candidate) => selection === `module:${candidate.id}`);
      if (module) {
        navigate({ topicSlug, moduleId: module.id });
        return;
      }
    }
  }

  if (!groups.length) return null;
  return <div className="curriculum-path-tools">
    <form className="curriculum-path-jump" aria-label="Learning path navigation" onSubmit={(event) => { event.preventDefault(); goToSelection(); }}>
      <label htmlFor={selectId}>Jump to</label>
      <span className="curriculum-jump-select">
        <select id={selectId} className="ui-input" value={selection} onChange={(event) => setSelection(event.target.value)}>
          <option value="">Choose a subunit or module</option>
          {groups.map((entry) => <optgroup key={entry.unit.id} label={[...entry.ancestors.map((id) => names.get(id)), entry.unit.name].join(' / ')}>
            <option value={`unit:${entry.unit.id}`}>{entry.unit.name} — overview</option>
            {entry.unit.modules.map((module) => <option key={module.id} value={`module:${module.id}`}>{module.title}</option>)}
          </optgroup>)}
        </select>
        <Icon name="chevron-down" size={16} />
      </span>
      <Button type="submit" variant="secondary" disabled={!selection} aria-label="Go to selection">Go<Icon name="arrow-right" size={15} /></Button>
    </form>
    {collapsibleCount > 0 && <Button variant="ghost" className="curriculum-path-toggle-all" onClick={onToggleAll}>
      <Icon name={allExpanded ? 'menu' : 'grid'} size={15} />{allExpanded ? 'Collapse all' : 'Expand all'}
    </Button>}
  </div>;
}
