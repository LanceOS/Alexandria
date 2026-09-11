import { Badge, Icon, TextField } from '../../../components/ui/index.js';
import type { Category, LibraryFilters } from '../types/index.js';

export function TopicsToolbar({ selected, count, filters, onUpdateFilters }: {
  selected: Category | undefined;
  count: number;
  filters: LibraryFilters;
  onUpdateFilters: (next: Partial<LibraryFilters>, replace?: boolean) => void;
}) {
  return <div className="topics-toolbar">
    <div className="topics-heading"><h2 id="topics-heading">{selected?.name ?? 'All topics'}</h2><Badge>{count}</Badge></div>
    <div className="search-wrap"><TextField id="topic-search" aria-label="Search topics" placeholder="Search topics…" type="search"
      value={filters.query} onChange={(event) => onUpdateFilters({ query: event.target.value }, true)} leadingIcon={<Icon name="search" size={17} />} /></div>
  </div>;
}
