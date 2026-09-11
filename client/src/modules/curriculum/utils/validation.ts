import type { ExtraReadingReference, ModuleDetail, TopicOutline } from '../types';

function isReadingReference(value: unknown): value is ExtraReadingReference {
  if (!value || typeof value !== 'object') return false;
  const source = value as ExtraReadingReference;
  return typeof source.id === 'string' && typeof source.title === 'string'
    && Array.isArray(source.authors) && source.authors.every((author) => typeof author === 'string')
    && (source.edition === null || typeof source.edition === 'string')
    && (source.publicationYear === null || Number.isInteger(source.publicationYear))
    && (source.url === null || typeof source.url === 'string')
    && Array.isArray(source.citations) && source.citations.every((citation) => citation
      && typeof citation.moduleId === 'string' && typeof citation.locator === 'string');
}

export function isOutline(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const outline = value as TopicOutline;
  return Boolean(outline.topic && typeof outline.topic.slug === 'string' && Array.isArray(outline.units)
    && outline.units.every((unit) => Array.isArray(unit.modules))
    && Array.isArray(outline.extraReading) && outline.extraReading.every(isReadingReference));
}

export function isDetail(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const detail = value as ModuleDetail;
  return Boolean(detail.topic && detail.module && detail.version && Array.isArray(detail.version.objectives)
    && Array.isArray(detail.units) && Array.isArray(detail.sources) && Array.isArray(detail.parts)
    && detail.parts.every((part) => Array.isArray(part.blocks)));
}
