import { STATUS_CODES } from 'node:http';
import type { FastifyInstance } from 'fastify';

export class AppError extends Error {
  constructor(readonly statusCode: number, readonly code: string, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = { error: 'Not Found', code: 'NOT_FOUND', message: 'This resource does not exist.' };

export function registerErrors(app: FastifyInstance): void {
  app.setNotFoundHandler(async (request, reply) => reply.code(404).send({ ...notFound, requestId: request.id }));
  app.setErrorHandler(async (error, request, reply) => {
    const failure = error as { statusCode?: number; code?: string; errcode?: number };
    let status = failure.statusCode && failure.statusCode >= 400 && failure.statusCode < 500 ? failure.statusCode : 500;
    let code = status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST';
    let message = status === 500 ? 'The server could not complete this request.' : 'The request could not be accepted.';
    if (error instanceof AppError) {
      status = error.statusCode;
      code = error.code;
      message = error.message;
    } else if (failure.code === 'ERR_SQLITE_ERROR') {
      const primaryCode = (failure.errcode ?? 0) & 0xff;
      if (primaryCode === 19) {
        status = 409;
        code = 'DATA_CONFLICT';
        message = 'This change conflicts with existing records.';
      } else if (primaryCode === 5 || primaryCode === 6) {
        status = 503;
        code = 'DATABASE_BUSY';
        message = 'The database is busy. Try again shortly.';
        reply.header('Retry-After', '1');
      }
    }
    // Error messages and request bodies may contain private input. Log only identifiers.
    if (status >= 500) request.log.error({ failureCode: failure.code ?? code }, 'Request failed');
    return reply.code(status).send({ error: STATUS_CODES[status] ?? 'Error', code, message, requestId: request.id });
  });
}
