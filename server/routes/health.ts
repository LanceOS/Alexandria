import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { assertMigrationHistory } from '../db/migrations.js';
import { readLibrary } from '../db/library.js';

export function registerHealthRoutes(app: FastifyInstance, database: DatabaseSync): void {
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    try {
      assertMigrationHistory(database);
      readLibrary(database);
      return { status: 'ready' };
    } catch {
      app.log.error('Database readiness check failed');
      return reply.code(503).send({ status: 'not_ready' });
    }
  });
}
