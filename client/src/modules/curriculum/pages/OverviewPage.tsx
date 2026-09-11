import type { ReactNode } from 'react';
import { EmptyState, Icon } from '../../../components/ui';
import type { HeadingRef, Navigate, TopicOutline } from '../types';
import { CurriculumLink } from '../components/CurriculumLink';
import { UnitBranch } from '../components/UnitBranch';

export function OverviewPage({ outline, topicSlug, onNavigate, headingRef, backLink }: {
  outline: TopicOutline; topicSlug: string; onNavigate: Navigate; headingRef: HeadingRef; backLink: ReactNode;
}) {
  const roots = outline.units.filter((unit) => !unit.parentUnitId || !outline.units.some((parent) => parent.id === unit.parentUnitId));
  const modules = outline.units.flatMap((unit) => unit.modules);
  const firstModule = modules[0];
  return <div className="curriculum-page curriculum-overview">
    {backLink}
    <header className="curriculum-hero">
      <div className="curriculum-hero-copy">
        <div className="curriculum-label">A NEW DIRECTION</div>
        <h1 ref={headingRef} tabIndex={-1}>{outline.topic.name}</h1>
        <p>{outline.topic.description}</p>
        <div className="curriculum-hero-meta"><span><Icon name="grid" size={15} />{roots.length} {roots.length === 1 ? 'unit' : 'units'}</span><span><Icon name="book" size={15} />{modules.length} {modules.length === 1 ? 'module' : 'modules'}</span></div>
        {firstModule && <CurriculumLink destination={{ topicSlug, moduleId: firstModule.id }} navigate={onNavigate} className="ui-button ui-button--primary curriculum-start">Start learning<Icon name="arrow-right" size={17} /></CurriculumLink>}
      </div>
      <div className="curriculum-hero-art" aria-hidden="true"><span className="curriculum-art-orbit" /><span className="curriculum-art-square"><Icon name="code" size={63} /></span><span className="curriculum-art-star">✳</span><span className="curriculum-art-caption">A LITTLE FURTHER, EVERY DAY.</span></div>
    </header>
    <section className="curriculum-path" aria-labelledby="curriculum-path-heading">
      <div className="curriculum-path-heading"><h2 id="curriculum-path-heading">Your learning path</h2><span>A foundation, one idea at a time</span></div>
      {roots.length ? roots.map((unit, index) => <UnitBranch key={unit.id} unit={unit} units={outline.units} depth={0} index={index} topicSlug={topicSlug} navigate={onNavigate} />)
        : <EmptyState icon={<Icon name="book" size={26} />} title="A little room to grow" description="Units will appear here when they’re ready to explore." />}
    </section>
    <footer className="curriculum-footer"><Icon name="bookmark" size={15} /><span>Make room for understanding. Take it at your own pace.</span></footer>
  </div>;
}
