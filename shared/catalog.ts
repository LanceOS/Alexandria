export type CatalogStatus = 'draft' | 'published' | 'archived';

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  status: CatalogStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPlacement {
  categoryId: string;
  position: number;
}

export interface CatalogTopic {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: CatalogStatus;
  categoryPlacements: CategoryPlacement[];
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  slug: string;
  name: string;
  description?: string;
  position?: number;
  status?: CatalogStatus;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  revision: number;
}

export interface CreateTopicInput {
  slug: string;
  name: string;
  description?: string;
  status?: CatalogStatus;
  categoryPlacements?: CategoryPlacement[];
}

export interface UpdateTopicInput extends Partial<CreateTopicInput> {
  revision: number;
}

export interface CatalogListOptions {
  limit?: number;
  offset?: number;
  status?: CatalogStatus;
}

export interface CatalogPage<T> {
  items: T[];
  pagination: { limit: number; offset: number; total: number };
}

const statusSchema = { type: 'string', enum: ['draft', 'published', 'archived'] } as const;
const idSchema = { type: 'string', minLength: 1, maxLength: 128, pattern: '^\\S+$' } as const;
const revisionSchema = { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER } as const;
const positionSchema = { type: 'integer', minimum: 0, maximum: 2147483647 } as const;
const commonProperties = {
  slug: { type: 'string', minLength: 1, maxLength: 80, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
  name: { type: 'string', minLength: 1, maxLength: 160, pattern: '\\S' },
  description: { type: 'string', maxLength: 4000 },
  status: statusSchema,
} as const;
const placementsSchema = {
  type: 'array',
  maxItems: 100,
  items: {
    type: 'object', additionalProperties: false, required: ['categoryId', 'position'],
    properties: { categoryId: idSchema, position: positionSchema },
  },
} as const;

export const createCategorySchema = {
  type: 'object', additionalProperties: false, required: ['slug', 'name'],
  properties: { ...commonProperties, position: positionSchema },
} as const;

export const updateCategorySchema = {
  type: 'object', additionalProperties: false, required: ['revision'], minProperties: 2,
  properties: { ...commonProperties, position: positionSchema, revision: revisionSchema },
} as const;

export const createTopicSchema = {
  type: 'object', additionalProperties: false, required: ['slug', 'name'],
  properties: { ...commonProperties, categoryPlacements: placementsSchema },
} as const;

export const updateTopicSchema = {
  type: 'object', additionalProperties: false, required: ['revision'], minProperties: 2,
  properties: { ...commonProperties, categoryPlacements: placementsSchema, revision: revisionSchema },
} as const;

// Query parameters remain strings because the HTTP layer disables coercion.
export const catalogListQuerySchema = {
  type: 'object', additionalProperties: false,
  properties: {
    limit: { type: 'string', pattern: '^[1-9][0-9]{0,2}$' },
    offset: { type: 'string', pattern: '^(0|[1-9][0-9]{0,15})$' },
    status: statusSchema,
  },
} as const;

export const catalogIdParamsSchema = {
  type: 'object', additionalProperties: false, required: ['id'], properties: { id: idSchema },
} as const;
