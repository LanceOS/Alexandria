import type { Navigate } from '../../../types/navigation.js';
import type { LibraryResponse } from '../../../../../shared/library.js';

export type { Category, LibraryResponse, Topic } from '../../../../../shared/library.js';

export interface LibraryFilters {
  category: string;
  query: string;
}

export interface LibraryPageProps {
  data: LibraryResponse | null;
  loading: boolean;
  error: boolean;
  filters: LibraryFilters;
  onChooseSubject: (slug: string) => void;
  onUpdateFilters: (next: Partial<LibraryFilters>, replace?: boolean) => void;
  onNavigate: Navigate;
  onRetry: () => void;
}

export interface LibraryNavigationProps {
  data: LibraryResponse | null;
  category: string;
  isLibrary: boolean;
  onChooseSubject: (slug: string) => void;
}
