import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  catalogIdParamsSchema, catalogListQuerySchema, createCategorySchema, createTopicSchema,
  updateCategorySchema, updateTopicSchema,
} from '../../shared/catalog.js';
import type {
  CatalogListOptions, CatalogStatus, CreateCategoryInput, CreateTopicInput, UpdateCategoryInput, UpdateTopicInput,
} from '../../shared/catalog.js';
import type { AuthService } from '../auth/service.js';
import type { CatalogService } from '../services/catalog.js';

interface IdParams { id: string }
interface ListQuery { limit?: string; offset?: string; status?: CatalogStatus }

function listOptions(query: ListQuery): CatalogListOptions {
  return {
    ...(query.limit === undefined ? {} : { limit: Number(query.limit) }),
    ...(query.offset === undefined ? {} : { offset: Number(query.offset) }),
    ...(query.status === undefined ? {} : { status: query.status }),
  };
}

export function registerCatalogRoutes(app: FastifyInstance, auth: AuthService, catalog: CatalogService): void {
  const requireAdmin = async (request: FastifyRequest) => { auth.requireAdmin(request); };
  const requireAdminMutation = async (request: FastifyRequest) => {
    auth.requireAdmin(request);
    auth.verifyCsrf(request);
  };
  app.get<{ Querystring: ListQuery }>('/api/admin/categories', {
    onRequest: requireAdmin, schema: { querystring: catalogListQuerySchema },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return catalog.listCategories(listOptions(request.query));
  });
  app.get<{ Params: IdParams }>('/api/admin/categories/:id', {
    onRequest: requireAdmin, schema: { params: catalogIdParamsSchema },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return catalog.getCategory(request.params.id);
  });
  app.post<{ Body: CreateCategoryInput }>('/api/admin/categories', {
    onRequest: requireAdminMutation, schema: { body: createCategorySchema },
  }, async (request, reply) => {
    const category = catalog.createCategory(request.body);
    return reply.code(201).header('Location', `/api/admin/categories/${category.id}`).header('Cache-Control', 'no-store').send(category);
  });
  app.patch<{ Params: IdParams; Body: UpdateCategoryInput }>('/api/admin/categories/:id', {
    onRequest: requireAdminMutation, schema: { params: catalogIdParamsSchema, body: updateCategorySchema },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return catalog.updateCategory(request.params.id, request.body);
  });
  app.get<{ Querystring: ListQuery }>('/api/admin/topics', {
    onRequest: requireAdmin, schema: { querystring: catalogListQuerySchema },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return catalog.listTopics(listOptions(request.query));
  });
  app.get<{ Params: IdParams }>('/api/admin/topics/:id', {
    onRequest: requireAdmin, schema: { params: catalogIdParamsSchema },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return catalog.getTopic(request.params.id);
  });
  app.post<{ Body: CreateTopicInput }>('/api/admin/topics', {
    onRequest: requireAdminMutation, schema: { body: createTopicSchema },
  }, async (request, reply) => {
    const topic = catalog.createTopic(request.body);
    return reply.code(201).header('Location', `/api/admin/topics/${topic.id}`).header('Cache-Control', 'no-store').send(topic);
  });
  app.patch<{ Params: IdParams; Body: UpdateTopicInput }>('/api/admin/topics/:id', {
    onRequest: requireAdminMutation, schema: { params: catalogIdParamsSchema, body: updateTopicSchema },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return catalog.updateTopic(request.params.id, request.body);
  });
}
