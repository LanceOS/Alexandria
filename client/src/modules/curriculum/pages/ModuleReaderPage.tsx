import { Badge, Icon } from '../../../components/ui';
import type { HeadingRef, ModuleDetail, Navigate, TopicOutline } from '../types';
import { ContentBlock } from '../components/ContentBlock';
import { CurriculumLink } from '../components/CurriculumLink';
import { SectionLinks } from '../components/SectionLinks';
import { Sources } from '../components/Sources';
import { getReaderNavigation } from '../utils/reader';

export function ModuleReaderPage({ outline, detail, topicSlug, moduleId, part, partIndex, onNavigate, headingRef }: {
  outline: TopicOutline; detail: ModuleDetail; topicSlug: string; moduleId: string;
  part: ModuleDetail['parts'][number]; partIndex: number; onNavigate: Navigate; headingRef: HeadingRef;
}) {
  const overview = { topicSlug };
  const { previous, next, finalSection, owningUnit, nextModule, nextDestination } = getReaderNavigation(outline, detail, partIndex, topicSlug);
  const sectionLinks = <SectionLinks parts={detail.parts} activePartId={part.id} topicSlug={topicSlug} moduleId={moduleId} navigate={onNavigate} />;

  return <div className="curriculum-page curriculum-reader">
    <nav className="curriculum-breadcrumb" aria-label="Module breadcrumb">
      <CurriculumLink destination={null} navigate={onNavigate}>Library</CurriculumLink><Icon name="chevron-right" size={12} />
      <CurriculumLink destination={overview} navigate={onNavigate}>{detail.topic.name}</CurriculumLink>
      {detail.units.filter((unit) => unit.name !== detail.topic.name).map((unit) => <span className="curriculum-breadcrumb-unit" key={unit.id}><Icon name="chevron-right" size={12} /><CurriculumLink destination={overview} navigate={onNavigate}>{unit.name}</CurriculumLink></span>)}
    </nav>
    <header className="lesson-header">
      <div className="lesson-header-meta"><Badge>MODULE</Badge><span>{detail.parts.length} {detail.parts.length === 1 ? 'section' : 'sections'}</span></div>
      <h1>{detail.module.title}</h1><p>{detail.module.summary}</p>
    </header>
    <details className="lesson-mobile-outline" key={`${moduleId}-${part.id}`}>
      <summary><span><Icon name="menu" size={17} />In this module<span>Section {partIndex + 1} of {detail.parts.length}</span></span><Icon name="chevron-down" size={17} /></summary>
      <nav aria-label="Module sections">{sectionLinks}</nav>
    </details>
    <div className="lesson-layout">
      <article className="lesson-article" key={part.id} aria-labelledby="lesson-section-heading">
        {partIndex === 0 && detail.version.objectives.length > 0 && <section className="lesson-objectives" aria-labelledby="lesson-objectives-heading">
          <h2 id="lesson-objectives-heading">What you’ll learn</h2>
          <ul>{detail.version.objectives.map((objective, index) => <li key={index}><span aria-hidden="true">↗</span>{objective}</li>)}</ul>
        </section>}
        <div className="lesson-part-header"><span className="curriculum-label">SECTION {String(partIndex + 1).padStart(2, '0')}</span><h2 id="lesson-section-heading" ref={headingRef} tabIndex={-1}>{part.title}</h2></div>
        <div className="lesson-prose">{part.blocks.map((block, index) => <ContentBlock key={index} block={block} />)}</div>
        {finalSection && !nextModule && <p className="lesson-unit-end">This is the last module currently available{owningUnit ? ` in ${owningUnit.name}` : ''}. You can revisit any module from the learning path.</p>}
        <nav className="lesson-pagination" aria-label="Lesson navigation">
          <CurriculumLink destination={previous ? { topicSlug, moduleId, partId: previous.id } : overview} navigate={onNavigate} className="lesson-pagination-previous">
            <Icon name="arrow-left" size={17} /><span><small>{previous ? 'PREVIOUS SECTION' : 'LEARNING PATH'}</small><span>{previous?.title ?? `Back to ${detail.topic.name}`}</span></span>
          </CurriculumLink>
          <CurriculumLink destination={nextDestination} navigate={onNavigate} className="lesson-pagination-next">
            <span><small>{next ? 'UP NEXT' : nextModule ? 'NEXT MODULE' : 'END OF UNIT'}</small><span>{next?.title ?? nextModule?.title ?? 'Return to learning path'}</span></span><Icon name="arrow-right" size={18} />
          </CurriculumLink>
        </nav>
        <Sources sources={detail.sources} expanded={finalSection} moduleTitle={detail.module.title} />
      </article>
      <aside className="lesson-outline" aria-label="Module outline">
        <div className="lesson-outline-sticky">
          <div className="curriculum-label">IN THIS MODULE</div>
          <nav aria-label="Module sections">{sectionLinks}</nav>
          <div className="lesson-position"><span>Section {partIndex + 1} of {detail.parts.length}</span><div aria-hidden="true">{detail.parts.map((section) => <span key={section.id} className={section.id === part.id ? 'is-current' : ''} />)}</div></div>
          <CurriculumLink destination={overview} navigate={onNavigate} className="curriculum-back-link"><Icon name="arrow-left" size={14} />Back to learning path</CurriculumLink>
        </div>
      </aside>
    </div>
  </div>;
}
