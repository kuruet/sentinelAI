import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { validationRoutes } from './validation';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(validationRoutes);
}
