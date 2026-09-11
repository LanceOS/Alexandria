import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../auth/service.js';
import { ProgressService } from '../services/progress.js';

interface TimeZoneQuery { timeZone?: string }
const querystring = { type: 'object', additionalProperties: false,
  properties: { timeZone: { type: 'string', minLength: 1, maxLength: 100 } } };
const identity = { type: 'string', minLength: 1, maxLength: 200 };

export function registerProgressRoutes(app: FastifyInstance, auth: AuthService, database: DatabaseSync): void {
  const progress = new ProgressService(database);
  app.get<{ Querystring: TimeZoneQuery }>('/api/progress', { schema: { querystring } }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const user = auth.requireUser(request);
    // Bind personal data to the session whose identity the client loaded. A
    // different tab can replace cookies between the session and progress reads.
    auth.verifyCsrf(request);
    return progress.read(user.id, request.query.timeZone);
  });
  app.put<{ Params: { id: string; partId: string }; Body: { versionId: string }; Querystring: TimeZoneQuery }>(
    '/api/progress/modules/:id/sections/:partId', { schema: { querystring,
      params: { type: 'object', additionalProperties: false, required: ['id', 'partId'], properties: { id: identity, partId: identity } },
      body: { type: 'object', additionalProperties: false, required: ['versionId'], properties: { versionId: identity } },
    } }, async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      const user = auth.requireUser(request);
      auth.verifyCsrf(request);
      return progress.completeSection(user.id, request.params.id, request.params.partId, request.body.versionId, request.query.timeZone);
    });
  app.patch<{ Body: { weeklyGoal: number }; Querystring: TimeZoneQuery }>('/api/progress/goal', { schema: { querystring,
    body: { type: 'object', additionalProperties: false, required: ['weeklyGoal'],
      properties: { weeklyGoal: { type: 'integer', minimum: 1, maximum: 14 } } },
  } }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const user = auth.requireUser(request);
    auth.verifyCsrf(request);
    return progress.updateGoal(user.id, request.body.weeklyGoal, request.query.timeZone);
  });
}
