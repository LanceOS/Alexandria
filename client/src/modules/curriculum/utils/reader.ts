import type { ModuleDetail, NavigationDestination, TopicOutline } from '../types';

export function selectReaderSection(detail: ModuleDetail | null, partId: string | null) {
  const partIndex = detail ? (partId ? detail.parts.findIndex((part) => part.id === partId) : 0) : -1;
  return { partIndex, part: detail?.parts[partIndex] };
}

export function hasUnavailableContent(outline: TopicOutline | null, detail: ModuleDetail | null, topicSlug: string, moduleId: string | null) {
  return Boolean(outline && outline.topic.slug !== topicSlug)
    || Boolean(moduleId && detail && (detail.module.id !== moduleId || detail.topic.slug !== topicSlug
      || !outline?.units.some((unit) => unit.modules.some((module) => module.id === moduleId))));
}

export function getReaderNavigation(outline: TopicOutline, detail: ModuleDetail, partIndex: number, topicSlug: string) {
  const moduleId = detail.module.id;
  const overview = { topicSlug };
  const previous = detail.parts[partIndex - 1];
  const next = detail.parts[partIndex + 1];
  const finalSection = partIndex === detail.parts.length - 1;
  const owningUnit = outline.units.find((unit) => unit.id === detail.module.unitId);
  const moduleIndex = owningUnit?.modules.findIndex((module) => module.id === moduleId) ?? -1;
  const nextModule = moduleIndex >= 0 ? owningUnit?.modules[moduleIndex + 1] : undefined;
  const nextDestination: NavigationDestination = next ? { topicSlug, moduleId, partId: next.id }
    : nextModule ? { topicSlug, moduleId: nextModule.id } : overview;
  return { previous, next, finalSection, owningUnit, nextModule, nextDestination };
}
