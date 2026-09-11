import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { ModulePractice } from '../../shared/practice.js';
import { loadPracticeCatalog } from '../content/practice.js';
import { readModuleDetail } from '../repositories/curriculum.js';

export function registerPracticeRoutes(app: FastifyInstance, database: DatabaseSync,
  loadCatalog: () => ModulePractice[] = loadPracticeCatalog): void {
  let catalog: Map<string, ModulePractice> | undefined;
  app.get<{ Params: { id: string } }>('/api/modules/:id/practice', {
    schema: { params: { type: 'object', additionalProperties: false, required: ['id'],
      properties: { id: { type: 'string', minLength: 1, maxLength: 200 } } } },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const detail = readModuleDetail(database, request.params.id);
    // Optional practice must not prevent the library or account services from starting.
    // Cache only successful loads so fixing a damaged asset permits a normal request retry.
    catalog ??= new Map(loadCatalog().map((entry) => [entry.moduleId, entry]));
    const practice = catalog.get(detail.module.id);
    return practice?.versionId === detail.version.id ? practice
      : { moduleId: detail.module.id, versionId: detail.version.id, quests: [] };
  });
}
