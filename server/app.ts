import { realpath, stat } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Config } from './config.js';
import { canonicalPath, isWithin } from './config.js';
import { openDatabase } from './db/database.js';
import { readLibrary } from './db/library.js';
import { assertMigrationHistory } from './db/migrations.js';

interface AppOptions {
  requireClient?: boolean;
  logger?: boolean;
}

const notFound = { error: 'Not Found', message: 'This resource does not exist.' };

async function existingClientFile(root: string, filename: string): Promise<string | undefined> {
  const candidate = resolve(root, filename);
  if (!isWithin(root, candidate)) return undefined;
  try {
    const actual = await realpath(candidate);
    if (!isWithin(root, actual) || !(await stat(actual)).isFile()) return undefined;
    return relative(root, actual);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) return undefined;
    throw error;
  }
}

export async function buildApp(config: Config, options: AppOptions = {}) {
  const app = Fastify({
    logger: options.logger === false ? false : { level: config.logLevel },
    exposeHeadRoutes: false,
    bodyLimit: 16 * 1024,
    requestTimeout: 30_000,
  });
  let database: DatabaseSync | undefined;
  try {
    database = openDatabase(config);
    const connection = database;
    // Check the public repository now as well as migration history; a damaged
    // instance must never report readiness merely because SELECT 1 works.
    readLibrary(connection);
    app.addHook('onClose', async () => { if (connection.isOpen) connection.close(); });
    app.addHook('onRequest', async (request, reply) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('Referrer-Policy', 'same-origin');
      reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
      if (config.appOrigin && request.headers.origin && request.headers.origin !== config.appOrigin) {
        return reply.code(403).send({ error: 'Forbidden', message: 'Request origin does not match APP_ORIGIN.' });
      }
    });
    app.get('/health/live', async () => ({ status: 'ok' }));
    app.get('/health/ready', async (_request, reply) => {
      reply.header('Cache-Control', 'no-store');
      try {
        assertMigrationHistory(connection);
        readLibrary(connection);
        return { status: 'ready' };
      } catch (error) {
        app.log.error({ err: error }, 'Database readiness check failed');
        return reply.code(503).send({ status: 'not_ready' });
      }
    });
    app.get('/api/library', async (_request, reply) => {
      reply.header('Cache-Control', 'no-store');
      return readLibrary(connection);
    });

    const clientRoot = canonicalPath(config.clientDir);
    if (!isWithin(canonicalPath(config.projectRoot), clientRoot)) {
      throw new Error('The built frontend must remain inside the application checkout, including through symbolic links.');
    }
    const indexFile = await existingClientFile(clientRoot, 'index.html');
    if (options.requireClient && !indexFile) throw new Error('Built frontend is missing. Run npm run build before starting production.');
    if (indexFile) {
      await app.register(fastifyStatic, { root: clientRoot, serve: false, dotfiles: 'deny', index: false });
      app.get('/*', async (request: FastifyRequest, reply: FastifyReply) => {
        let pathname: string;
        try {
          pathname = decodeURIComponent(new URL(request.raw.url ?? '/', 'http://localhost').pathname);
        } catch {
          return reply.code(400).send({ error: 'Bad Request', message: 'Invalid request path.' });
        }
        const parts = pathname.split('/').filter(Boolean);
        if (parts.some((part) => part.startsWith('.')) || pathname.includes('\\') || pathname.includes('\0')
            || /^\/(api|health)(\/|$)/.test(pathname)) {
          return reply.code(404).send(notFound);
        }
        const filename = await existingClientFile(clientRoot, parts.join(sep));
        if (filename) {
          const isAsset = pathname.startsWith('/assets/');
          return reply.sendFile(filename, { maxAge: isAsset ? '1y' : 0, immutable: isAsset });
        }
        // Only browser document navigation gets the SPA. Missing scripts,
        // unknown APIs, and other methods remain honest JSON 404 responses.
        const acceptsHtml = (request.headers.accept ?? '').split(',').some((part) => /^text\/html(?:\s*;|$)/i.test(part.trim()) && !/;\s*q=0(?:\.0*)?(?:\s*;|$)/i.test(part));
        if (!extname(pathname) && !pathname.startsWith('/assets/') && acceptsHtml) {
          return reply.sendFile(indexFile, { maxAge: 0, immutable: false });
        }
        return reply.code(404).send(notFound);
      });
    }
    app.setNotFoundHandler(async (_request, reply) => reply.code(404).send(notFound));
    app.setErrorHandler(async (error, request, reply) => {
      const candidate = error instanceof Error && 'statusCode' in error ? error.statusCode : undefined;
      const statusCode = typeof candidate === 'number' && candidate >= 400 && candidate < 500 ? candidate : 500;
      if (statusCode === 500) request.log.error({ err: error }, 'Request failed');
      return reply.code(statusCode).send({
        error: statusCode === 500 ? 'Internal Server Error' : 'Bad Request',
        message: statusCode === 500 ? 'The server could not complete this request.' : 'The request could not be accepted.',
      });
    });
    await app.ready();
    return app;
  } catch (error) {
    // Before onClose is registered, the connection still needs an owner.
    if (database?.isOpen) database.close();
    await app.close();
    throw error;
  }
}
