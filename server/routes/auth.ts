import type { FastifyInstance } from 'fastify';
import { loginSchema, type LoginInput } from '../../shared/auth.js';
import type { AuthService } from '../auth/service.js';
import { LoginRateLimitError } from '../auth/throttle.js';
import { AppError } from '../http/errors.js';

export function registerAuthRoutes(app: FastifyInstance, auth: AuthService): void {
  app.get('/api/auth/session', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return auth.session(request);
  });
  app.post<{ Body: LoginInput }>('/api/auth/login', { schema: { body: loginSchema } }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    try {
      const { user, csrfToken, cookie } = await auth.login(request.body, request.ip);
      reply.header('Set-Cookie', cookie);
      return { user, csrfToken };
    } catch (error) {
      if (error instanceof LoginRateLimitError) reply.header('Retry-After', error.retryAfter);
      else if (error instanceof AppError && error.statusCode === 429) reply.header('Retry-After', 1);
      throw error;
    }
  });
  app.post('/api/auth/logout', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('Set-Cookie', auth.logout(request));
    return reply.code(204).send();
  });
}
