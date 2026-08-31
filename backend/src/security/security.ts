import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

export async function registerSecurity(app: FastifyInstance) {
  await app.register(helmet);

  await app.register(cors, {
    origin: false,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
}
