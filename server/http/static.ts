import { realpath, stat } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import { canonicalPath, isWithin, type Config } from '../config.js';
import { notFound } from './errors.js';

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

export async function registerClient(app: FastifyInstance, config: Config, requireClient = false): Promise<void> {
    const clientRoot = canonicalPath(config.clientDir);
    if (!isWithin(canonicalPath(config.projectRoot), clientRoot)) {
      throw new Error('The built frontend must remain inside the application checkout, including through symbolic links.');
    }
    const indexFile = await existingClientFile(clientRoot, 'index.html');
    if (requireClient && !indexFile) throw new Error('Built frontend is missing. Run npm run build before starting production.');
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
}
