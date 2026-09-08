import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const SIMULATION_URL = 'http://127.0.0.1:4000';
const SIMULATION_ENTRY = path.join(REPOSITORY_ROOT, 'simulation-engine', 'dist', 'index.js');

const STARTUP_TIMEOUT_MS = 20_000;
const REQUEST_TIMEOUT_MS = 5_000;

interface HttpResult<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
}

interface HealthResponse {
  status?: string;
  service?: string;
  failureInjection?: {
    database?: boolean;
  };
}

interface CheckoutResponse {
  status?: string;
  orderId?: string;
  error?: string;
  message?: string;
}

interface FailureResponse {
  failureInjection?: {
    database?: boolean;
  };
  error?: string;
  message?: string;
}

interface MetricsResponse {
  body: string;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function logPass(message: string): void {
  console.log(`PASS: ${message}`);
}

async function request<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<HttpResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(options.headers ?? {}),
      },
    });

    const text = await response.text();

    let body: T;

    try {
      body = JSON.parse(text) as T;
    } catch {
      body = text as T;
    }

    return {
      status: response.status,
      body,
      headers: response.headers,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForHealth(): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    try {
      const result = await request<HealthResponse>(`${SIMULATION_URL}/health`, {
        headers: {
          'x-request-id': 'step-8-13-startup-health',
        },
      });

      if (result.status === 200 && result.body.status === 'healthy') {
        return;
      }
    } catch {
      // The service may not be listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Demo application did not become healthy within the startup window.');
}

function startDemoApplication(): ChildProcess {
  return spawn(process.execPath, [SIMULATION_ENTRY], {
    cwd: REPOSITORY_ROOT,
    env: {
      ...process.env,
      PORT: '4000',
      HOST: '127.0.0.1',
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://sentinelai:sentinelai@127.0.0.1:5433/sentinelai',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function stopDemoApplication(processHandle: ChildProcess | null): Promise<void> {
  if (!processHandle || processHandle.killed || processHandle.exitCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;

    const finish = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };

    processHandle.once('exit', finish);
    processHandle.kill('SIGTERM');

    setTimeout(() => {
      if (!settled) {
        try {
          processHandle.kill('SIGKILL');
        } catch {
          // Process may already have exited.
        }
        finish();
      }
    }, 3_000);
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('============================================================');
  console.log(' STEP 8.13 — FAILURE & RECOVERY VERIFICATION');
  console.log('============================================================');

  let demoProcess: ChildProcess | null = null;

  try {
    console.log('');
    console.log('[1/12] Starting demo application...');
    demoProcess = startDemoApplication();

    let stdout = '';
    let stderr = '';

    demoProcess.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    demoProcess.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    await waitForHealth();
    logPass('demo application started healthy');

    console.log('');
    console.log('[2/12] Verifying healthy baseline...');

    const baselineHealth = await request<HealthResponse>(`${SIMULATION_URL}/health`, {
      headers: {
        'x-request-id': 'step-8-13-baseline-health',
      },
    });

    assert(baselineHealth.status === 200, 'Baseline health must return HTTP 200.');
    assert(baselineHealth.body.status === 'healthy', 'Baseline health must report healthy.');
    assert(
      baselineHealth.body.failureInjection?.database === false,
      'Database failure must start disabled.',
    );

    const baselineCheckout = await request<CheckoutResponse>(`${SIMULATION_URL}/checkout`, {
      method: 'POST',
      headers: {
        'x-request-id': 'step-8-13-baseline-checkout',
      },
    });

    assert(baselineCheckout.status === 200, 'Baseline checkout must return HTTP 200.');
    assert(baselineCheckout.body.status === 'success', 'Baseline checkout must report success.');
    assert(Boolean(baselineCheckout.body.orderId), 'Baseline checkout must return an order ID.');

    logPass('healthy baseline verified');

    console.log('');
    console.log('[3/12] Enabling controlled database failure...');

    const failureEnabled = await request<FailureResponse>(`${SIMULATION_URL}/demo/failure`, {
      method: 'POST',
      headers: {
        'x-request-id': 'step-8-13-failure-enable',
      },
      body: JSON.stringify({
        enabled: true,
      }),
    });

    assert(failureEnabled.status === 200, 'Enabling database failure must return HTTP 200.');
    assert(
      failureEnabled.body.failureInjection?.database === true,
      'Database failure must become enabled.',
    );

    logPass('controlled database failure enabled');

    console.log('');
    console.log('[4/12] Verifying unhealthy dependency state...');

    const failedHealth = await request<HealthResponse>(`${SIMULATION_URL}/health`, {
      headers: {
        'x-request-id': 'step-8-13-failed-health',
      },
    });

    assert(failedHealth.status === 503, 'Health must return HTTP 503 while failure is enabled.');
    assert(
      failedHealth.body.status === 'unhealthy',
      'Health must report unhealthy while failure is enabled.',
    );
    assert(
      failedHealth.body.failureInjection?.database === true,
      'Health must expose the active database failure state.',
    );

    logPass('health correctly reports dependency failure');

    console.log('');
    console.log('[5/12] Verifying repeated checkout failures...');

    const failedCheckouts: HttpResult<CheckoutResponse>[] = [];

    for (let index = 1; index <= 3; index += 1) {
      const result = await request<CheckoutResponse>(`${SIMULATION_URL}/checkout`, {
        method: 'POST',
        headers: {
          'x-request-id': `step-8-13-failed-checkout-${index}`,
        },
      });

      failedCheckouts.push(result);
    }

    assert(
      failedCheckouts.every((result) => result.status === 503),
      'Every checkout must return HTTP 503 while failure is enabled.',
    );

    assert(
      failedCheckouts.every((result) => result.body.error === 'CHECKOUT_DEPENDENCY_UNAVAILABLE'),
      'Every failed checkout must expose the expected dependency error code.',
    );

    logPass('repeated checkout failures verified');

    console.log('');
    console.log('[6/12] Verifying failure metrics...');

    const failedMetrics = await request<MetricsResponse>(`${SIMULATION_URL}/metrics`, {
      headers: {
        'x-request-id': 'step-8-13-failure-metrics',
      },
    });

    assert(
      failedMetrics.status === 200,
      'Metrics endpoint must remain available during dependency failure.',
    );
    assert(
      failedMetrics.body.includes('sentinelai_checkout_failure_total'),
      'Checkout failure metric must be present.',
    );
    assert(
      failedMetrics.body.includes('sentinelai_dependency_failure_total'),
      'Dependency failure metric must be present.',
    );
    assert(
      failedMetrics.body.includes('sentinelai_health_check_failure_total'),
      'Health failure metric must be present.',
    );

    logPass('failure metrics remain observable');

    console.log('');
    console.log('[7/12] Verifying invalid failure configuration rejection...');

    const invalidFailure = await request<FailureResponse>(`${SIMULATION_URL}/demo/failure`, {
      method: 'POST',
      headers: {
        'x-request-id': 'step-8-13-invalid-failure',
      },
      body: JSON.stringify({
        enabled: 'true',
      }),
    });

    assert(invalidFailure.status === 400, 'Invalid failure configuration must return HTTP 400.');
    assert(
      invalidFailure.body.error === 'INVALID_FAILURE_CONFIGURATION',
      'Invalid failure configuration must expose the expected error code.',
    );

    logPass('invalid failure configuration rejected');

    console.log('');
    console.log('[8/12] Verifying invalid configuration does not alter failure state...');

    const stateAfterInvalidRequest = await request<HealthResponse>(`${SIMULATION_URL}/health`, {
      headers: {
        'x-request-id': 'step-8-13-state-after-invalid-request',
      },
    });

    assert(
      stateAfterInvalidRequest.status === 503,
      'Failure state must remain active after invalid configuration.',
    );
    assert(
      stateAfterInvalidRequest.body.status === 'unhealthy',
      'Application must remain unhealthy after invalid configuration.',
    );
    assert(
      stateAfterInvalidRequest.body.failureInjection?.database === true,
      'Invalid configuration must not disable the active failure.',
    );

    logPass('invalid configuration left active failure state unchanged');

    console.log('');
    console.log('[9/12] Disabling controlled database failure...');

    const failureDisabled = await request<FailureResponse>(`${SIMULATION_URL}/demo/failure`, {
      method: 'POST',
      headers: {
        'x-request-id': 'step-8-13-failure-disable',
      },
      body: JSON.stringify({
        enabled: false,
      }),
    });

    assert(failureDisabled.status === 200, 'Disabling database failure must return HTTP 200.');
    assert(
      failureDisabled.body.failureInjection?.database === false,
      'Database failure must become disabled.',
    );

    logPass('controlled database failure disabled');

    console.log('');
    console.log('[10/12] Verifying application recovery...');

    const recoveredHealth = await request<HealthResponse>(`${SIMULATION_URL}/health`, {
      headers: {
        'x-request-id': 'step-8-13-recovered-health',
      },
    });

    assert(recoveredHealth.status === 200, 'Recovered health must return HTTP 200.');
    assert(recoveredHealth.body.status === 'healthy', 'Recovered health must report healthy.');
    assert(
      recoveredHealth.body.failureInjection?.database === false,
      'Recovered health must report disabled failure injection.',
    );

    const recoveredCheckout = await request<CheckoutResponse>(`${SIMULATION_URL}/checkout`, {
      method: 'POST',
      headers: {
        'x-request-id': 'step-8-13-recovered-checkout-1',
      },
    });

    assert(recoveredCheckout.status === 200, 'Recovered checkout must return HTTP 200.');
    assert(recoveredCheckout.body.status === 'success', 'Recovered checkout must report success.');
    assert(Boolean(recoveredCheckout.body.orderId), 'Recovered checkout must return an order ID.');

    logPass('health and checkout recovered');

    console.log('');
    console.log('[11/12] Verifying repeated post-recovery operations...');

    const postRecoveryCheckouts: HttpResult<CheckoutResponse>[] = [];

    for (let index = 1; index <= 3; index += 1) {
      const result = await request<CheckoutResponse>(`${SIMULATION_URL}/checkout`, {
        method: 'POST',
        headers: {
          'x-request-id': `step-8-13-post-recovery-checkout-${index}`,
        },
      });

      postRecoveryCheckouts.push(result);
    }

    assert(
      postRecoveryCheckouts.every((result) => result.status === 200),
      'Every post-recovery checkout must return HTTP 200.',
    );
    assert(
      postRecoveryCheckouts.every((result) => result.body.status === 'success'),
      'Every post-recovery checkout must report success.',
    );
    assert(
      postRecoveryCheckouts.every((result) => Boolean(result.body.orderId)),
      'Every post-recovery checkout must return an order ID.',
    );

    logPass('repeated post-recovery operations succeeded');

    console.log('');
    console.log('[12/12] Final health verification...');

    const finalHealth = await request<HealthResponse>(`${SIMULATION_URL}/health`, {
      headers: {
        'x-request-id': 'step-8-13-final-health',
      },
    });

    assert(finalHealth.status === 200, 'Final health must return HTTP 200.');
    assert(finalHealth.body.status === 'healthy', 'Final application state must be healthy.');
    assert(
      finalHealth.body.failureInjection?.database === false,
      'Final database failure injection state must be disabled.',
    );

    logPass('final application state is healthy');

    console.log('');
    console.log('============================================================');
    console.log(' STEP 8.13 FAILURE & RECOVERY VERIFICATION PASSED');
    console.log('============================================================');
    console.log('');
    console.log('Verified:');
    console.log('  - healthy baseline');
    console.log('  - controlled failure activation');
    console.log('  - unhealthy health response');
    console.log('  - repeated checkout failures');
    console.log('  - failure metrics');
    console.log('  - invalid failure configuration rejection');
    console.log('  - failure state preservation after invalid input');
    console.log('  - controlled failure disablement');
    console.log('  - health recovery');
    console.log('  - checkout recovery');
    console.log('  - repeated post-recovery operations');
    console.log('  - final healthy state');
    console.log('');

    if (stdout.length > 0) {
      console.log('Demo stdout captured:', stdout.length, 'bytes');
    }

    if (stderr.length > 0) {
      console.log('Demo stderr captured:', stderr.length, 'bytes');
    }
  } finally {
    await stopDemoApplication(demoProcess);
  }
}

main().catch((error: unknown) => {
  console.error('');
  console.error('============================================================');
  console.error(' STEP 8.13 FAILURE & RECOVERY VERIFICATION FAILED');
  console.error('============================================================');
  console.error('');

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
