import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './config/env';
import { prisma } from './infrastructure/database';
import { redis } from './infrastructure/redis';
import { infrastructureTestQueue, queueRedisConnection } from './infrastructure/queue';
import { infrastructureTestWorker, workerRedisConnection } from './infrastructure/worker';
import { registerErrorHandling } from './errors/error-handler';
import { registerRoutes } from './routes';
import { registerAuthentication, registerSecurity } from './security';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  await registerSecurity(app);
  await registerAuthentication(app);

  registerErrorHandling(app);

  await registerRoutes(app);

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
  const app = await buildApp();

  try {
    await app.listen({
      host: env.BACKEND_HOST,
      port: env.PORT,
    });
  } catch (error) {
    app.log.error(error);
    await app.close();
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void start();
}
