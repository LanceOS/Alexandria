import { useMemo } from 'react';
import { EmptyState, Icon } from '../../../components/ui';
import type { CurriculumUnit, Navigate } from '../types';
import { useLearningPath } from '../hooks/useLearningPath';
import { buildLearningPath } from '../utils/learningPath';
import { LearningPathNavigation } from './LearningPathNavigation';
import { UnitBranch } from './UnitBranch';

export function LearningPath({ units, topicSlug, navigate }: { units: CurriculumUnit[]; topicSlug: string; navigate: Navigate }) {
  const { roots, entries } = useMemo(() => buildLearningPath(units), [units]);
  const path = useLearningPath(entries, topicSlug);
  return <section className="curriculum-path" aria-labelledby="curriculum-path-heading">
    <div className="curriculum-path-heading"><h2 id="curriculum-path-heading">Your learning path</h2><span>Open a subunit. Find your next idea.</span></div>
    <LearningPathNavigation entries={entries} topicSlug={topicSlug} navigate={navigate} onJumpToUnit={path.jumpToUnit}
      allExpanded={path.allExpanded} onToggleAll={path.toggleAll} collapsibleCount={path.collapsibleCount} />
    {roots.length ? roots.map((entry) => <UnitBranch key={entry.unit.id} entry={entry} topicSlug={topicSlug} navigate={navigate}
      expanded={path.expanded} onToggle={path.toggle} registerHeading={path.registerHeading} />)
      : <EmptyState icon={<Icon name="book" size={26} />} title="A little room to grow" description="Units will appear here when they’re ready to explore." />}
  </section>;
}
