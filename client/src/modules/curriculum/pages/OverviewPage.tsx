import type { ReactNode } from 'react';
import { Icon } from '../../../components/ui';
import type { HeadingRef, Navigate, TopicOutline } from '../types';
import { CurriculumLink } from '../components/CurriculumLink';
import { LearningPath } from '../components/LearningPath';
import { ExtraReading } from '../components/ExtraReading';
import { nextReadingModule, ReadingJourney, readingStatus, useLearningProgress } from '../../progress';

export function OverviewPage({ outline, topicSlug, onNavigate, headingRef, backLink }: {
  outline: TopicOutline; topicSlug: string; onNavigate: Navigate; headingRef: HeadingRef; backLink: ReactNode;
}) {
  const roots = outline.units.filter((unit) => !unit.parentUnitId || !outline.units.some((parent) => parent.id === unit.parentUnitId));
  const modules = outline.units.flatMap((unit) => unit.modules);
  const firstModule = modules[0];
  const { progress } = useLearningProgress();
  const nextModule = nextReadingModule(modules, progress);
  const completedModules = modules.filter((module) => readingStatus(progress, module).complete).length;
  return <div className="curriculum-page curriculum-overview">
    {backLink}
    <header className="curriculum-hero">
      <div className="curriculum-hero-copy">
        <div className="curriculum-label">A NEW DIRECTION</div>
        <h1 ref={headingRef} tabIndex={-1}>{outline.topic.name}</h1>
        <p>{outline.topic.description}</p>
        <div className="curriculum-hero-meta"><span><Icon name="grid" size={15} />{roots.length} {roots.length === 1 ? 'unit' : 'units'}</span><span><Icon name="book" size={15} />{modules.length} {modules.length === 1 ? 'module' : 'modules'}</span></div>
        <div className="curriculum-overview-actions">
          {firstModule && <CurriculumLink destination={{ topicSlug, moduleId: (nextModule ?? firstModule).id }} navigate={onNavigate} className="ui-button ui-button--primary curriculum-start">{!nextModule ? 'Revisit course' : progress?.modules.some((saved) => modules.some((module) => module.id === saved.moduleId)) ? 'Continue reading' : 'Start learning'}<Icon name="arrow-right" size={17} /></CurriculumLink>}
          <a href="#extra-reading-heading" className="curriculum-reading-shortcut"><Icon name="book" size={16} />Extra Reading<Icon name="arrow-right" size={15} /></a>
        </div>
      </div>
      <div className="curriculum-hero-art" aria-hidden="true"><span className="curriculum-art-orbit" /><span className="curriculum-art-square"><Icon name="code" size={63} /></span><span className="curriculum-art-star">✳</span><span className="curriculum-art-caption">A LITTLE FURTHER, EVERY DAY.</span></div>
    </header>
    <ReadingJourney topicName={outline.topic.name} completedModules={completedModules} totalModules={modules.length}
      continueAction={nextModule ? <CurriculumLink destination={{ topicSlug, moduleId: nextModule.id }} navigate={onNavigate} className="journey-continue">{progress?.modules.some((module) => modules.some((current) => current.id === module.moduleId)) ? 'Continue reading' : 'Begin your journey'}<Icon name="arrow-right" size={15} /><span>{nextModule.title}</span></CurriculumLink>
        : modules.length > 0 ? <p className="journey-note">You’ve read every current module. Explore the path below to revisit an idea.</p> : undefined} />
    <LearningPath key={topicSlug} units={outline.units} topicSlug={topicSlug} navigate={onNavigate} />
    <ExtraReading key={`reading-${topicSlug}`} references={outline.extraReading} modules={modules} topicSlug={topicSlug} navigate={onNavigate} />
    <footer className="curriculum-footer"><Icon name="bookmark" size={15} /><span>Make room for understanding. Take it at your own pace.</span></footer>
  </div>;
}
