import { Icon } from '../../../components/ui';
import type { ModuleDetail } from '../types';
import { webLink } from '../utils/sources';

export function Sources({ sources, expanded, moduleTitle }: {
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

