import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import { healthRoutes } from './health';
import { incidentRoutes } from './incidents';
import { automaticCorrelationRoutes } from './automatic-correlation';
import { ingestionRoutes } from '../ingestion/ingestion-routes';
import { validationRoutes } from './validation';
import { demoRoutes } from './demo';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(validationRoutes);
  await app.register(authRoutes);
  await app.register(incidentRoutes);
  await app.register(automaticCorrelationRoutes);
  await app.register(ingestionRoutes);
  await app.register(demoRoutes);
}
