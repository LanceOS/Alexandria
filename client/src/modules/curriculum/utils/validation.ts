import type { ModuleDetail, TopicOutline } from '../types';

export function isOutline(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const outline = value as TopicOutline;
  return Boolean(outline.topic && typeof outline.topic.slug === 'string' && Array.isArray(outline.units)
    && outline.units.every((unit) => Array.isArray(unit.modules)));
}

export function isDetail(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const detail = value as ModuleDetail;
  return Boolean(detail.topic && detail.module && detail.version && Array.isArray(detail.version.objectives)
    && Array.isArray(detail.units) && Array.isArray(detail.sources) && Array.isArray(detail.parts)
    && detail.parts.every((part) => Array.isArray(part.blocks)));
}

