import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Pool } from 'pg';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://sentinelai:sentinelai@localhost:5433/sentinelai';

const SERVICE_NAME = 'sentinelai-demo-checkout';
const SERVICE_VERSION = '0.1.0';

const database = new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 3000,
});

function writeJson(
  response: ServerResponse<IncomingMessage>,
  statusCode: number,
  body: unknown,
): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
}

async function checkDatabase(): Promise<boolean> {
  const client = await database.connect();

  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
): Promise<void> {
  const method = request.method ?? 'GET';
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (method === 'GET' && url.pathname === '/') {
    writeJson(response, 200, {
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      message: 'SentinelAI demo checkout application is running.',
    });
    return;
  }

  if (method === 'GET' && url.pathname === '/health') {
    try {
      const databaseHealthy = await checkDatabase();

      writeJson(response, databaseHealthy ? 200 : 503, {
        status: databaseHealthy ? 'healthy' : 'unhealthy',
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        dependencies: {
          database: databaseHealthy ? 'healthy' : 'unhealthy',
        },
      });
    } catch {
      writeJson(response, 503, {
        status: 'unhealthy',
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        dependencies: {
          database: 'unhealthy',
        },
      });
    }

    return;
  }

  if (method === 'POST' && url.pathname === '/checkout') {
    try {
      await checkDatabase();

      writeJson(response, 200, {
        status: 'success',
        service: SERVICE_NAME,
        message: 'Checkout completed successfully.',
        orderId: `demo-order-${Date.now()}`,
      });
    } catch {
      writeJson(response, 503, {
        status: 'failed',
        service: SERVICE_NAME,
        error: 'CHECKOUT_DEPENDENCY_UNAVAILABLE',
        message: 'Checkout could not complete because the database is unavailable.',
      });
    }

    return;
  }

  writeJson(response, 404, {
    error: 'NOT_FOUND',
    service: SERVICE_NAME,
  });
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch(() => {
    writeJson(response, 500, {
      error: 'INTERNAL_SERVER_ERROR',
      service: SERVICE_NAME,
    });
  });
});

async function shutdown(signal: string): Promise<void> {
  console.log(`[${SERVICE_NAME}] shutdown signal received: ${signal}`);

  server.close(async () => {
    await database.end();
    console.log(`[${SERVICE_NAME}] shutdown complete.`);
  });
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

server.listen(PORT, HOST, () => {
  console.log(`[${SERVICE_NAME}] listening on http://${HOST}:${PORT} version=${SERVICE_VERSION}`);
});
