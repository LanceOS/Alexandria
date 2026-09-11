import { useState } from 'react';
import { Button, Icon } from '../../../components/ui';
import type { ExtraReadingReference, ModuleSummary, Navigate } from '../types';
import { webLink } from '../utils/sources';
import { CurriculumLink } from './CurriculumLink';

const previewCount = 4;

export function ExtraReading({ references, modules, topicSlug, navigate }: {
  references: ExtraReadingReference[]; modules: ModuleSummary[]; topicSlug: string; navigate: Navigate;
}) {
  const [showAll, setShowAll] = useState(false);
  const byId = new Map(modules.map((module) => [module.id, module]));
  const visibleReferences = showAll ? references : references.slice(0, previewCount);

  return <section className="curriculum-extra-reading" aria-labelledby="extra-reading-heading">
    <div className="curriculum-reading-heading">
      <div><div className="curriculum-label"><Icon name="book" size={15} />KEEP EXPLORING</div>
        <h2 id="extra-reading-heading" tabIndex={-1}>Extra Reading</h2></div>
      {references.length > 0 && <span>{references.length} {references.length === 1 ? 'reference' : 'references'}</span>}
    </div>
    <p className="curriculum-reading-intro">Go a little deeper with the documentation and books behind these modules.</p>
    {references.length ? <>
      <ul className="curriculum-reading-grid" id="extra-reading-list">
        {visibleReferences.map((reference) => {
          const url = webLink(reference.url);
          const publication = [reference.edition, reference.publicationYear].filter(Boolean).join(' · ');
          const citations = reference.citations.filter((citation) => byId.has(citation.moduleId));
          const moduleCount = new Set(citations.map((citation) => citation.moduleId)).size;
          return <li key={reference.id} className="curriculum-reading-card">
            <h3>{url ? <a href={url} target="_blank" rel="noreferrer"><span>{reference.title}</span><Icon name="external" size={14} /><span className="sr-only"> (opens in a new tab)</span></a> : reference.title}</h3>
            {reference.authors.length > 0 && <p className="curriculum-reading-authors">{reference.authors.join(', ')}</p>}
            {publication && <p className="curriculum-reading-edition">{publication}</p>}
            {citations.length > 0 && <details className="curriculum-reading-notes">
              <summary><span>Reading notes<span>{moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</span></span><Icon name="chevron-down" size={15} /></summary>
              <ul>{citations.map((citation) => <li key={`${citation.moduleId}:${citation.locator}`}>
                <CurriculumLink destination={{ topicSlug, moduleId: citation.moduleId }} navigate={navigate}>{byId.get(citation.moduleId)?.title}</CurriculumLink>
                {citation.locator && <p>{citation.locator}</p>}
              </li>)}</ul>
            </details>}
          </li>;
        })}
      </ul>
      {references.length > previewCount && <Button variant="secondary" className="curriculum-reading-more" aria-expanded={showAll} aria-controls="extra-reading-list" onClick={() => setShowAll((value) => !value)}>
        {showAll ? 'Show fewer references' : `Show all ${references.length} references`}<Icon name="chevron-down" size={16} />
      </Button>}
    </> : <p className="curriculum-reading-empty">Reading references will appear here as modules are added.</p>}
  </section>;
}
