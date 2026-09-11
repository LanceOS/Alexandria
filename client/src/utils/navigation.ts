import type { NavigationDestination, NavigationFilters, NavigationState } from '../types/navigation';

export function readNavigation(search: string): NavigationState {
  const params = new URLSearchParams(search);
  return {
    filters: { category: params.get('subject') || 'all', query: params.get('q') || '' },
    curriculum: { topicSlug: params.get('topic'), moduleId: params.get('module'), partId: params.get('part') },
  };
}

export function filtersUrl(href: string, next: Partial<NavigationFilters>): URL {
  const url = new URL(href);
  const updated = { ...readNavigation(url.search).filters, ...next };
  if (updated.category === 'all') url.searchParams.delete('subject');
  else url.searchParams.set('subject', updated.category);
  if (updated.query) url.searchParams.set('q', updated.query);
  else url.searchParams.delete('q');
  return url;
}

export function curriculumUrl(href: string, destination: NavigationDestination): URL {
  const url = new URL(href);
  for (const key of ['topic', 'module', 'part']) url.searchParams.delete(key);
  url.hash = '';
  if (destination) {
    url.searchParams.set('topic', destination.topicSlug);
    if (destination.moduleId) url.searchParams.set('module', destination.moduleId);
    if (destination.partId) url.searchParams.set('part', destination.partId);
  }
  return url;
}

export function subjectUrl(href: string, category: string): URL {
  const url = filtersUrl(href, { category });
  for (const key of ['topic', 'module', 'part']) url.searchParams.delete(key);
  return url;
}

export function destinationHref(destination: NavigationDestination): string {
  if (!destination) return '/';
  const params = new URLSearchParams({ topic: destination.topicSlug });
  if (destination.moduleId) params.set('module', destination.moduleId);
  if (destination.partId) params.set('part', destination.partId);
  return `/?${params.toString()}`;
}

interface NavigationClick {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Modified clicks keep normal browser behavior, including opening a new tab. */
export function shouldInterceptNavigation(event: NavigationClick): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
