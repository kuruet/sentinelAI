import { FakeAIProvider } from '../src/intelligence/providers';

import { AIContextBuilder } from '../src/intelligence/grounding';

import { IncidentSummarizationService } from '../src/intelligence/summarization';

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
        id: 'incident-4-10',
        title: 'Checkout latency incident',
        description: 'Checkout latency increased after deployment.',
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
          id: 'event-4-10-1',
          incidentId: 'incident-4-10',
          eventType: 'DEPLOYMENT',
          occurredAt: '2026-09-04T05:01:00.000Z',
          sequence: 1,
          title: 'Checkout deployment',
          description: 'Version 2026.09.04 deployed.',
          source: 'deploy',
          metadata: {},
          createdAt: '2026-09-04T05:01:01.000Z',
        },
        {
          id: 'event-4-10-2',
          incidentId: 'incident-4-10',
          eventType: 'ALERT',
          occurredAt: '2026-09-04T05:04:00.000Z',
          sequence: 2,
          title: 'Checkout latency alert',
          description: 'Latency threshold exceeded.',
          source: 'monitoring',
          metadata: {},
          createdAt: '2026-09-04T05:04:01.000Z',
        },
      ],
      evidence: [
        {
          id: 'evidence-4-10-1',
          incidentId: 'incident-4-10',
          evidenceType: 'LOG',
          title: 'Checkout logs',
          description: 'Database timeout messages observed.',
          source: 'checkout-api',
          sourceRef: 'logs/checkout',
          collectedAt: '2026-09-04T05:03:00.000Z',
          occurredAt: '2026-09-04T05:02:00.000Z',
          contentHash: 'hash-4-10',
          trustLevel: 'UNVERIFIED',
          metadata: {},
          createdAt: '2026-09-04T05:03:01.000Z',
          updatedAt: '2026-09-04T05:03:01.000Z',
        },
      ],
      investigation: {
        id: 'investigation-4-10',
        incidentId: 'incident-4-10',
        summary: 'Investigating deployment and database impact.',
        startedAt: '2026-09-04T05:05:00.000Z',
        completedAt: null,
        createdAt: '2026-09-04T05:05:00.000Z',
        updatedAt: '2026-09-04T05:05:00.000Z',
      },
    },
    metadata: {
      generatedAt: '2026-09-04T05:05:00.000Z',
      eventCount: 2,
      evidenceCount: 1,
      hasInvestigation: true,
    },
  };
}

function makeFinding(): IntelligenceFinding {
  return {
    id: 'finding-4-10-1',
    type: 'CORRELATION',
    title: 'Deployment precedes database timeouts',
    description: 'The deployment occurred before timeout evidence appeared.',
    confidence: {
      level: 'MEDIUM',
      rationale: 'Temporal relationship only.',
    },
    references: [
      {
        type: 'EVENT',
        id: 'event-4-10-1',
        reason: 'Deployment occurred immediately before the observed issue.',
      },
      {
        type: 'EVIDENCE',
        id: 'evidence-4-10-1',
        reason: 'Timeout messages were observed.',
      },
    ],
  };
}

async function main(): Promise<void> {
  const provider = new FakeAIProvider(
    'The incident remains under investigation. A deployment preceded database timeout evidence and a latency alert. This is a temporal relationship, not proof of causation.',
  );

  const service = new IncidentSummarizationService(
    provider,
    new AIContextBuilder({
      maxEvents: 10,
      maxEvidence: 10,
      maxFindings: 10,
      maxContentLength: 1000,
    }),
  );

  const snapshot = makeSnapshot();
  const findings = [makeFinding()];

  const request = {
    incidentId: 'incident-4-10',
    mode: 'INVESTIGATION' as const,
    model: 'test-model',
  };

  const before = JSON.stringify(snapshot);

  const result = await service.summarize(request, snapshot, findings);

  assert(result.incidentId === 'incident-4-10', 'Summary must preserve incident identity.');

  assert(result.mode === 'INVESTIGATION', 'Summary must preserve requested mode.');

  assert(result.summary.includes('database timeout'), 'Summary must contain provider output.');

  assert(result.provider === 'fake', 'Summary must expose provider identity.');

  assert(result.model === 'test-model', 'Summary must expose model identity.');

  assert(
    result.references.some((item) => item.type === 'EVENT' && item.id === 'event-4-10-1'),
    'Summary must preserve event provenance.',
  );

  assert(
    result.references.some((item) => item.type === 'EVIDENCE' && item.id === 'evidence-4-10-1'),
    'Summary must preserve evidence provenance.',
  );

  assert(
    result.references.some((item) => item.type === 'FINDING' && item.id === 'finding-4-10-1'),
    'Summary must preserve finding provenance.',
  );

  assert(result.limitations.length >= 4, 'Summary must expose advisory limitations.');

  let mismatchRejected = false;

  try {
    await service.summarize(
      {
        ...request,
        incidentId: 'wrong-incident',
      },
      snapshot,
      findings,
    );
  } catch {
    mismatchRejected = true;
  }

  assert(mismatchRejected, 'Mismatched incident context must be rejected.');

  const after = JSON.stringify(snapshot);

  assert(before === after, 'Summarization must not mutate source context.');

  console.log('STEP 4.10 AI INCIDENT SUMMARIZATION TEST: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
