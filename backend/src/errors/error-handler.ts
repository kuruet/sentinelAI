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

    const errorCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;

    if (error instanceof SyntaxError || errorCode === 'FST_ERR_CTP_INVALID_JSON_BODY') {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid JSON request body.',
        },
      };

      return reply.code(400).send(response);
    }

    if (
      errorCode === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' ||
      errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
      errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID'
    ) {
      const response: ApiErrorResponse = {
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      };

      return reply.code(401).send(response);
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
