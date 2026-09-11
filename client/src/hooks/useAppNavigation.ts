import { useCallback, useEffect, useState } from 'react';
import type { NavigationDestination, NavigationFilters } from '../types/navigation';
import { curriculumUrl, filtersUrl, readNavigation, subjectUrl } from '../utils/navigation';

function readCurrentLocation() {
  return readNavigation(window.location.search);
}

export function useAppNavigation() {
  const [location, setLocation] = useState(readCurrentLocation);

  useEffect(() => {
    const onPopState = () => setLocation(readCurrentLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const commit = useCallback((url: URL, replace = false) => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
    setLocation(readCurrentLocation());
  }, []);

  const updateFilters = useCallback((next: Partial<NavigationFilters>, replace = false) => {
    commit(filtersUrl(window.location.href, next), replace);
  }, [commit]);

  const chooseSubject = useCallback((category: string) => {
    commit(subjectUrl(window.location.href, category));
  }, [commit]);

  const navigate = useCallback((destination: NavigationDestination) => {
    commit(curriculumUrl(window.location.href, destination));
  }, [commit]);

  const { topicSlug, moduleId, partId } = location.curriculum;
  return { ...location, navigate, chooseSubject, updateFilters, routeKey: JSON.stringify([topicSlug, moduleId, partId]) };
}
