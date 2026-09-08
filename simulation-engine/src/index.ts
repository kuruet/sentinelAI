import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Pool } from 'pg';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://sentinelai:sentinelai@localhost:5433/sentinelai';

const SERVICE_NAME = 'sentinelai-demo-checkout';
const SERVICE_VERSION = '0.1.0';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  errorCode?: string;
  dependency?: string;
}

function log(level: LogLevel, event: string, context: LogContext = {}): void {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      event,
      ...context,
    }),
  );
}

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
  const startedAt = Date.now();
  const requestId = request.headers['x-request-id']?.toString() ?? randomUUID();
  const method = request.method ?? 'GET';
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const path = url.pathname;

  response.setHeader('x-request-id', requestId);

  log('INFO', 'http_request_started', {
    requestId,
    method,
    path,
  });

  try {
    if (method === 'GET' && path === '/') {
      writeJson(response, 200, {
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        message: 'SentinelAI demo checkout application is running.',
      });

      log('INFO', 'http_request_completed', {
        requestId,
        method,
        path,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
      });

      return;
    }

    if (method === 'GET' && path === '/health') {
      try {
        await checkDatabase();

        writeJson(response, 200, {
          status: 'healthy',
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          dependencies: {
            database: 'healthy',
          },
        });

        log('INFO', 'health_check_completed', {
          requestId,
          method,
          path,
          statusCode: 200,
          dependency: 'postgresql',
          durationMs: Date.now() - startedAt,
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

        log('ERROR', 'health_check_failed', {
          requestId,
          method,
          path,
          statusCode: 503,
          errorCode: 'DATABASE_UNAVAILABLE',
          dependency: 'postgresql',
          durationMs: Date.now() - startedAt,
        });
      }

      return;
    }

    if (method === 'POST' && path === '/checkout') {
      try {
        await checkDatabase();

        const orderId = `demo-order-${Date.now()}`;

        writeJson(response, 200, {
          status: 'success',
          service: SERVICE_NAME,
          message: 'Checkout completed successfully.',
          orderId,
        });

        log('INFO', 'checkout_completed', {
          requestId,
          method,
          path,
          statusCode: 200,
          durationMs: Date.now() - startedAt,
        });
      } catch {
        writeJson(response, 503, {
          status: 'failed',
          service: SERVICE_NAME,
          error: 'CHECKOUT_DEPENDENCY_UNAVAILABLE',
          message: 'Checkout could not complete because the database is unavailable.',
        });

        log('ERROR', 'checkout_failed', {
          requestId,
          method,
          path,
          statusCode: 503,
          errorCode: 'CHECKOUT_DEPENDENCY_UNAVAILABLE',
          dependency: 'postgresql',
          durationMs: Date.now() - startedAt,
        });
      }

      return;
    }

    writeJson(response, 404, {
      error: 'NOT_FOUND',
      service: SERVICE_NAME,
    });

    log('WARN', 'http_request_not_found', {
      requestId,
      method,
      path,
      statusCode: 404,
      durationMs: Date.now() - startedAt,
    });
  } catch {
    writeJson(response, 500, {
      error: 'INTERNAL_SERVER_ERROR',
      service: SERVICE_NAME,
    });

    log('ERROR', 'http_request_failed', {
      requestId,
      method,
      path,
      statusCode: 500,
      errorCode: 'INTERNAL_SERVER_ERROR',
      durationMs: Date.now() - startedAt,
    });
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

async function shutdown(signal: string): Promise<void> {
  log('INFO', 'service_shutdown_started', {
    dependency: 'postgresql',
  });

  server.close(async () => {
    await database.end();

    log('INFO', 'service_shutdown_completed', {
      dependency: 'postgresql',
    });
  });

  if (signal === 'SIGINT' || signal === 'SIGTERM') {
    return;
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

server.listen(PORT, HOST, () => {
  log('INFO', 'service_started');
});
