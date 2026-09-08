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

interface Histogram {
  count: number;
  sum: number;
  buckets: number[];
}

const requestCount = new Map<string, number>();
const checkoutSuccessCount = { value: 0 };
const checkoutFailureCount = { value: 0 };
const healthCheckFailureCount = { value: 0 };
const dependencyFailureCount = new Map<string, number>();

const requestDuration: Histogram = {
  count: 0,
  sum: 0,
  buckets: [0, 0, 0, 0, 0],
};

function incrementCounter(metric: Map<string, number> | { value: number }, key?: string): void {
  if ('value' in metric) {
    metric.value += 1;
    return;
  }

  const current = metric.get(key ?? '') ?? 0;
  metric.set(key ?? '', current + 1);
}

function observeRequestDuration(durationMs: number): void {
  requestDuration.count += 1;
  requestDuration.sum += durationMs;

  const limits = [10, 50, 100, 250, 1000];

  limits.forEach((limit, index) => {
    if (durationMs <= limit) {
      requestDuration.buckets[index] += 1;
    }
  });
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function renderMetrics(): string {
  const lines: string[] = [];

  lines.push(
    '# HELP sentinelai_http_requests_total Total HTTP requests handled by the demo application.',
  );
  lines.push('# TYPE sentinelai_http_requests_total counter');

  for (const [route, count] of requestCount.entries()) {
    lines.push(
      `sentinelai_http_requests_total{service="${escapeLabel(
        SERVICE_NAME,
      )}",route="${escapeLabel(route)}"} ${count}`,
    );
  }

  lines.push('# HELP sentinelai_checkout_success_total Successful checkout operations.');
  lines.push('# TYPE sentinelai_checkout_success_total counter');
  lines.push(
    `sentinelai_checkout_success_total{service="${escapeLabel(
      SERVICE_NAME,
    )}"} ${checkoutSuccessCount.value}`,
  );

  lines.push('# HELP sentinelai_checkout_failure_total Failed checkout operations.');
  lines.push('# TYPE sentinelai_checkout_failure_total counter');
  lines.push(
    `sentinelai_checkout_failure_total{service="${escapeLabel(
      SERVICE_NAME,
    )}"} ${checkoutFailureCount.value}`,
  );

  lines.push('# HELP sentinelai_health_check_failure_total Failed dependency health checks.');
  lines.push('# TYPE sentinelai_health_check_failure_total counter');
  lines.push(
    `sentinelai_health_check_failure_total{service="${escapeLabel(
      SERVICE_NAME,
    )}"} ${healthCheckFailureCount.value}`,
  );

  lines.push('# HELP sentinelai_dependency_failure_total Dependency failures.');
  lines.push('# TYPE sentinelai_dependency_failure_total counter');

  for (const [dependency, count] of dependencyFailureCount.entries()) {
    lines.push(
      `sentinelai_dependency_failure_total{service="${escapeLabel(
        SERVICE_NAME,
      )}",dependency="${escapeLabel(dependency)}"} ${count}`,
    );
  }

  lines.push('# HELP sentinelai_http_request_duration_ms HTTP request duration in milliseconds.');
  lines.push('# TYPE sentinelai_http_request_duration_ms histogram');

  const bucketLimits = [10, 50, 100, 250, 1000];

  bucketLimits.forEach((limit, index) => {
    lines.push(
      `sentinelai_http_request_duration_ms_bucket{service="${escapeLabel(
        SERVICE_NAME,
      )}",le="${limit}"} ${requestDuration.buckets[index]}`,
    );
  });

  lines.push(
    `sentinelai_http_request_duration_ms_bucket{service="${escapeLabel(
      SERVICE_NAME,
    )}",le="+Inf"} ${requestDuration.count}`,
  );

  lines.push(
    `sentinelai_http_request_duration_ms_sum{service="${escapeLabel(
      SERVICE_NAME,
    )}"} ${requestDuration.sum}`,
  );

  lines.push(
    `sentinelai_http_request_duration_ms_count{service="${escapeLabel(
      SERVICE_NAME,
    )}"} ${requestDuration.count}`,
  );

  return `${lines.join('\n')}\n`;
}

function recordRequest(route: string, durationMs: number): void {
  incrementCounter(requestCount, route);
  observeRequestDuration(durationMs);
}

function recordDependencyFailure(dependency: string): void {
  incrementCounter(dependencyFailureCount, dependency);
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

async function checkDatabase(): Promise<void> {
  const client = await database.connect();

  try {
    await client.query('SELECT 1');
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

      const durationMs = Date.now() - startedAt;
      recordRequest(path, durationMs);

      log('INFO', 'http_request_completed', {
        requestId,
        method,
        path,
        statusCode: 200,
        durationMs,
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

        const durationMs = Date.now() - startedAt;
        recordRequest(path, durationMs);

        log('INFO', 'health_check_completed', {
          requestId,
          method,
          path,
          statusCode: 200,
          dependency: 'postgresql',
          durationMs,
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

        const durationMs = Date.now() - startedAt;
        recordRequest(path, durationMs);
        healthCheckFailureCount.value += 1;
        recordDependencyFailure('postgresql');

        log('ERROR', 'health_check_failed', {
          requestId,
          method,
          path,
          statusCode: 503,
          errorCode: 'DATABASE_UNAVAILABLE',
          dependency: 'postgresql',
          durationMs,
        });
      }

      return;
    }

    if (method === 'GET' && path === '/metrics') {
      const metrics = renderMetrics();

      response.statusCode = 200;
      response.setHeader('content-type', 'text/plain; version=0.0.4; charset=utf-8');
      response.end(metrics);

      const durationMs = Date.now() - startedAt;
      recordRequest(path, durationMs);

      log('INFO', 'metrics_scrape_completed', {
        requestId,
        method,
        path,
        statusCode: 200,
        durationMs,
      });

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

        const durationMs = Date.now() - startedAt;
        recordRequest(path, durationMs);
        checkoutSuccessCount.value += 1;

        log('INFO', 'checkout_completed', {
          requestId,
          method,
          path,
          statusCode: 200,
          durationMs,
        });
      } catch {
        writeJson(response, 503, {
          status: 'failed',
          service: SERVICE_NAME,
          error: 'CHECKOUT_DEPENDENCY_UNAVAILABLE',
          message: 'Checkout could not complete because the database is unavailable.',
        });

        const durationMs = Date.now() - startedAt;
        recordRequest(path, durationMs);
        checkoutFailureCount.value += 1;
        recordDependencyFailure('postgresql');

        log('ERROR', 'checkout_failed', {
          requestId,
          method,
          path,
          statusCode: 503,
          errorCode: 'CHECKOUT_DEPENDENCY_UNAVAILABLE',
          dependency: 'postgresql',
          durationMs,
        });
      }

      return;
    }

    writeJson(response, 404, {
      error: 'NOT_FOUND',
      service: SERVICE_NAME,
    });

    const durationMs = Date.now() - startedAt;
    recordRequest(path, durationMs);

    log('WARN', 'http_request_not_found', {
      requestId,
      method,
      path,
      statusCode: 404,
      durationMs,
    });
  } catch {
    const durationMs = Date.now() - startedAt;
    recordRequest(path, durationMs);

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
      durationMs,
    });
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

async function shutdown(): Promise<void> {
  log('INFO', 'service_shutdown_started', {
    dependency: 'postgresql',
  });

  server.close(async () => {
    await database.end();

    log('INFO', 'service_shutdown_completed', {
      dependency: 'postgresql',
    });
  });
}

process.once('SIGINT', () => {
  void shutdown();
});

process.once('SIGTERM', () => {
  void shutdown();
});

server.listen(PORT, HOST, () => {
  log('INFO', 'service_started');
});
