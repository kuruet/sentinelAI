import { config } from 'dotenv';
import Fastify from 'fastify';

config({ path: '../.env' });

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  return app;
}

export async function start() {
  const app = buildApp();

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.BACKEND_HOST ?? '127.0.0.1';

  try {
    await app.listen({
      host,
      port,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
