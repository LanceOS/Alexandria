import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import Fastify from 'fastify';
import type { Config } from './config.js';
import { openDatabase } from './db/database.js';
import { readLibrary } from './db/library.js';
import { createAuthService } from './auth/service.js';
import { createCatalogService } from './services/catalog.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerCatalogRoutes } from './routes/catalog.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerCurriculumRoutes } from './routes/curriculum.js';
import { registerErrors } from './http/errors.js';
import { registerSecurity } from './http/security.js';
import { registerClient } from './http/static.js';

interface AppOptions {
  requireClient?: boolean;
  logger?: boolean;
}

export async function buildApp(config: Config, options: AppOptions = {}) {
  const app = Fastify({
    logger: options.logger === false ? false : {
      level: config.logLevel,
      redact: ['req.headers.cookie', 'req.headers.authorization', 'req.headers["x-csrf-token"]', 'res.headers["set-cookie"]'],
      serializers: {
        req: (request) => ({ method: request.method, url: request.url?.split('?')[0], remoteAddress: request.ip }),
      },
    },
    genReqId: () => randomUUID(),
    requestIdHeader: false,
    exposeHeadRoutes: false,
    bodyLimit: 16 * 1024,
    requestTimeout: 30_000,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false, useDefaults: false } },
  });
  let database: DatabaseSync | undefined;
  try {
    database = openDatabase(config, { writable: true });
    const connection = database;
    readLibrary(connection);
    app.addHook('onClose', async () => { if (connection.isOpen) connection.close(); });
    registerErrors(app);
    registerSecurity(app, config);
    const auth = createAuthService(connection, config);
    registerHealthRoutes(app, connection);
    registerAuthRoutes(app, auth);
    registerSettingsRoutes(app, auth, connection);
    registerCatalogRoutes(app, auth, createCatalogService(connection));
    registerCurriculumRoutes(app, connection);
    app.get('/api/library', async () => readLibrary(connection));
    await registerClient(app, config, options.requireClient);
    await app.ready();
    return app;
  } catch (error) {
    if (database?.isOpen) database.close();
    await app.close();
    throw error;
  }
}
