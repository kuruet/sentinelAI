import { config } from 'dotenv';
import Fastify from 'fastify';
import { prisma } from './infrastructure/database';
import { connectRedis, redis } from './infrastructure/redis';
import { infrastructureTestQueue, queueRedisConnection } from './infrastructure/queue';
import { infrastructureTestWorker, workerRedisConnection } from './infrastructure/worker';
import { healthRoutes } from './routes/health';

config({ path: '../.env' });

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  void app.register(healthRoutes);

  app.addHook('onClose', async () => {
    await infrastructureTestWorker.close();
    await infrastructureTestQueue.close();

    await workerRedisConnection.quit();
    await queueRedisConnection.quit();

    if (redis.isOpen) {
      await redis.quit();
    }

    await prisma.$disconnect();
  });

  return app;
}

export async function start() {
  const app = buildApp();

  try {
    await connectRedis();

    await app.listen({
      host: process.env.BACKEND_HOST ?? '127.0.0.1',
      port: Number(process.env.PORT ?? 3000),
    });
  } catch (error) {
    app.log.error(error);
    await app.close();
    process.exit(1);
  }
}

void start();
