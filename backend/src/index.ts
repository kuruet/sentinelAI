import Fastify from 'fastify';
import { env } from './config/env';
import { prisma } from './infrastructure/database';
import { redis } from './infrastructure/redis';
import { infrastructureTestQueue, queueRedisConnection } from './infrastructure/queue';
import { infrastructureTestWorker, workerRedisConnection } from './infrastructure/worker';
import { registerErrorHandling } from './errors/error-handler';
import { healthRoutes } from './routes/health';
import { validationRoutes } from './routes/validation';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  void app.register(healthRoutes);
  void app.register(validationRoutes);

  registerErrorHandling(app);

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
    await app.listen({
      host: env.BACKEND_HOST,
      port: env.PORT,
    });
  } catch (error) {
    app.log.error(error);
    await app.close();
    process.exit(1);
  }
}

void start();
