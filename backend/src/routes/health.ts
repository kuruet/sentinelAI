import type { FastifyInstance } from 'fastify';
import { prisma } from '../infrastructure/database';
import { redis } from '../infrastructure/redis';
import { queueRedisConnection } from '../infrastructure/queue';
import { workerRedisConnection } from '../infrastructure/worker';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/v1/health', async () => {
    return {
      status: 'ok',
      service: 'sentinelai-backend',
    };
  });

  app.get('/api/v1/ready', async (_request, reply) => {
    const checks = {
      postgres: false,
      redis: false,
      bullmq: false,
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.postgres = true;
    } catch (error) {
      app.log.error(error, 'PostgreSQL readiness check failed');
    }

    try {
      await redis.ping();
      checks.redis = true;
    } catch (error) {
      app.log.error(error, 'Redis readiness check failed');
    }

    try {
      await queueRedisConnection.ping();
      await workerRedisConnection.ping();
      checks.bullmq = true;
    } catch (error) {
      app.log.error(error, 'BullMQ readiness check failed');
    }

    const ready = checks.postgres && checks.redis && checks.bullmq;

    if (!ready) {
      return reply.code(503).send({
        status: 'not_ready',
        service: 'sentinelai-backend',
        checks,
      });
    }

    return {
      status: 'ready',
      service: 'sentinelai-backend',
      checks,
    };
  });
}
