import type { FastifyInstance } from 'fastify';
import type { ApiMessageResponse } from '../contracts';
import { authenticate } from '../security';

export async function authRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/test-protected',
    {
      onRequest: [authenticate],
    },
    async (): Promise<ApiMessageResponse> => {
      return {
        status: 'ok',
        message: 'Authenticated request accepted.',
      };
    },
  );
}
