import { randomUUID } from 'node:crypto';
import { SentinelAIIngestionClient } from './integration/sentinelai-ingestion-client.js';
import { SentinelAIEvidenceClient } from './integration/sentinelai-evidence-client.js';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { renderDemoPage } from './demo-page.js';

const PORT = Number(process.env.PORT ?? 4000);
const SENTINELAI_URL = process.env.SENTINELAI_URL ?? 'http://localhost:3000';
const SENTINELAI_TOKEN = process.env.SENTINELAI_TOKEN ?? '';
const SENTINELAI_INCIDENT_ID = process.env.SENTINELAI_INCIDENT_ID ?? '';
const HOST = process.env.HOST ?? '0.0.0.0';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://sentinelai:sentinelai@localhost:5433/sentinelai';

const SERVICE_NAME = 'sentinelai-demo-checkout';
const SERVICE_VERSION = '0.1.0';

type DeploymentStatus = 'STARTED' | 'COMPLETED' | 'FAILED';

interface DeploymentEvent {
  deploymentId: string;
  service: string;
  environment: string;
  previousVersion: string;
  newVersion: string;
  status: DeploymentStatus;
  timestamp: string;
}
type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  requestId?: string;
  deploymentCount?: number;
  deploymentId?: string;
  deploymentStatus?: DeploymentStatus;
  newVersion?: string;
  previousVersion?: string;
  environment?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  errorCode?: string;
  dependency?: string;
  failureMode?: string;
}

interface Histogram {
  count: number;
  sum: number;
  buckets: number[];
}

const requestCount = new Map<string, number>();
const deploymentEvents: DeploymentEvent[] = [];
const checkoutSuccessCount = { value: 0 };
const checkoutFailureCount = { value: 0 };
const healthCheckFailureCount = { value: 0 };
const dependencyFailureCount = new Map<string, number>();

const requestDuration: Histogram = {
  count: 0,
  sum: 0,
  buckets: [0, 0, 0, 0, 0],
};

let databaseFailureInjected = false;

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
  if (databaseFailureInjected) {
    throw new Error('DEMO_DATABASE_FAILURE_INJECTED');
  }

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
      response.statusCode = 200;
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(renderDemoPage());

      const durationMs = Date.now() - startedAt;
      recordRequest(path, durationMs);

      log('INFO', 'demo_ui_served', {
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
          failureInjection: {
            database: databaseFailureInjected,
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
          failureInjection: {
            database: databaseFailureInjected,
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
          failureMode: databaseFailureInjected ? 'controlled' : 'dependency',
        });
      }

      return;
    }

    if (method === 'POST' && path === '/demo/integrate') {
      if (!SENTINELAI_TOKEN || !SENTINELAI_INCIDENT_ID) {
        response.statusCode = 503;
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            error: 'SENTINELAI_INTEGRATION_NOT_CONFIGURED',
            message: 'SentinelAI integration credentials are not configured.',
          }),
        );
        return;
      }

      const client = new SentinelAIIngestionClient({
        baseUrl: SENTINELAI_URL,
        token: SENTINELAI_TOKEN,
        incidentId: SENTINELAI_INCIDENT_ID,
      });

      try {
        const result = await client.ingest([
          {
            source: SERVICE_NAME,
            signalType: 'LOG',
            occurredAt: new Date().toISOString(),
            title: 'Demo application integration signal',
            description:
              'Controlled integration signal emitted by the SentinelAI demo application.',
            sourceRef: requestId,
            metadata: {
              service: SERVICE_NAME,
              version: SERVICE_VERSION,
              integration: 'simulation-engine',
              requestId,
            },
          },
        ]);

        log('INFO', 'sentinelai_event_integrated', {
          requestId,
          statusCode: 202,
          durationMs: Date.now() - startedAt,
        });

        response.statusCode = 202;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify(result));
      } catch (error) {
        log('ERROR', 'sentinelai_event_integration_failed', {
          requestId,
          statusCode: 502,
          durationMs: Date.now() - startedAt,
          errorCode: 'SENTINELAI_INTEGRATION_FAILED',
        });

        response.statusCode = 502;
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            error: 'SENTINELAI_INTEGRATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown integration failure.',
          }),
        );
      }

      return;
    }
    if (method === 'POST' && path === '/demo/integrate-evidence') {
      if (!SENTINELAI_TOKEN || !SENTINELAI_INCIDENT_ID) {
        response.statusCode = 503;
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            error: 'SENTINELAI_INTEGRATION_NOT_CONFIGURED',
            message: 'SentinelAI integration credentials are not configured.',
          }),
        );
        return;
      }

      const client = new SentinelAIEvidenceClient({
        baseUrl: SENTINELAI_URL,
        token: SENTINELAI_TOKEN,
        incidentId: SENTINELAI_INCIDENT_ID,
      });

      const occurredAt = new Date().toISOString();

      try {
        const result = await client.createEvidence({
          evidenceType: 'LOG',
          title: 'Demo application observed application signal',
          description: 'Controlled telemetry evidence emitted by the SentinelAI demo application.',
          source: SERVICE_NAME,
          sourceRef: requestId,
          collectedAt: occurredAt,
          occurredAt,
          trustLevel: 'DEMO_OBSERVED',
          metadata: {
            service: SERVICE_NAME,
            version: SERVICE_VERSION,
            integration: 'simulation-engine',
            requestId,
            evidenceOrigin: 'controlled-demo-application',
          },
        });

        log('INFO', 'sentinelai_evidence_integrated', {
          requestId,
          statusCode: 201,
          durationMs: Date.now() - startedAt,
        });

        response.statusCode = 201;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify(result));
      } catch (error) {
        log('ERROR', 'sentinelai_evidence_integration_failed', {
          requestId,
          statusCode: 502,
          durationMs: Date.now() - startedAt,
          errorCode: 'SENTINELAI_EVIDENCE_INTEGRATION_FAILED',
        });

        response.statusCode = 502;
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            error: 'SENTINELAI_EVIDENCE_INTEGRATION_FAILED',
            message:
              error instanceof Error ? error.message : 'Unknown evidence integration failure.',
          }),
        );
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
          failureMode: databaseFailureInjected ? 'controlled' : 'dependency',
        });
      }

      return;
    }
    if (method === 'POST' && path === '/demo/deployment') {
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';

        request.setEncoding('utf8');

        request.on('data', (chunk: string) => {
          data += chunk;
        });

        request.on('end', () => resolve(data));
        request.on('error', reject);
      });

      let payload: {
        environment?: unknown;
        previousVersion?: unknown;
        newVersion?: unknown;
        status?: unknown;
      };

      try {
        payload = JSON.parse(body || '{}') as typeof payload;
      } catch {
        writeJson(response, 400, {
          error: 'INVALID_DEPLOYMENT_CONFIGURATION',
          message: 'Deployment payload must be valid JSON.',
        });

        const durationMs = Date.now() - startedAt;
        recordRequest(path, durationMs);

        log('WARN', 'deployment_event_rejected', {
          requestId,
          method,
          path,
          statusCode: 400,
          errorCode: 'INVALID_DEPLOYMENT_CONFIGURATION',
          durationMs,
        });

        return;
      }

      const environment =
        typeof payload.environment === 'string' && payload.environment.trim()
          ? payload.environment.trim()
          : 'demo';

      const previousVersion =
        typeof payload.previousVersion === 'string' && payload.previousVersion.trim()
          ? payload.previousVersion.trim()
          : SERVICE_VERSION;

      const newVersion =
        typeof payload.newVersion === 'string' && payload.newVersion.trim()
          ? payload.newVersion.trim()
          : SERVICE_VERSION;

      const status =
        payload.status === undefined
          ? 'COMPLETED'
          : payload.status === 'STARTED' ||
              payload.status === 'COMPLETED' ||
              payload.status === 'FAILED'
            ? payload.status
            : null;

      if (!status) {
        writeJson(response, 400, {
          error: 'INVALID_DEPLOYMENT_CONFIGURATION',
          message: 'Deployment status must be STARTED, COMPLETED, or FAILED.',
        });

        const durationMs = Date.now() - startedAt;
        recordRequest(path, durationMs);

        log('WARN', 'deployment_event_rejected', {
          requestId,
          method,
          path,
          statusCode: 400,
          errorCode: 'INVALID_DEPLOYMENT_CONFIGURATION',
          durationMs,
        });

        return;
      }

      const deploymentEvent: DeploymentEvent = {
        deploymentId: randomUUID(),
        service: SERVICE_NAME,
        environment,
        previousVersion,
        newVersion,
        status,
        timestamp: new Date().toISOString(),
      };

      deploymentEvents.push(deploymentEvent);

      writeJson(response, 201, {
        status: 'recorded',
        deployment: deploymentEvent,
      });

      const durationMs = Date.now() - startedAt;
      recordRequest(path, durationMs);

      log('INFO', 'deployment_event_recorded', {
        requestId,
        method,
        path,
        statusCode: 201,
        durationMs,
        deploymentId: deploymentEvent.deploymentId,
        environment: deploymentEvent.environment,
        previousVersion: deploymentEvent.previousVersion,
        newVersion: deploymentEvent.newVersion,
        deploymentStatus: deploymentEvent.status,
      });

      return;
    }

    if (method === 'GET' && path === '/demo/deployments') {
      writeJson(response, 200, {
        service: SERVICE_NAME,
        count: deploymentEvents.length,
        deployments: deploymentEvents,
      });

      const durationMs = Date.now() - startedAt;
      recordRequest(path, durationMs);

      log('INFO', 'deployment_events_listed', {
        requestId,
        method,
        path,
        statusCode: 200,
        durationMs,
        deploymentCount: deploymentEvents.length,
      });

      return;
    }
    if (method === 'POST' && path === '/demo/failure') {
      const body = await new Promise<string>((resolve, reject) => {
        let data = '';

        request.setEncoding('utf8');

        request.on('data', (chunk: string) => {
          data += chunk;
        });

        request.on('end', () => resolve(data));
        request.on('error', reject);
      });

      let payload: { enabled?: boolean };

      try {
        payload = JSON.parse(body || '{}') as { enabled?: boolean };
      } catch {
        payload = {};
      }

      if (typeof payload.enabled !== 'boolean') {
        writeJson(response, 400, {
          error: 'INVALID_FAILURE_CONFIGURATION',
          message: 'Request body must contain a boolean "enabled" field.',
        });

        const durationMs = Date.now() - startedAt;
        recordRequest(path, durationMs);

        log('WARN', 'failure_injection_rejected', {
          requestId,
          method,
          path,
          statusCode: 400,
          errorCode: 'INVALID_FAILURE_CONFIGURATION',
          durationMs,
        });

        return;
      }

      databaseFailureInjected = payload.enabled;

      writeJson(response, 200, {
        status: 'updated',
        service: SERVICE_NAME,
        failureInjection: {
          database: databaseFailureInjected,
        },
      });

      const durationMs = Date.now() - startedAt;
      recordRequest(path, durationMs);

      log('WARN', 'failure_injection_changed', {
        requestId,
        method,
        path,
        statusCode: 200,
        dependency: 'postgresql',
        failureMode: databaseFailureInjected ? 'controlled' : 'disabled',
        durationMs,
      });

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

