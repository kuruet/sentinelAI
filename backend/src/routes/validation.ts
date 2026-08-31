import type { FastifyInstance } from 'fastify';
import { AppError } from '../errors/app-error';
import { testRequestSchema } from '../validation/test-request';
import { parseRequest } from '../validation/parse-request';

export async function validationRoutes(app: FastifyInstance) {
  app.post('/api/v1/test-validation', async (request) => {
    const body = parseRequest(testRequestSchema, request.body);

    return {
      status: 'ok',
      message: `Validated request for ${body.name}.`,
    };
  });

  app.get('/api/v1/test-error', async () => {
    throw new AppError(400, 'BAD_REQUEST', 'Intentional test error.');
  });
}
