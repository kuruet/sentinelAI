import { FakeAIProvider } from '../src/intelligence/providers';

import { AIContextBuilder } from '../src/intelligence/grounding';

import { InvestigationAssistantService } from '../src/intelligence/assistant';

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
        id: 'incident-4-9',
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
          id: 'event-4-9-1',
          incidentId: 'incident-4-9',
          eventType: 'DEPLOYMENT',
          occurredAt: '2026-09-04T05:01:00.000Z',
          sequence: 1,
          title: 'Checkout deployment',
          description: 'Version 2026.09.04 deployed.',
          source: 'deploy',
          metadata: {},
          createdAt: '2026-09-04T05:01:01.000Z',
        },
      ],
      evidence: [
        {
          id: 'evidence-4-9-1',
          incidentId: 'incident-4-9',
          evidenceType: 'LOG',
          title: 'Checkout logs',
          description: 'Database timeout messages observed.',
          source: 'checkout-api',
          sourceRef: 'logs/checkout',
          collectedAt: '2026-09-04T05:03:00.000Z',
          occurredAt: '2026-09-04T05:02:00.000Z',
          contentHash: 'hash-4-9',
          trustLevel: 'UNVERIFIED',
          metadata: {},
          createdAt: '2026-09-04T05:03:01.000Z',
          updatedAt: '2026-09-04T05:03:01.000Z',
        },
      ],
      investigation: {
        id: 'investigation-4-9',
        incidentId: 'incident-4-9',
        summary: 'Investigating deployment and database impact.',
        startedAt: '2026-09-04T05:05:00.000Z',
        completedAt: null,
        createdAt: '2026-09-04T05:05:00.000Z',
        updatedAt: '2026-09-04T05:05:00.000Z',
      },
    },
    metadata: {
      generatedAt: '2026-09-04T05:05:00.000Z',
      eventCount: 1,
      evidenceCount: 1,
      hasInvestigation: true,
    },
  };
}

function makeFinding(): IntelligenceFinding {
  return {
    id: 'finding-4-9-1',
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
        id: 'event-4-9-1',
        reason: 'Deployment occurred immediately before the observed issue.',
      },
      {
        type: 'EVIDENCE',
        id: 'evidence-4-9-1',
        reason: 'Timeout messages were observed.',
      },
    ],
  };
}

async function main(): Promise<void> {
  const provider = new FakeAIProvider(
    'The supplied evidence shows database timeout messages after the deployment. This supports further investigation but does not establish causation.',
  );

  const service = new InvestigationAssistantService(
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
    incidentId: 'incident-4-9',
    question: 'What should I investigate next?',
    intent: 'NEXT_INVESTIGATION_STEP' as const,
    model: 'test-model',
  };

  const result = await service.answer(request, snapshot, findings);

  assert(result.incidentId === 'incident-4-9', 'Response must preserve incident identity.');

  assert(
    result.answer.includes('database timeout'),
    'Assistant response must contain provider output.',
  );

  assert(result.provider === 'fake', 'Response must expose provider identity.');

  assert(result.model === 'test-model', 'Response must expose model identity.');

  assert(
    result.references.some((item) => item.type === 'EVIDENCE' && item.id === 'evidence-4-9-1'),
    'Response must preserve evidence provenance.',
  );

  assert(
    result.references.some((item) => item.type === 'FINDING' && item.id === 'finding-4-9-1'),
    'Response must preserve finding provenance.',
  );

  assert(result.limitations.length >= 3, 'Assistant response must expose advisory limitations.');

  let mismatchRejected = false;

  try {
    await service.answer(
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

  let emptyQuestionRejected = false;

  try {
    await service.answer(
      {
        ...request,
        question: '   ',
      },
      snapshot,
      findings,
    );
  } catch {
    emptyQuestionRejected = true;
  }

  assert(emptyQuestionRejected, 'Empty investigator questions must be rejected.');

  const before = JSON.stringify(snapshot);

  await service.answer(request, snapshot, findings);

  const after = JSON.stringify(snapshot);

  assert(before === after, 'Assistant execution must not mutate source context.');

  const intelligenceIndexPath = new URL('../src/intelligence/index.ts', import.meta.url);

  const { readFile } = await import('node:fs/promises');

  const intelligenceIndex = await readFile(intelligenceIndexPath, 'utf8');

  assert(
    intelligenceIndex.includes("export * from './assistant';"),
    'AI assistant must be exported from the intelligence index.',
  );
  console.log('STEP 4.9 AI INVESTIGATION ASSISTANT TEST: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
