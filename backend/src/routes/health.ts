import type { FastifyInstance } from 'fastify';
import type { ApiSuccessResponse } from '../contracts';
import { prisma } from '../infrastructure/database';
import { connectRedis, redis } from '../infrastructure/redis';
import { queueRedisConnection } from '../infrastructure/queue';
import { workerRedisConnection } from '../infrastructure/worker';

interface HealthData {
  service: string;
}

interface ReadinessData {
  service: string;
  checks: {
    postgres: boolean;
    redis: boolean;
    bullmq: boolean;
  };
}

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/v1/health', async (): Promise<ApiSuccessResponse<HealthData>> => {
    return {
      status: 'ok',
      data: {
        service: 'sentinelai-backend',
      },
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
      await connectRedis();
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

    const data: ReadinessData = {
      service: 'sentinelai-backend',
      checks,
    };

    if (!ready) {
      return reply.code(503).send({
        status: 'error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Backend dependencies are not ready.',
        },
      });
    }

    const response: ApiSuccessResponse<ReadinessData> = {
      status: 'ok',
      data,
    };

    return reply.send(response);
  });
}
