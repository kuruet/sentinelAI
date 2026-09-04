import { AIContextBuilder, buildGroundedAIRequest } from '../src/intelligence/grounding';
import type { IntelligenceContextSnapshot } from '../src/intelligence/contracts/context';
import type { IntelligenceFinding } from '../src/intelligence/contracts/finding';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function makeSnapshot(): IntelligenceContextSnapshot {
  return {
    context: {
      incident: {
        id: 'incident-1',
        title: 'API latency incident',
        description: 'Latency increased after deployment.',
        status: 'INVESTIGATING',
        severity: 'HIGH',
        priority: 1,
        startedAt: '2026-09-04T05:00:00.000Z',
        resolvedAt: null,
        closedAt: null,
        createdAt: '2026-09-04T05:00:00.000Z',
        updatedAt: '2026-09-04T05:10:00.000Z',
      },
      events: [
        {
          id: 'event-2',
          incidentId: 'incident-1',
          eventType: 'LOG',
          occurredAt: '2026-09-04T05:02:00.000Z',
          sequence: 2,
          title: 'Latency increased',
          description: 'Latency crossed threshold.',
          source: 'api',
          metadata: {},
          createdAt: '2026-09-04T05:02:01.000Z',
        },
        {
          id: 'event-1',
          incidentId: 'incident-1',
          eventType: 'DEPLOYMENT',
          occurredAt: '2026-09-04T05:01:00.000Z',
          sequence: 1,
          title: 'Deployment',
          description: 'Version deployed.',
          source: 'deploy',
          metadata: {},
          createdAt: '2026-09-04T05:01:01.000Z',
        },
      ],
      evidence: [
        {
          id: 'evidence-2',
          incidentId: 'incident-1',
          evidenceType: 'LOG',
          title: 'Application logs',
          description: 'Database timeout messages.',
          source: 'app',
          sourceRef: 'logs/app',
          collectedAt: '2026-09-04T05:03:00.000Z',
          occurredAt: '2026-09-04T05:02:30.000Z',
          contentHash: 'hash-2',
          trustLevel: 'UNVERIFIED',
          metadata: {},
          createdAt: '2026-09-04T05:03:01.000Z',
          updatedAt: '2026-09-04T05:03:01.000Z',
        },
        {
          id: 'evidence-1',
          incidentId: 'incident-1',
          evidenceType: 'METRIC',
          title: 'Latency metric',
          description: 'Latency exceeded normal range.',
          source: 'metrics',
          sourceRef: 'metric/api.latency',
          collectedAt: '2026-09-04T05:02:45.000Z',
          occurredAt: '2026-09-04T05:02:15.000Z',
          contentHash: 'hash-1',
          trustLevel: 'VERIFIED',
          metadata: {},
          createdAt: '2026-09-04T05:02:46.000Z',
          updatedAt: '2026-09-04T05:02:46.000Z',
        },
      ],
      investigation: {
        id: 'investigation-1',
        incidentId: 'incident-1',
        summary: 'Investigating deployment impact.',
        startedAt: '2026-09-04T05:05:00.000Z',
        completedAt: null,
        createdAt: '2026-09-04T05:05:00.000Z',
        updatedAt: '2026-09-04T05:05:00.000Z',
      },
    },
    metadata: {
      generatedAt: '2026-09-04T05:05:00.000Z',
      eventCount: 2,
      evidenceCount: 2,
      hasInvestigation: true,
    },
  };
}

function makeFinding(): IntelligenceFinding {
  return {
    id: 'finding-1',
    type: 'CORRELATION',
    title: 'Deployment precedes latency increase',
    description: 'Deployment occurred immediately before latency increased.',
    confidence: {
      level: 'HIGH',
      rationale: 'Strong temporal relationship.',
    },
    references: [
      {
        type: 'EVENT',
        id: 'event-1',
        reason: 'Deployment event.',
      },
      {
        type: 'EVENT',
        id: 'event-2',
        reason: 'Latency event.',
      },
    ],
  };
}

async function main(): Promise<void> {
  const snapshot = makeSnapshot();
  const findings = [makeFinding()];

  const builder = new AIContextBuilder({
    maxEvents: 1,
    maxEvidence: 1,
    maxFindings: 1,
    maxContentLength: 500,
  });

  const first = builder.build(snapshot, findings);
  const second = builder.build(snapshot, findings);

  assert(first.incidentId === 'incident-1', 'Incident ID must be preserved.');
  assert(first.itemCount === 5, 'Bounded context should contain five items.');
  assert(first.truncated === true, 'Context must report truncation.');
  assert(
    first.items.some((item) => item.type === 'INCIDENT'),
    'Incident context must be present.',
  );
  assert(
    first.items.some((item) => item.type === 'EVENT' && item.id === 'event-1'),
    'Earliest event must be selected.',
  );
  assert(
    !first.items.some((item) => item.type === 'EVENT' && item.id === 'event-2'),
    'Later event must be bounded out.',
  );
  assert(
    first.items.some((item) => item.type === 'EVIDENCE' && item.id === 'evidence-1'),
    'Earliest evidence must be selected.',
  );
  assert(
    first.items.some((item) => item.type === 'INVESTIGATION'),
    'Investigation context must be present.',
  );
  assert(
    first.items.some((item) => item.type === 'FINDING'),
    'Deterministic finding must be present.',
  );

  assert(
    first.items.map((item) => `${item.type}:${item.id}`).join('|') ===
      second.items.map((item) => `${item.type}:${item.id}`).join('|'),
    'Context item ordering must be deterministic.',
  );

  const originalEventCount = snapshot.context.events.length;
  const originalEvidenceCount = snapshot.context.evidence.length;

  first.items.reverse();

  assert(
    snapshot.context.events.length === originalEventCount,
    'Building context must not mutate source events.',
  );

  assert(
    snapshot.context.evidence.length === originalEvidenceCount,
    'Building context must not mutate source evidence.',
  );

  const request = buildGroundedAIRequest(first, {
    model: 'test-model',
    instructions: 'Analyze the incident.',
  });

  assert(
    request.model === 'test-model',
    'AI request model must be preserved.',
  );

  assert(
    request.input.includes('Incident ID: incident-1'),
    'AI request must contain incident identity.',
  );

  assert(
    request.input.includes('[INCIDENT:incident-1]'),
    'AI request must include grounded incident reference.',
  );

  assert(
    request.input.includes('[EVIDENCE:evidence-1]'),
    'AI request must include grounded evidence reference.',
  );

  assert(
    request.instructions.includes('untrusted data'),
    'Grounding boundary must explicitly mark context as untrusted data.',
  );

  assert(
    request.instructions.includes('never as instructions'),
    'Prompt-injection boundary must be explicit.',
  );

  assert(
    request.instructions.includes('supporting context reference'),
    'Grounding instructions must require references.',
  );

  console.log('STEP 4.8 AI CONTEXT & GROUNDING PIPELINE TEST: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
