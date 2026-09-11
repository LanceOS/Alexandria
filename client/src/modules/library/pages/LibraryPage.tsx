import { LibraryHero } from '../components/LibraryHero.js';
import { SubjectGrid } from '../components/SubjectGrid.js';
import { TopicsSection } from '../components/TopicsSection.js';
import type { LibraryPageProps } from '../types/index.js';
import { filterTopics, selectedCategory } from '../utils/selectors.js';

export function LibraryPage({ data, ...props }: LibraryPageProps) {
  const selected = selectedCategory(data, props.filters.category);
  const topics = filterTopics(data, props.filters);
  return <>
    <LibraryHero />
    <SubjectGrid data={data} loading={props.loading} selected={selected} onChooseSubject={props.onChooseSubject} />
    <TopicsSection {...props} selected={selected} topics={topics} />
  </>;
}
