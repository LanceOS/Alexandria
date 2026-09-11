export type NavigationDestination = {
  topicSlug: string;
  moduleId?: string | null;
  partId?: string | null;
} | null;

export type Navigate = (destination: NavigationDestination) => void;

export interface NavigationFilters {
  category: string;
  query: string;
}

export interface NavigationState {
  filters: NavigationFilters;
  curriculum: { topicSlug: string | null; moduleId: string | null; partId: string | null };
}
