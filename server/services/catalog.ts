import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type {
  CatalogCategory, CatalogListOptions, CatalogPage, CatalogStatus, CatalogTopic, CategoryPlacement,
  CreateCategoryInput, CreateTopicInput, UpdateCategoryInput, UpdateTopicInput,
} from '../../shared/catalog.js';
import { transaction } from '../db/transaction.js';
import { AppError } from '../http/errors.js';
import { createCatalogRepository } from '../repositories/catalog.js';

function invalid(message: string): never {
  throw new AppError(400, 'INVALID_CATALOG_INPUT', message);
}

function bodyObject(input: unknown, allowed: readonly string[], required: readonly string[] = []): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('The request must be an object.');
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !allowed.includes(key) || body[key] === undefined || body[key] === null)) invalid('The request contains an unsupported field or value.');
  if (required.some((key) => !Object.hasOwn(body, key))) invalid(`Required fields: ${required.join(', ')}.`);
  return body;
}

function text(value: unknown, field: 'slug' | 'name' | 'description'): string {
  const maximum = field === 'slug' ? 80 : field === 'name' ? 160 : 4000;
  if (typeof value !== 'string' || value.length > maximum || value.includes('\0')) invalid(`${field} must be text of at most ${maximum} characters.`);
  if (field === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) invalid('slug must contain lowercase letters or digits separated by single hyphens.');
  if (field === 'name') {
    if (!value.trim() || /[\u0000-\u001f\u007f]/.test(value)) invalid('name must contain visible text without control characters.');
    return value.trim();
  }
  return value;
}

function integer(value: unknown, field: string, minimum: number, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    invalid(`${field} must be an integer from ${minimum} to ${maximum}.`);
  }
  return value;
}

function status(value: unknown): CatalogStatus {
  if (value !== 'draft' && value !== 'published' && value !== 'archived') invalid('status must be draft, published, or archived.');
  return value;
}

function entityId(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128 || /\s|\0/.test(value)) invalid('A valid catalog ID is required.');
  return value;
}

function placements(value: unknown): CategoryPlacement[] {
  if (!Array.isArray(value) || value.length > 100) invalid('categoryPlacements must be an array of at most 100 category placements.');
  const seen = new Set<string>();
  return value.map((entry) => {
    const body = bodyObject(entry, ['categoryId', 'position'], ['categoryId', 'position']);
    const categoryId = entityId(body.categoryId);
    if (seen.has(categoryId)) invalid('Each category may appear only once in categoryPlacements.');
    seen.add(categoryId);
    return { categoryId, position: integer(body.position, 'position', 0, 2147483647) };
  });
}

function pageOptions(input: CatalogListOptions) {
  const body = bodyObject(input, ['limit', 'offset', 'status']);
  return {
    limit: integer(body.limit ?? 50, 'limit', 1, 100),
    offset: integer(body.offset ?? 0, 'offset', 0),
    ...(body.status === undefined ? {} : { status: status(body.status) }),
  };
}

function revisionConflict(): never {
  throw new AppError(409, 'REVISION_CONFLICT', 'The catalog record changed. Reload it and retry with its current revision.');
}

const categoryFields = ['slug', 'name', 'description', 'position', 'status'] as const;
const topicFields = ['slug', 'name', 'description', 'status', 'categoryPlacements'] as const;

export function createCatalogService(database: DatabaseSync) {
  const repository = createCatalogRepository(database);

  function getCategory(id: string): CatalogCategory {
    const category = repository.findCategory(entityId(id));
    if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'The category does not exist.');
    return category;
  }

  function getTopic(id: string): CatalogTopic {
    const topic = repository.findTopic(entityId(id));
    if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'The topic does not exist.');
    return topic;
  }

  function validateTopicPlacements(next: CategoryPlacement[], nextStatus: CatalogStatus): void {
    const categories = repository.categoryStatuses(next.map((placement) => placement.categoryId));
    if (categories.length !== next.length) throw new AppError(400, 'CATEGORY_NOT_FOUND', 'Every category placement must reference an existing category.');
    if (nextStatus === 'published' && !categories.some((category) => category.status === 'published')) {
      throw new AppError(409, 'TOPIC_REQUIRES_PUBLISHED_CATEGORY', 'A published topic must belong to at least one published category.');
    }
  }

  return {
    getCategory,
    getTopic,
    listCategories(input: CatalogListOptions = {}): CatalogPage<CatalogCategory> {
      const options = pageOptions(input);
      const result = repository.listCategories(options);
      return { items: result.items, pagination: { limit: options.limit, offset: options.offset, total: result.total } };
    },
    listTopics(input: CatalogListOptions = {}): CatalogPage<CatalogTopic> {
      const options = pageOptions(input);
      const result = repository.listTopics(options);
      return { items: result.items, pagination: { limit: options.limit, offset: options.offset, total: result.total } };
    },
    createCategory(input: CreateCategoryInput): CatalogCategory {
      const body = bodyObject(input, categoryFields, ['slug', 'name']);
      const values = {
        slug: text(body.slug, 'slug'), name: text(body.name, 'name'), description: text(body.description ?? '', 'description'),
        position: integer(body.position ?? 0, 'position', 0, 2147483647), status: status(body.status ?? 'draft'),
      };
      return transaction(database, () => {
        if (repository.categoryWithSlug(values.slug)) throw new AppError(409, 'SLUG_CONFLICT', 'A category already uses this slug.');
        const id = randomUUID();
        repository.insertCategory(id, values);
        return getCategory(id);
      });
    },
    updateCategory(id: string, input: UpdateCategoryInput): CatalogCategory {
      entityId(id);
      const body = bodyObject(input, [...categoryFields, 'revision'], ['revision']);
      if (Object.keys(body).length < 2) invalid('Supply at least one field to update.');
      const revision = integer(body.revision, 'revision', 1);
      return transaction(database, () => {
        const current = getCategory(id);
        if (current.revision !== revision) revisionConflict();
        const values = {
          slug: text(body.slug ?? current.slug, 'slug'), name: text(body.name ?? current.name, 'name'),
          description: text(body.description ?? current.description, 'description'),
          position: integer(body.position ?? current.position, 'position', 0, 2147483647), status: status(body.status ?? current.status),
        };
        const sameSlug = repository.categoryWithSlug(values.slug);
        if (sameSlug && sameSlug.id !== id) throw new AppError(409, 'SLUG_CONFLICT', 'A category already uses this slug.');
        if (current.status === 'published' && values.status !== 'published' && repository.wouldStrandPublishedTopic(id)) {
          throw new AppError(409, 'CATEGORY_HAS_PUBLISHED_TOPICS', 'A published topic would lose its last published category. Move or archive affected topics first.');
        }
        if (!repository.updateCategory(id, revision, values)) revisionConflict();
        return getCategory(id);
      });
    },
    createTopic(input: CreateTopicInput): CatalogTopic {
      const body = bodyObject(input, topicFields, ['slug', 'name']);
      const values = {
        slug: text(body.slug, 'slug'), name: text(body.name, 'name'), description: text(body.description ?? '', 'description'),
        status: status(body.status ?? 'draft'),
      };
      const nextPlacements = placements(body.categoryPlacements ?? []);
      return transaction(database, () => {
        if (repository.topicWithSlug(values.slug)) throw new AppError(409, 'SLUG_CONFLICT', 'A topic already uses this slug.');
        validateTopicPlacements(nextPlacements, values.status);
        const id = randomUUID();
        repository.insertTopic(id, values);
        repository.replaceTopicPlacements(id, nextPlacements);
        return getTopic(id);
      });
    },
    updateTopic(id: string, input: UpdateTopicInput): CatalogTopic {
      entityId(id);
      const body = bodyObject(input, [...topicFields, 'revision'], ['revision']);
      if (Object.keys(body).length < 2) invalid('Supply at least one field to update.');
      const revision = integer(body.revision, 'revision', 1);
      return transaction(database, () => {
        const current = getTopic(id);
        if (current.revision !== revision) revisionConflict();
        const values = {
          slug: text(body.slug ?? current.slug, 'slug'), name: text(body.name ?? current.name, 'name'),
          description: text(body.description ?? current.description, 'description'), status: status(body.status ?? current.status),
        };
        const nextPlacements = body.categoryPlacements === undefined ? current.categoryPlacements : placements(body.categoryPlacements);
        const sameSlug = repository.topicWithSlug(values.slug);
        if (sameSlug && sameSlug.id !== id) throw new AppError(409, 'SLUG_CONFLICT', 'A topic already uses this slug.');
        validateTopicPlacements(nextPlacements, values.status);
        if (!repository.updateTopic(id, revision, values)) revisionConflict();
        if (body.categoryPlacements !== undefined) repository.replaceTopicPlacements(id, nextPlacements);
        return getTopic(id);
      });
    },
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
