import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { readModuleDetail, readTopicOutline } from '../repositories/curriculum.js';

function parameterSchema(name: string) {
  return { type: 'object', additionalProperties: false, required: [name],
    properties: { [name]: { type: 'string', minLength: 1, maxLength: 200 } } };
}

export function registerCurriculumRoutes(app: FastifyInstance, database: DatabaseSync): void {
  app.get<{ Params: { slug: string } }>('/api/topics/:slug/outline', {
    schema: { params: parameterSchema('slug') },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return readTopicOutline(database, request.params.slug);
  });
  app.get<{ Params: { id: string } }>('/api/modules/:id', {
    schema: { params: parameterSchema('id') },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return readModuleDetail(database, request.params.id);
  });
}
