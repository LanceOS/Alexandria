import { useResource } from '../../../hooks/useResource.js';
import type { LibraryResponse } from '../types/index.js';
import { isLibraryResponse } from '../utils/validation.js';

export function useLibrary() {
  const resource = useResource<LibraryResponse>('/api/library', isLibraryResponse, 8000);
  return { data: resource.data, loading: resource.loading, error: Boolean(resource.error), retry: resource.retry };
}
