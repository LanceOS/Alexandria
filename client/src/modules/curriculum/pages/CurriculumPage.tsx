import { useEffect, useRef } from 'react';
import { Button, EmptyState, Icon } from '../../../components/ui';
import type { CurriculumProps } from '../types';
import { CurriculumLink } from '../components/CurriculumLink';
import { useCurriculumData } from '../hooks/useCurriculumData';
import { ModuleReaderPage } from './ModuleReaderPage';
import { OverviewPage } from './OverviewPage';

export function CurriculumPage({ topicSlug, moduleId, partId, onNavigate }: CurriculumProps) {
  const { outline, detail, loading, error, missing, partIndex, part, missingPart, retry } = useCurriculumData({ topicSlug, moduleId, partId });
  const headingRef = useRef<HTMLHeadingElement>(null);

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
        {!missing && <Button variant="secondary" onClick={retry}><Icon name="refresh" size={16} />Try again</Button>}
        <CurriculumLink destination={null} navigate={onNavigate} className="ui-button ui-button--secondary">Return to library</CurriculumLink>
      </EmptyState>
    </div>
  </div>;

  if (!moduleId || !detail) return <OverviewPage outline={outline} topicSlug={topicSlug} onNavigate={onNavigate} headingRef={headingRef} backLink={backLink} />;

  if (missingPart || !part) return <div className="curriculum-page">{backLink}<div className="curriculum-error" role="status">
    <h1 className="sr-only" ref={headingRef} tabIndex={-1}>Section unavailable</h1>
    <EmptyState icon={<Icon name="book" size={28} />} title="This section isn’t available" description="The section link may be out of date. You can open the module from the beginning.">
      <CurriculumLink destination={{ topicSlug, moduleId }} navigate={onNavigate} className="ui-button ui-button--primary">Open module<Icon name="arrow-right" size={16} /></CurriculumLink>
    </EmptyState>
  </div></div>;

  return <ModuleReaderPage outline={outline} detail={detail} topicSlug={topicSlug} moduleId={moduleId} part={part} partIndex={partIndex} onNavigate={onNavigate} headingRef={headingRef} />;
}
