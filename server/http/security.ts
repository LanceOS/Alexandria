import type { FastifyInstance } from 'fastify';
import type { Config } from '../config.js';
import { AppError } from './errors.js';

export function registerSecurity(app: FastifyInstance, config: Config): void {
  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Request-Id', request.id);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'same-origin');
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    // The router decodes escaped path segments. Classify its matched route so
    // /%61pi/... receives exactly the same checks as /api/....
    const pathname = request.routeOptions.url ?? request.url.split('?')[0] ?? '';
    const isApi = pathname === '/api' || pathname.startsWith('/api/');
    if (isApi) reply.header('Cache-Control', 'no-store');
    const unsafe = isApi && !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const origin = request.headers.origin;
    const expectedOrigin = config.appOrigin ?? `${request.protocol}://${request.headers.host}`;
    if (origin && (config.appOrigin || unsafe) && origin !== expectedOrigin) {
      throw new AppError(403, 'ORIGIN_REJECTED', 'Request origin does not match the application origin.');
    }
    if (unsafe) {
      if (request.headers['sec-fetch-site'] === 'cross-site') {
        throw new AppError(403, 'ORIGIN_REJECTED', 'Cross-site changes are not accepted.');
      }
      if (request.headers['x-alexandria-request'] !== '1') {
        throw new AppError(403, 'REQUEST_HEADER_REQUIRED', 'API changes require X-Alexandria-Request: 1.');
      }
    }
  });
}
