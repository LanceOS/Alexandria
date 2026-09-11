import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Badge, Button, EmptyState, Icon } from '../library';
import type { CurriculumUnit, LessonBlock, ModuleDetail, ModuleSummary, TopicOutline } from '../shared/curriculum';
import './curriculum.css';

type Destination = { topicSlug: string; moduleId?: string | null; partId?: string | null } | null;
type Navigate = (next: Destination) => void;

interface CurriculumProps {
  topicSlug: string;
  moduleId: string | null;
  partId: string | null;
  onNavigate: Navigate;
}

interface Resource<T> {
  url: string | null;
  data: T | null;
  error: 'missing' | 'connection' | null;
  loading: boolean;
}

function useResource<T>(url: string | null, validate: (value: unknown) => boolean) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState<Resource<T>>({ url: null, data: null, error: null, loading: false });

  useEffect(() => {
    if (!url) {
      setResource({ url, data: null, error: null, loading: false });
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let active = true;
    setResource({ url, data: null, error: null, loading: true });

    async function load() {
      try {
        const response = await fetch(url!, { signal: controller.signal });
        if (response.status === 404) {
          if (active) setResource({ url, data: null, error: 'missing', loading: false });
          return;
        }
        if (!response.ok) throw new Error('Request failed');
        const value: unknown = await response.json();
        if (!validate(value)) throw new Error('Invalid response');
        if (active) setResource({ url, data: value as T, error: null, loading: false });
      } catch {
        if (active) setResource({ url, data: null, error: 'connection', loading: false });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void load();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [url, attempt, validate]);

  return {
    ...(resource.url === url ? resource : { url, data: null, error: null, loading: Boolean(url) }),
    retry: () => setAttempt((value) => value + 1),
  };
}

function isOutline(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const outline = value as TopicOutline;
  return Boolean(outline.topic && typeof outline.topic.slug === 'string' && Array.isArray(outline.units)
    && outline.units.every((unit) => Array.isArray(unit.modules)));
}

function isDetail(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const detail = value as ModuleDetail;
  return Boolean(detail.topic && detail.module && detail.version && Array.isArray(detail.version.objectives)
    && Array.isArray(detail.units) && Array.isArray(detail.sources) && Array.isArray(detail.parts)
    && detail.parts.every((part) => Array.isArray(part.blocks)));
}

function destinationHref(destination: Destination): string {
  if (!destination) return '/';
  const params = new URLSearchParams({ topic: destination.topicSlug });
  if (destination.moduleId) params.set('module', destination.moduleId);
  if (destination.partId) params.set('part', destination.partId);
  return `/?${params.toString()}`;
}

function interceptNavigation(event: MouseEvent<HTMLAnchorElement>, destination: Destination, navigate: Navigate) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(destination);
}

function CurriculumLink({ destination, navigate, className, children, current }: {
  destination: Destination;
  navigate: Navigate;
  className?: string;
  children: ReactNode;
  current?: boolean;
}) {
  return <a className={className} href={destinationHref(destination)} aria-current={current ? 'page' : undefined}
    onClick={(event) => interceptNavigation(event, destination, navigate)}>{children}</a>;
}

function ModuleCard({ module, index, topicSlug, navigate }: {
  module: ModuleSummary; index: number; topicSlug: string; navigate: Navigate;
}) {
  return <CurriculumLink destination={{ topicSlug, moduleId: module.id }} navigate={navigate} className="curriculum-module-card">
    <span className="curriculum-module-icon"><Icon name="book" size={21} /></span>
    <span className="curriculum-module-copy">
      <span className="curriculum-label">MODULE {String(index + 1).padStart(2, '0')}</span>
      <span className="curriculum-module-title">{module.title}</span>
      <span className="curriculum-module-summary">{module.summary}</span>
      <span className="curriculum-module-meta"><span>{module.sectionCount} {module.sectionCount === 1 ? 'section' : 'sections'}</span><span aria-hidden="true">·</span><span>Read at your own pace</span></span>
    </span>
    <Icon name="arrow-right" size={20} />
  </CurriculumLink>;
}

function UnitBranch({ unit, units, depth, index, topicSlug, navigate, ancestors = [] }: {
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

function CodeBlock({ block }: { block: Extract<LessonBlock, { type: 'code' }> }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(resetRef.current), []);
  const label = block.language === 'cpp' ? 'C++' : block.language === 'shell' ? 'Terminal' : 'Output';

  async function copy() {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.clearTimeout(resetRef.current);
    resetRef.current = window.setTimeout(() => setCopyState('idle'), 3000);
  }

  return <figure className="lesson-code">
    <div className="lesson-code-toolbar">
      <span>{label}</span>
      <Button variant="ghost" className="lesson-copy" aria-label={`Copy ${label === 'Output' ? 'output' : 'code'}`} onClick={() => void copy()}>
        {copyState === 'copied' && <Icon name="check" size={14} />}<span aria-live="polite">{copyState === 'copied' ? 'Copied' : 'Copy'}</span>
      </Button>
    </div>
    <pre tabIndex={0} aria-label={`${label} example`}><code>{block.code}</code></pre>
    {copyState === 'failed' && <p className="lesson-copy-help" role="status">Select the text above to copy it.</p>}
    {block.caption && <figcaption>{block.caption}</figcaption>}
  </figure>;
}

function ContentBlock({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'paragraph': return <p>{block.text}</p>;
    case 'code': return <CodeBlock block={block} />;
    case 'list': return <ul className="lesson-list">{block.items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    case 'callout': return <aside className="lesson-callout"><span className="lesson-callout-mark" aria-hidden="true">↳</span><div><h3>{block.title}</h3><p>{block.text}</p></div></aside>;
    case 'reflection': return <section className="lesson-reflection" aria-label="Pause and reflect">
      <div className="curriculum-label"><Icon name="sparkles" size={15} />PAUSE & REFLECT</div>
      <p>{block.prompt}</p>
      <details><summary>Reveal explanation<Icon name="chevron-down" size={15} /></summary><p>{block.explanation}</p></details>
    </section>;
  }
}

function webLink(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch { return null; }
}

function Sources({ sources, expanded, moduleTitle }: {
  sources: ModuleDetail['sources']; expanded: boolean; moduleTitle: string;
}) {
  if (!sources.length) return null;
  const sourceList = <ol>{sources.map((source) => {
      const url = webLink(source.url);
      const publication = [source.edition, source.publicationYear].filter(Boolean).join(' · ');
      return <li key={source.id}>
        {url ? <a href={url} target="_blank" rel="noreferrer">{source.title}<Icon name="external" size={13} /><span className="sr-only"> (opens in a new tab)</span></a> : <span className="lesson-source-title">{source.title}</span>}
        {source.locator && <span className="lesson-source-locator">{source.locator}</span>}
        {source.authors.length > 0 && <span>{source.authors.join(', ')}</span>}
        {publication && <span>{publication}</span>}
      </li>;
    })}</ol>;
  const introduction = <p className="lesson-sources-intro">Explore the ideas in “{moduleTitle}” through these documentation and book references.</p>;

  if (expanded) return <section className="lesson-sources lesson-sources-expanded" aria-labelledby="lesson-further-reading-heading">
    <div className="curriculum-label"><Icon name="book" size={15} />KEEP EXPLORING</div>
    <h2 id="lesson-further-reading-heading">Further reading</h2>
    {introduction}
    {sourceList}
  </section>;

  return <details className="lesson-sources">
    <summary><span><Icon name="book" size={17} />Sources & further reading<span className="lesson-source-count">{sources.length}</span></span><Icon name="chevron-down" size={17} /></summary>
    {introduction}
    {sourceList}
  </details>;
}

export function Curriculum({ topicSlug, moduleId, partId, onNavigate }: CurriculumProps) {
  const outlineRequest = useResource<TopicOutline>(`/api/topics/${encodeURIComponent(topicSlug)}/outline`, isOutline);
  const moduleRequest = useResource<ModuleDetail>(moduleId ? `/api/modules/${encodeURIComponent(moduleId)}` : null, isDetail);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const outline = outlineRequest.data;
  const detail = moduleRequest.data;
  const loading = outlineRequest.loading || Boolean(moduleId && moduleRequest.loading);
  const error = outlineRequest.error || (moduleId ? moduleRequest.error : null);
  const missing = error === 'missing' || Boolean(outline && outline.topic.slug !== topicSlug)
    || Boolean(moduleId && detail && (detail.module.id !== moduleId || detail.topic.slug !== topicSlug
      || !outline?.units.some((unit) => unit.modules.some((module) => module.id === moduleId))));
  const partIndex = detail ? (partId ? detail.parts.findIndex((part) => part.id === partId) : 0) : -1;
  const part = detail?.parts[partIndex];
  const missingPart = Boolean(moduleId && detail && !part);

  useEffect(() => {
    if (loading) return;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [loading, topicSlug, moduleId, partId]);

  const overview = { topicSlug };
  const backLink = <CurriculumLink destination={moduleId ? overview : null} navigate={onNavigate} className="curriculum-back-link">
    <Icon name="arrow-left" size={16} />{moduleId ? `Back to ${outline?.topic.name ?? 'topic'}` : 'Back to library'}
  </CurriculumLink>;

  if (loading) return <div className="curriculum-page" aria-busy="true">{backLink}<div className="curriculum-loading" role="status"><span className="loading-dot" />Opening {moduleId ? 'your module' : 'the learning path'}…</div></div>;

  if (missing || error || !outline || (moduleId && !detail)) return <div className="curriculum-page">
    {backLink}
    <div className="curriculum-error" role="status">
      <h1 className="sr-only" ref={headingRef} tabIndex={-1}>{missing ? 'Content unavailable' : 'Unable to connect'}</h1>
      <EmptyState icon={<Icon name={missing ? 'book' : 'server'} size={28} />} title={missing ? `This ${moduleId ? 'module' : 'topic'} isn’t available` : 'We couldn’t open this page'}
        description={missing ? 'It may have moved or may no longer be published. You can return to the library to find something to explore.' : 'Check that your Alexandria server is running, then try again.'}>
        {!missing && <Button variant="secondary" onClick={() => { outlineRequest.retry(); moduleRequest.retry(); }}><Icon name="refresh" size={16} />Try again</Button>}
        <CurriculumLink destination={null} navigate={onNavigate} className="ui-button ui-button--secondary">Return to library</CurriculumLink>
      </EmptyState>
    </div>
  </div>;

  if (!moduleId || !detail) {
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

  if (missingPart || !part) return <div className="curriculum-page">{backLink}<div className="curriculum-error" role="status">
    <h1 className="sr-only" ref={headingRef} tabIndex={-1}>Section unavailable</h1>
    <EmptyState icon={<Icon name="book" size={28} />} title="This section isn’t available" description="The section link may be out of date. You can open the module from the beginning.">
      <CurriculumLink destination={{ topicSlug, moduleId }} navigate={onNavigate} className="ui-button ui-button--primary">Open module<Icon name="arrow-right" size={16} /></CurriculumLink>
    </EmptyState>
  </div></div>;

  const previous = detail.parts[partIndex - 1];
  const next = detail.parts[partIndex + 1];
  const finalSection = partIndex === detail.parts.length - 1;
  const owningUnit = outline.units.find((unit) => unit.id === detail.module.unitId);
  const moduleIndex = owningUnit?.modules.findIndex((module) => module.id === moduleId) ?? -1;
  const nextModule = moduleIndex >= 0 ? owningUnit?.modules[moduleIndex + 1] : undefined;
  const nextDestination = next ? { topicSlug, moduleId, partId: next.id }
    : nextModule ? { topicSlug, moduleId: nextModule.id } : overview;

  const sectionLinks = <ol>{detail.parts.map((section, index) => <li key={section.id}>
    <CurriculumLink destination={{ topicSlug, moduleId, partId: section.id }} navigate={onNavigate} className="lesson-section-link" current={section.id === part.id}>
      <span className="lesson-section-number">{String(index + 1).padStart(2, '0')}</span><span>{section.title}</span>
    </CurriculumLink>
  </li>)}</ol>;

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
