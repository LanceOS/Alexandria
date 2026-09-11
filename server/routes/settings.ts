import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { settingsPatchSchema, type SettingsPatch } from '../../shared/settings.js';
import type { AuthService } from '../auth/service.js';
import { SettingsService } from '../auth/settings.js';

export function registerSettingsRoutes(app: FastifyInstance, auth: AuthService, database: DatabaseSync): void {
  const settings = new SettingsService(database);
  app.get('/api/settings', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return settings.read(auth.requireUser(request).id);
  });
  app.patch<{ Body: SettingsPatch }>('/api/settings', { schema: { body: settingsPatchSchema } }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const user = auth.requireUser(request);
    auth.verifyCsrf(request);
    return settings.update(user.id, request.body);
  });
}
