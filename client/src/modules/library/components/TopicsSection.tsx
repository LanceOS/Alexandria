import { Icon } from '../../../components/ui/index.js';
import type { Category, LibraryPageProps, Topic } from '../types/index.js';
import { TopicResults } from './TopicResults.js';
import { TopicsToolbar } from './TopicsToolbar.js';

type TopicsSectionProps = Omit<LibraryPageProps, 'data'> & { selected: Category | undefined; topics: Topic[] };

export function TopicsSection({ selected, topics, onChooseSubject, ...props }: TopicsSectionProps) {
  return <section className="topics-section" aria-labelledby="topics-heading" aria-busy={props.loading} data-entrance>
    <TopicsToolbar selected={selected} count={topics.length} filters={props.filters} onUpdateFilters={props.onUpdateFilters} />
    {selected && <button className="filter-chip" onClick={() => onChooseSubject('all')}>
      {selected.name}<Icon name="x" size={13} /><span className="sr-only">Clear subject filter</span>
    </button>}
    <div className="topics-body" aria-live="polite"><TopicResults {...props} topics={topics} selected={selected} /></div>
  </section>;
}
