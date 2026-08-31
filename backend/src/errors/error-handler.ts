import type { FastifyInstance } from 'fastify';
import { AppError, type ApiErrorResponse } from './app-error';

export function registerErrorHandling(app: FastifyInstance) {
  app.setNotFoundHandler((_request, reply) => {
    const response: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    };

    return reply.code(404).send(response);
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: error.code,
          message: error.message,
        },
      };

      return reply.code(error.statusCode).send(response);
    }

    request.log.error(error);

    const response: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    };

    return reply.code(500).send(response);
  });
}
