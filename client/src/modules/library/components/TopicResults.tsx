import { Button, EmptyState, Icon } from '../../../components/ui/index.js';
import type { Category, LibraryPageProps, Topic } from '../types/index.js';
import { normalizeLibraryQuery } from '../utils/selectors.js';
import { TopicCard } from './TopicCard.js';

type TopicResultsProps = Pick<LibraryPageProps, 'loading' | 'error' | 'filters' | 'onRetry' | 'onUpdateFilters' | 'onNavigate'>
  & { topics: Topic[]; selected: Category | undefined };

export function TopicResults({ loading, error, filters, onRetry, onUpdateFilters, onNavigate, topics, selected }: TopicResultsProps) {
  if (loading) return <div className="loading-state"><span className="loading-dot" />Opening your library…</div>;
  if (error) return <EmptyState icon={<Icon name="server" size={28} />} title="We couldn’t reach your library"
    description="Check that your Alexandria server is running, then try connecting again.">
    <Button variant="secondary" onClick={onRetry}><Icon name="refresh" size={16} />Try again</Button>
  </EmptyState>;
  if (topics.length) return <div className="topic-grid">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} onNavigate={onNavigate} />)}</div>;
  if (normalizeLibraryQuery(filters.query)) return <EmptyState icon={<Icon name="search" size={27} />} title="No topics found"
    description={`No topics match “${filters.query.trim()}”${selected ? ` in ${selected.name}` : ''}. Try another search.`}>
    <Button variant="secondary" onClick={() => onUpdateFilters({ query: '', category: 'all' })}>Clear filters</Button>
  </EmptyState>;
  return <EmptyState icon={<Icon name="book" size={29} />} title={selected ? `${selected.name} starts here` : 'Your library starts here'}
    description={selected ? 'There are no topics in this subject yet. New topics will appear here when they’re ready.' : 'A little room for a lot of possibility. Your topics will appear here as your library grows.'}>
    <span className="empty-caption">Good things begin with a little curiosity.</span>
  </EmptyState>;
}
