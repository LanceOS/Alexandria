import { useResource } from '../../../hooks/useResource';
import type { CurriculumProps, ModuleDetail, TopicOutline } from '../types';
import { hasUnavailableContent, selectReaderSection } from '../utils/reader';
import { isDetail, isOutline } from '../utils/validation';

export function useCurriculumData({ topicSlug, moduleId, partId }: Omit<CurriculumProps, 'onNavigate'>) {
  const outlineRequest = useResource<TopicOutline>(`/api/topics/${encodeURIComponent(topicSlug)}/outline`, isOutline);
  const moduleRequest = useResource<ModuleDetail>(moduleId ? `/api/modules/${encodeURIComponent(moduleId)}` : null, isDetail);
  const outline = outlineRequest.data;
  const detail = moduleRequest.data;
  const loading = outlineRequest.loading || Boolean(moduleId && moduleRequest.loading);
  const error = outlineRequest.error || (moduleId ? moduleRequest.error : null);
  const missing = error === 'missing' || hasUnavailableContent(outline, detail, topicSlug, moduleId);
  const { partIndex, part } = selectReaderSection(detail, partId);
  const missingPart = Boolean(moduleId && detail && !part);
  function retry() { outlineRequest.retry(); moduleRequest.retry(); }
  return { outline, detail, loading, error, missing, partIndex, part, missingPart, retry };
}
