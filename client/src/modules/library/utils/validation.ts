import type { LibraryResponse } from '../types/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasTextFields(value: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof value[field] === 'string');
}

export function isLibraryResponse(value: unknown): value is LibraryResponse {
  if (!isRecord(value) || !Array.isArray(value.categories) || !Array.isArray(value.topics)
    || !isRecord(value.instance) || !hasTextFields(value.instance, ['id', 'createdAt'])) return false;
  return value.categories.every((category: unknown) => isRecord(category)
    && hasTextFields(category, ['id', 'slug', 'name', 'description'])
    && typeof category.position === 'number' && Number.isSafeInteger(category.position) && category.position >= 0)
    && value.topics.every((topic: unknown) => isRecord(topic)
      && hasTextFields(topic, ['id', 'slug', 'name', 'description'])
      && Array.isArray(topic.categoryIds) && topic.categoryIds.every((id: unknown) => typeof id === 'string'));
}
