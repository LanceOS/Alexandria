import type { LibraryFilters, LibraryResponse } from '../types/index.js';

export function normalizeLibraryQuery(query: string): string {
  return query.trim().toLocaleLowerCase();
}

export function selectedCategory(data: LibraryResponse | null, slug: string) {
  return data?.categories.find((category) => category.slug === slug);
}

export function filterTopics(data: LibraryResponse | null, filters: LibraryFilters) {
  const selected = selectedCategory(data, filters.category);
  const query = normalizeLibraryQuery(filters.query);
  return (data?.topics ?? []).filter((topic) =>
    (!selected || topic.categoryIds.includes(selected.id))
    && (!query || `${topic.name} ${topic.description}`.toLocaleLowerCase().includes(query)),
  );
}

export function countCategoryTopics(data: LibraryResponse | null, categoryId: string): number {
  return data?.topics.filter((topic) => topic.categoryIds.includes(categoryId)).length ?? 0;
}
