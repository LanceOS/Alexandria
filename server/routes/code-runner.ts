import type { FastifyInstance } from 'fastify';
import { CODE_RUNNER_LIMITS, type CodeRunInput } from '../../shared/code-runner.js';
import type { AuthService } from '../auth/service.js';
import { AppError } from '../http/errors.js';
import type { CodeRunner } from '../services/code-runner.js';

export function registerCodeRunnerRoutes(app: FastifyInstance, auth: AuthService, runner: CodeRunner): void {
  // Cancel execution before Fastify waits for active HTTP requests to finish.
  app.addHook('preClose', async () => runner.close());
  app.get('/api/code-runner/status', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return runner.status();
  });
  app.post<{ Body: CodeRunInput }>('/api/code-runner/run', {
    // JSON can encode one source byte as six characters (e.g. \u0009).
    // Decoded UTF-8 limits are enforced below, separately from transport size.
    bodyLimit: 256 * 1024,
    onRequest: async (request) => {
      auth.requireUser(request);
      auth.verifyCsrf(request);
    },
    schema: { body: { type: 'object', additionalProperties: false, required: ['language', 'source', 'stdin'], properties: {
      language: { type: 'string', const: 'cpp' },
      source: { type: 'string', minLength: 1, maxLength: CODE_RUNNER_LIMITS.sourceBytes },
      stdin: { type: 'string', maxLength: CODE_RUNNER_LIMITS.stdinBytes },
    } } },
  }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const user = auth.requireUser(request);
    const { source, stdin } = request.body;
    if (!source.trim() || source.includes('\0') || stdin.includes('\0')
        || Buffer.byteLength(source, 'utf8') > CODE_RUNNER_LIMITS.sourceBytes
        || Buffer.byteLength(stdin, 'utf8') > CODE_RUNNER_LIMITS.stdinBytes) {
      throw new AppError(400, 'INVALID_CODE_INPUT', 'Enter code within 32 KiB and input within 8 KiB, without null characters.');
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    const disconnected = () => { if (!reply.raw.writableEnded) abort(); };
    request.raw.once('aborted', abort);
    reply.raw.once('close', disconnected);
    try {
      return await runner.run(user.id, request.body, controller.signal);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 429) reply.header('Retry-After', '2');
      throw error;
    } finally {
      request.raw.removeListener('aborted', abort);
      reply.raw.removeListener('close', disconnected);
    }
  });
}
