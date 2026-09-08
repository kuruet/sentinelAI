import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeDemoScenario, DEMO_INCIDENT_ID, DEMO_USER_ID } from '../src/demo/demo-scenario';
import { prisma } from '../src/infrastructure/database';
import { intelligenceContextService } from '../src/application/intelligence-context';
import { AutomaticIncidentCorrelationService } from '../src/services/automatic-incident-correlation-service';
import { EventEvidenceCorrelationService } from '../src/services/event-evidence-correlation-service';
import { DeterministicSignalAnalysisService } from '../src/services/deterministic-signal-analysis-service';
import { AIContextBuilder } from '../src/intelligence/grounding/ai-context-builder';
import { buildGroundedAIRequest } from '../src/intelligence/grounding/grounded-ai-request';
import { InvestigationAssistantService } from '../src/intelligence/assistant/investigation-assistant-service';
import { IncidentSummarizationService } from '../src/intelligence/summarization/incident-summarization-service';
import { RootCauseAnalysisService } from '../src/intelligence/root-cause-analysis/root-cause-analysis-service';
import { AIRecommendationsService } from '../src/intelligence/recommendations/recommendation-service';
import type {
  AIProvider,
  AIProviderRequest,
  AIProviderResponse,
} from '../src/intelligence/providers/ai-provider';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://127.0.0.1:3000';
const SIMULATION_URL = 'http://127.0.0.1:4000';
const TOKEN = process.env.SENTINELAI_TOKEN ?? '';
const MODEL = 'sentinelai-demo-model';

if (!TOKEN) {
  throw new Error('SENTINELAI_TOKEN is required for Step 8.12.');
}

interface HttpResult<T = unknown> {
  status: number;
  body: T;
}

class CaptureProvider implements AIProvider {
  requests: AIProviderRequest[] = [];

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    this.requests.push(request);

    if (
      request.instructions.includes(
        'Return ONLY a valid JSON object with exactly two fields: "analysis" and "hypotheses".',
      )
    ) {
      return {
        outputText: JSON.stringify({
          analysis:
            'The supplied context indicates a concentrated checkout failure pattern associated with database dependency signals. The available evidence supports investigation of the recent database connection-pool configuration change, but does not establish causation.',
          hypotheses: [
            {
              title: 'Recent database connection-pool configuration change',
              description:
                'A recent database connection-pool configuration change is a leading hypothesis because the supplied incident context contains database dependency failures and a related configuration-change signal.',
              confidence: {
                level: 'MEDIUM',
                score: 0.7,
                rationale:
                  'The hypothesis is supported by the supplied incident context but is not confirmed as the root cause.',
              },
              supportingReferences: [],
              contradictingReferences: [],
            },
          ],
        }),
      };
    }

    if (request.instructions.includes('Return ONLY valid JSON matching the requested schema.')) {
      return {
        outputText: JSON.stringify({
          recommendations: [
            {
              priority: 'HIGH',
              title: 'Inspect the recent database connection-pool configuration change.',
              action:
                'Inspect the recent database connection-pool configuration change and collect deployment or configuration evidence before taking remediation action.',
              confidence: {
                level: 'MEDIUM',
                score: 0.7,
                rationale:
                  'The recommendation is grounded in the supplied deterministic findings and incident context.',
              },
              references: [],
            },
          ],
        }),
      };
    }

    return {
      outputText:
        'The supplied incident context indicates a concentrated checkout failure pattern associated with database dependency signals.',
    };
  }
}
async function request<T = unknown>(url: string, init: RequestInit = {}): Promise<HttpResult<T>> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
      ...(init.headers ?? {}),
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
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function logPass(message: string): void {
  console.log(`PASS: ${message}`);
}

async function waitForHealth(): Promise<void> {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const result = await request<{ status?: string }>(`${SIMULATION_URL}/health`, {
        headers: {},
      });

      if (result.status === 200 && result.body.status === 'healthy') {
        return;
      }
    } catch {
      // Retry while the demo application starts.
    }

    await sleep(500);
  }

  throw new Error('Demo application did not become healthy within the startup window.');
}

function startSimulation(): ChildProcess {
  const child = spawn(
    process.execPath,
    [path.join(REPOSITORY_ROOT, 'simulation-engine/dist/index.js')],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: '4000',
        SENTINELAI_URL: BACKEND_URL,
        SENTINELAI_TOKEN: TOKEN,
        SENTINELAI_INCIDENT_ID: DEMO_INCIDENT_ID,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(`[demo] ${chunk}`);
  });

  child.stderr?.on('data', (chunk) => {
    process.stderr.write(`[demo] ${chunk}`);
  });

  child.once('error', (error) => {
    process.stderr.write(`[demo-process-error] ${error.message}\n`);
  });

  child.once('exit', (code, signal) => {
    process.stderr.write(`[demo-process-exit] code=${code ?? 'null'} signal=${signal ?? 'null'}\n`);
  });

  return child;
}

async function stopSimulation(child: ChildProcess | null): Promise<void> {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (child.exitCode !== null) {
      return;
    }

    await sleep(100);
  }

  child.kill('SIGKILL');
}

async function main(): Promise<void> {
  let simulation: ChildProcess | null = null;

  try {
    console.log('');
    console.log('============================================================');
    console.log(' SENTINELAI — STEP 8.12 — END-TO-END INCIDENT SCENARIO');
    console.log('============================================================');

    console.log('');
    console.log('[1/12] Resetting deterministic incident scenario...');
    await initializeDemoScenario();

    const incident = await prisma.incident.findUnique({
      where: { id: DEMO_INCIDENT_ID },
      include: {
        events: { orderBy: { sequence: 'asc' } },
        evidence: { orderBy: { occurredAt: 'asc' } },
        investigation: true,
        participants: true,
      },
    });

    assert(incident, 'Demo incident was not initialized.');
    assert(incident.status === 'INVESTIGATING', 'Demo incident must start INVESTIGATING.');
    assert(incident.severity === 'HIGH', 'Demo incident must start HIGH severity.');
    assert(
      incident.participants.some(
        (participant) =>
          participant.userId === DEMO_USER_ID && participant.role === 'INCIDENT_COMMANDER',
      ),
      'Demo incident commander is missing.',
    );

    logPass(`incident initialized: ${DEMO_INCIDENT_ID}`);
    logPass(`baseline events=${incident.events.length}, evidence=${incident.evidence.length}`);

    console.log('');
    console.log('[2/12] Building simulation engine...');
    const buildExit = await new Promise<number>((resolve) => {
      if (process.platform === 'win32') {
        execFile(
          process.env.ComSpec ?? 'cmd.exe',
          ['/d', '/s', '/c', 'pnpm --filter @sentinelai/simulation-engine build'],
          {
            cwd: process.cwd(),
            windowsHide: true,
          },
          (error) => {
            resolve(typeof error?.code === 'number' ? error.code : error ? 1 : 0);
          },
        );

        return;
      }

      execFile(
        'pnpm',
        ['--filter', '@sentinelai/simulation-engine', 'build'],
        {
          cwd: process.cwd(),
        },
        (error) => {
          resolve(typeof error?.code === 'number' ? error.code : error ? 1 : 0);
        },
      );
    });
    assert(buildExit === 0, 'Simulation engine build failed.');
    logPass('simulation engine build');

    console.log('');
    console.log('[3/12] Starting controlled demo application...');
    simulation = startSimulation();
    await waitForHealth();

    const healthy = await request<{ status?: string; failureInjection?: { database?: boolean } }>(
      `${SIMULATION_URL}/health`,
      { headers: {} },
    );

    assert(healthy.status === 200, 'Demo application health endpoint failed.');
    assert(healthy.body.status === 'healthy', 'Demo application is not healthy.');
    assert(
      healthy.body.failureInjection?.database === false,
      'Database failure must start disabled.',
    );
    logPass('demo application healthy');

    console.log('');
    console.log('[4/12] Establishing healthy baseline and deployment event...');

    const checkoutHealthy = await request<{ status?: string; orderId?: string }>(
      `${SIMULATION_URL}/checkout`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );

    assert(checkoutHealthy.status === 200, 'Healthy checkout did not succeed.');
    assert(checkoutHealthy.body.status === 'success', 'Healthy checkout response was unexpected.');
    assert(Boolean(checkoutHealthy.body.orderId), 'Healthy checkout did not return an order ID.');
    logPass('healthy checkout succeeds');

    const deployment = await request<{ deployment?: { status?: string; newVersion?: string } }>(
      `${SIMULATION_URL}/demo/deployment`,
      {
        method: 'POST',
        body: JSON.stringify({
          environment: 'demo',
          previousVersion: '1.0.0',
          newVersion: '1.1.0',
          status: 'COMPLETED',
        }),
      },
    );

    assert(deployment.status === 201, 'Deployment event was not recorded.');
    assert(
      deployment.body.deployment?.status === 'COMPLETED',
      'Deployment status was not COMPLETED.',
    );
    logPass('deployment event recorded');

    console.log('');
    console.log('[5/12] Injecting controlled database failure...');

    const failure = await request<{ failureInjection?: { database?: boolean } }>(
      `${SIMULATION_URL}/demo/failure`,
      {
        method: 'POST',
        body: JSON.stringify({ enabled: true }),
      },
    );

    assert(failure.status === 200, 'Failure injection request failed.');
    assert(failure.body.failureInjection?.database === true, 'Database failure was not enabled.');
    logPass('controlled database failure enabled');

    console.log('');
    console.log('[6/12] Generating real failure telemetry...');

    const failedCheckouts: HttpResult[] = [];

    for (let index = 0; index < 3; index += 1) {
      const failedCheckout = await request(`${SIMULATION_URL}/checkout`, {
        method: 'POST',
        headers: {
          'x-request-id': `step-8-12-failure-${index + 1}`,
        },
        body: JSON.stringify({}),
      });

      failedCheckouts.push(failedCheckout);
    }

    assert(
      failedCheckouts.every((result) => result.status === 503),
      'Controlled database failure did not produce expected checkout failures.',
    );

    const failedHealth = await request<{
      status?: string;
      failureInjection?: { database?: boolean };
    }>(`${SIMULATION_URL}/health`, {
      headers: {
        'x-request-id': 'step-8-12-health-failure',
      },
    });

    assert(failedHealth.status === 503, 'Health endpoint did not expose dependency failure.');
    assert(
      failedHealth.body.status === 'unhealthy',
      'Health endpoint did not report unhealthy state.',
    );
    assert(
      failedHealth.body.failureInjection?.database === true,
      'Health endpoint lost failure state.',
    );

    const metrics = await request<string>(`${SIMULATION_URL}/metrics`, { headers: {} });

    assert(metrics.status === 200, 'Metrics endpoint failed.');
    assert(
      metrics.body.includes('sentinelai_checkout_failure_total'),
      'Checkout failure metric is missing.',
    );
    assert(
      metrics.body.includes('sentinelai_dependency_failure_total'),
      'Dependency failure metric is missing.',
    );

    logPass('real checkout failure telemetry generated');
    logPass('health dependency failure observed');
    logPass('failure metrics observed');

    console.log('');
    console.log('[7/12] Integrating application telemetry into SentinelAI...');

    const logSignals = [
      {
        source: 'sentinelai-demo-checkout',
        signalType: 'LOG',
        occurredAt: new Date().toISOString(),
        title: 'Checkout database dependency failure observed',
        description:
          'Controlled demo checkout requests failed because the database dependency was intentionally disabled.',
        sourceRef: 'step-8-12-failure-1',
        metadata: {
          service: 'sentinelai-demo',
          version: '1.1.0',
          dependency: 'postgresql',
          failureMode: 'controlled',
          scenario: 'STEP_8_12',
        },
      },
      {
        source: 'sentinelai-demo-checkout',
        signalType: 'METRIC',
        occurredAt: new Date().toISOString(),
        title: 'Checkout failure rate elevated',
        description: 'The controlled failure scenario produced repeated checkout failures.',
        sourceRef: 'step-8-12-metrics',
        metadata: {
          metric: 'sentinelai_checkout_failure_total',
          dependency: 'postgresql',
          scenario: 'STEP_8_12',
        },
      },
      {
        source: 'sentinelai-demo-deployment',
        signalType: 'DEPLOYMENT',
        occurredAt: new Date().toISOString(),
        title: 'Demo application version 1.1.0 deployed',
        description:
          'The demo application recorded a completed deployment immediately before the controlled failure.',
        sourceRef: 'step-8-12-deployment',
        metadata: {
          environment: 'demo',
          previousVersion: '1.0.0',
          newVersion: '1.1.0',
          deploymentStatus: 'COMPLETED',
          scenario: 'STEP_8_12',
        },
      },
    ];

    const integratedSignals = [];

    for (const signal of logSignals) {
      const result = await request<{
        accepted?: number;
        events?: Array<{ sequence?: number; eventType?: string }>;
      }>(`${SIMULATION_URL}/demo/integrate`, {
        method: 'POST',
        headers: {
          'x-request-id': `step-8-12-${signal.signalType.toLowerCase()}`,
        },
        body: JSON.stringify({}),
      });

      assert(result.status === 202, `${signal.signalType} demo integration endpoint failed.`);
      integratedSignals.push(result);
    }

    logPass(`demo application integrated ${integratedSignals.length} telemetry signals`);

    console.log('');
    console.log('[8/12] Integrating failure evidence into SentinelAI...');

    const evidenceResults = [];

    for (let index = 0; index < 2; index += 1) {
      const evidence = await request<{
        status?: string;
        data?: {
          id?: string;
          incidentId?: string;
          evidenceType?: string;
        };
      }>(`${SIMULATION_URL}/demo/integrate-evidence`, {
        method: 'POST',
        headers: {
          'x-request-id': `step-8-12-evidence-${index + 1}`,
        },
        body: JSON.stringify({}),
      });

      assert(evidence.status === 201, 'Demo evidence integration failed.');
      assert(Boolean(evidence.body.data?.id), 'Integrated evidence did not return an ID.');
      assert(
        evidence.body.data?.incidentId === DEMO_INCIDENT_ID,
        'Integrated evidence returned the wrong incident ID.',
      );
      assert(
        evidence.body.data?.evidenceType === 'LOG',
        'Integrated evidence returned the wrong evidence type.',
      );
      evidenceResults.push(evidence);
    }

    logPass(`failure evidence integrated: ${evidenceResults.length} items`);

    console.log('');
    console.log('[9/12] Verifying persisted incident intelligence...');

    const timeline = await request<{
      status?: string;
      data?: {
        items?: Array<{
          sequence?: number;
          eventType?: string;
          metadata?: Record<string, unknown>;
        }>;
      };
    }>(`${BACKEND_URL}/api/v1/incidents/${DEMO_INCIDENT_ID}/events`);

    assert(timeline.status === 200, 'Incident event timeline could not be retrieved.');

    const evidenceList = await request<{
      status?: string;
      data?: {
        items?: Array<{ evidenceType?: string; trustLevel?: string; source?: string | null }>;
      };
    }>(`${BACKEND_URL}/api/v1/incidents/${DEMO_INCIDENT_ID}/evidence`);

    assert(evidenceList.status === 200, 'Incident evidence list could not be retrieved.');

    const eventItems = timeline.body.data?.items ?? [];
    const evidenceItems = evidenceList.body.data?.items ?? [];

    assert(eventItems.length >= 9, 'Integrated events were not persisted.');
    assert(evidenceItems.length >= 7, 'Integrated evidence was not persisted.');

    logPass(`incident timeline contains ${eventItems.length} events`);
    logPass(`incident evidence contains ${evidenceItems.length} items`);

    console.log('');
    console.log('[10/12] Running automatic correlation and deterministic intelligence...');

    const correlation = await request<{
      status?: string;
      data?: {
        correlations?: Array<{
          type?: string;
          confidence?: string;
          description?: string;
          references?: unknown[];
        }>;
        analysis?: {
          findings?: Array<unknown>;
          hypotheses?: Array<unknown>;
        };
      };
    }>(`${BACKEND_URL}/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/correlation`);

    assert(correlation.status === 200, 'Automatic correlation endpoint failed.');

    const correlations = correlation.body.data?.correlations ?? [];
    const findings = correlation.body.data?.analysis?.findings ?? [];
    const hypotheses = correlation.body.data?.analysis?.hypotheses ?? [];

    assert(correlations.length > 0, 'No automatic correlations were generated.');
    assert(findings.length > 0, 'No deterministic findings were generated.');

    const causationBoundaryPreserved = correlations.every(
      (item) =>
        typeof item.description === 'string' &&
        item.description.toLowerCase().includes('causation'),
    );

    assert(causationBoundaryPreserved, 'Correlation/causation boundary was not preserved.');

    logPass(`automatic correlations generated: ${correlations.length}`);
    logPass(`deterministic findings generated: ${findings.length}`);
    logPass(`deterministic hypotheses generated: ${hypotheses.length}`);
    logPass('correlation/causation boundary preserved');

    console.log('');
    console.log('[11/12] Verifying grounded AI consumer pipeline...');

    const snapshot = await intelligenceContextService.buildContext(DEMO_INCIDENT_ID);

    assert(snapshot, 'Intelligence context snapshot could not be built.');

    const correlationService = new EventEvidenceCorrelationService();
    const signalAnalysisService = new DeterministicSignalAnalysisService();
    const aiContextBuilder = new AIContextBuilder();

    const generatedCorrelations = correlationService.correlate(snapshot);
    const generatedAnalysis = signalAnalysisService.analyze(snapshot, generatedCorrelations);

    const groundedContext = aiContextBuilder.build(
      snapshot,
      generatedAnalysis.findings,
      generatedCorrelations,
    );

    assert(
      groundedContext.items.some((item) => item.type === 'CORRELATION'),
      'Grounded AI context does not contain correlations.',
    );
    assert(
      groundedContext.items.some((item) => item.type === 'FINDING'),
      'Grounded AI context does not contain deterministic findings.',
    );
    assert(
      groundedContext.items.some((item) => item.type === 'EVENT'),
      'Grounded AI context does not contain events.',
    );
    assert(
      groundedContext.items.some((item) => item.type === 'EVIDENCE'),
      'Grounded AI context does not contain evidence.',
    );

    const capture = new CaptureProvider();

    const assistant = new InvestigationAssistantService(capture, aiContextBuilder);
    await assistant.answer(
      {
        incidentId: DEMO_INCIDENT_ID,
        question: 'What evidence should the incident commander investigate first?',
        intent: 'INVESTIGATION',
        model: MODEL,
      },
      snapshot,
      generatedAnalysis.findings,
      generatedCorrelations,
    );

    const summarization = new IncidentSummarizationService(capture, aiContextBuilder);
    await summarization.summarize(
      {
        incidentId: DEMO_INCIDENT_ID,
        mode: 'EXECUTIVE',
        model: MODEL,
      },
      snapshot,
      generatedAnalysis.findings,
      generatedCorrelations,
    );

    const rca = new RootCauseAnalysisService(capture, aiContextBuilder);
    await rca.analyze(
      {
        incidentId: DEMO_INCIDENT_ID,
        mode: 'PRIMARY',
        model: MODEL,
      },
      snapshot,
      generatedAnalysis.findings,
      generatedCorrelations,
    );

    const recommendations = new AIRecommendationsService(capture, aiContextBuilder);
    await recommendations.analyze(
      {
        snapshot,
        findings: generatedAnalysis.findings,
        hypotheses: generatedAnalysis.hypotheses,
        correlations: generatedCorrelations,
      },
      {
        incidentId: DEMO_INCIDENT_ID,
        model: MODEL,
      },
    );

    assert(capture.requests.length === 4, 'Expected four actual AI consumer provider requests.');

    for (const [index, providerRequest] of capture.requests.entries()) {
      assert(
        providerRequest.input.includes('CORRELATION:'),
        `AI consumer ${index + 1} did not receive correlation context.`,
      );
      assert(
        providerRequest.input.includes('FINDING:'),
        `AI consumer ${index + 1} did not receive finding context.`,
      );
      assert(
        providerRequest.input.includes('EVENT:'),
        `AI consumer ${index + 1} did not receive event context.`,
      );
      assert(
        providerRequest.input.includes('EVIDENCE:'),
        `AI consumer ${index + 1} did not receive evidence context.`,
      );
      assert(
        providerRequest.input.includes('Confidence:'),
        `AI consumer ${index + 1} did not receive correlation confidence.`,
      );
      assert(
        providerRequest.input.includes('References:'),
        `AI consumer ${index + 1} did not receive correlation references.`,
      );
      assert(
        providerRequest.input.toLowerCase().includes('causation'),
        `AI consumer ${index + 1} lost the causation boundary.`,
      );
      assert(
        providerRequest.input.includes('UNTRUSTED INCIDENT CONTEXT'),
        `AI consumer ${index + 1} lost the untrusted-context security boundary.`,
      );
    }

    logPass('four actual AI consumers received grounded correlations');
    logPass('deterministic findings remained grounded');
    logPass('events and evidence remained grounded');
    logPass('correlation confidence and references remained grounded');
    logPass('untrusted-context security boundary preserved');

    console.log('');
    console.log('[12/12] Disabling failure and verifying recovery...');

    const recovery = await request<{ failureInjection?: { database?: boolean } }>(
      `${SIMULATION_URL}/demo/failure`,
      {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
      },
    );

    assert(recovery.status === 200, 'Failure recovery request failed.');
    assert(
      recovery.body.failureInjection?.database === false,
      'Database failure remained enabled.',
    );

    const recoveredHealth = await request<{ status?: string }>(`${SIMULATION_URL}/health`, {
      headers: {
        'x-request-id': 'step-8-12-recovery-health',
      },
    });

    assert(recoveredHealth.status === 200, 'Health did not recover after disabling failure.');
    assert(
      recoveredHealth.body.status === 'healthy',
      'Application did not report healthy after recovery.',
    );

    const recoveredCheckout = await request<{ status?: string; orderId?: string }>(
      `${SIMULATION_URL}/checkout`,
      {
        method: 'POST',
        headers: {
          'x-request-id': 'step-8-12-recovery-checkout',
        },
        body: JSON.stringify({}),
      },
    );

    assert(recoveredCheckout.status === 200, 'Checkout did not recover after disabling failure.');
    assert(recoveredCheckout.body.status === 'success', 'Recovered checkout was not successful.');
    assert(
      Boolean(recoveredCheckout.body.orderId),
      'Recovered checkout did not return an order ID.',
    );

    logPass('database failure disabled');
    logPass('health recovered');
    logPass('checkout recovered');

    console.log('');
    console.log('============================================================');
    console.log(' STEP 8.12 END-TO-END INCIDENT SCENARIO PASSED');
    console.log('============================================================');
    console.log('');
    console.log(`Incident: ${DEMO_INCIDENT_ID}`);
    console.log(`Baseline events: ${incident.events.length}`);
    console.log(`Final events: ${eventItems.length}`);
    console.log(`Final evidence: ${evidenceItems.length}`);
    console.log(`Correlations: ${correlations.length}`);
    console.log(`Findings: ${findings.length}`);
    console.log(`AI provider requests verified: ${capture.requests.length}`);
    console.log('Failure injection: recovered');
    console.log('Application health: healthy');
    console.log('Checkout: successful');
    console.log('');
  } finally {
    await stopSimulation(simulation);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('');
  console.error('============================================================');
  console.error(' STEP 8.12 END-TO-END INCIDENT SCENARIO FAILED');
  console.error('============================================================');
  console.error('');
  console.error(error);
  process.exitCode = 1;
});
