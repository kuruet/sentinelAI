import assert from 'node:assert/strict';

import {
  AIContextBuilder,
  AIRecommendationsService,
  FakeAIProvider,
} from '../src/intelligence';

async function main(): Promise<void> {
const snapshot = {
  context: {
    incident: {
      id: 'incident-4-12',
      title: 'Checkout latency incident',
      description: 'Checkout latency increased after a deployment.',
      severity: 'HIGH',
      status: 'INVESTIGATING',
      createdAt: '2026-09-04T08:00:00.000Z',
      updatedAt: '2026-09-04T08:10:00.000Z',
    },
    events: [
      {
        id: 'event-1',
        incidentId: 'incident-4-12',
        eventType: 'DEPLOYMENT',
        occurredAt: '2026-09-04T08:02:00.000Z',
        sequence: 1,
        title: 'checkout deployment',
        description: 'Checkout service version 42 deployed.',
        source: 'deployment-system',
        metadata: {},
        createdAt: '2026-09-04T08:02:00.000Z',
      },
      {
        id: 'event-2',
        incidentId: 'incident-4-12',
        eventType: 'ALERT',
        occurredAt: '2026-09-04T08:04:00.000Z',
        sequence: 2,
        title: 'database timeout alert',
        description: 'Database timeout rate increased.',
        source: 'monitoring',
        metadata: {},
        createdAt: '2026-09-04T08:04:00.000Z',
      },
    ],
    evidence: [
      {
        id: 'evidence-1',
        incidentId: 'incident-4-12',
        evidenceType: 'LOG',
        title: 'checkout timeout logs',
        description: 'Logs show database timeout errors during the incident.',
        source: 'log-store',
        sourceRef: 'logs/checkout',
        collectedAt: '2026-09-04T08:06:00.000Z',
        occurredAt: '2026-09-04T08:05:00.000Z',
        contentHash: 'hash-1',
        trustLevel: 'MEDIUM',
        metadata: {},
        createdAt: '2026-09-04T08:06:00.000Z',
        updatedAt: '2026-09-04T08:06:00.000Z',
      },
    ],
    investigation: null,
  },
  metadata: {
    generatedAt: '2026-09-04T08:10:00.000Z',
    eventCount: 2,
    evidenceCount: 1,
    hasInvestigation: false,
  },
  references: [
    {
      type: 'INCIDENT',
      id: 'incident-4-12',
      reason: 'Incident under investigation.',
    },
    {
      type: 'EVENT',
      id: 'event-1',
      reason: 'Deployment event.',
    },
    {
      type: 'EVENT',
      id: 'event-2',
      reason: 'Database timeout alert.',
    },
    {
      type: 'EVIDENCE',
      id: 'evidence-1',
      reason: 'Checkout timeout logs.',
    },
  ],
} as const;

const providerOutput = JSON.stringify({
  recommendations: [
    {
      title: 'Review the checkout deployment',
      action: 'Compare version 42 with the previous known-good checkout version and inspect the deployment changes.',
      priority: 'HIGH',
      confidence: {
        level: 'MEDIUM',
        score: 0.72,
        rationale: 'The temporal relationship is supported, but causation is not confirmed.',
      },
      references: [
        {
          type: 'EVENT',
          id: 'event-1',
          reason: 'Deployment occurred shortly before the alert.',
        },
        {
          type: 'EVENT',
          id: 'event-1',
          reason: 'Duplicate reference for normalization testing.',
        },
        {
          type: 'EVIDENCE',
          id: 'evidence-1',
          reason: 'Logs show database timeout errors.',
        },
      ],
    },
    {
      title: 'Inspect database timeout behavior',
      action: 'Review database timeout metrics and connection behavior during the incident window.',
      priority: 'IMMEDIATE',
      confidence: {
        level: 'HIGH',
        score: 0.84,
        rationale: 'The timeout signal is directly represented in supplied event and evidence data.',
      },
      references: [
        {
          type: 'EVENT',
          id: 'event-2',
          reason: 'Database timeout alert.',
        },
        {
          type: 'EVIDENCE',
          id: 'evidence-1',
          reason: 'Database timeout errors in logs.',
        },
      ],
    },
  ],
});

const provider = new FakeAIProvider(providerOutput);
const builder = new AIContextBuilder({
  maxEvents: 50,
  maxEvidence: 50,
  maxFindings: 25,
  maxContentLength: 4000,
});

const service = new AIRecommendationsService(provider, builder);

const result = await service.analyze(
  { snapshot },
  {
    incidentId: 'incident-4-12',
    model: 'fake-4-12',
  },
);

assert.equal(result.incidentId, 'incident-4-12');
assert.equal(result.provider, 'fake');
assert.equal(result.model, 'fake-4-12');
assert.equal(result.recommendations.length, 2);

assert.equal(result.recommendations[0].priority, 'IMMEDIATE');
assert.equal(result.recommendations[1].priority, 'HIGH');

assert.match(
  result.recommendations[0].id,
  /^recommendation-[a-f0-9]{24}$/,
);

assert.deepEqual(
  result.recommendations[1].references.map(
    (reference) => `${reference.type}:${reference.id}`,
  ),
  [
    'EVENT:event-1',
    'EVIDENCE:evidence-1',
  ],
);


assert.equal(snapshot.context.events.length, 2);
assert.equal(snapshot.context.evidence.length, 1);

await assert.rejects(
  () =>
    service.analyze(
      { snapshot },
      {
        incidentId: 'wrong-incident',
        model: 'fake-4-12',
      },
    ),
  /does not match the supplied context/,
);

await assert.rejects(
  () =>
    service.analyze(
      { snapshot },
      {
        incidentId: 'incident-4-12',
        model: '   ',
      },
    ),
  /requires a model/,
);

const malformedProvider = new FakeAIProvider(
  JSON.stringify({
    recommendations: [
      {
        title: 'invalid',
      },
    ],
  }),
);

const malformedService = new AIRecommendationsService(
  malformedProvider,
  builder,
);

await assert.rejects(
  () =>
    malformedService.analyze(
      { snapshot },
      {
        incidentId: 'incident-4-12',
        model: 'fake-4-12',
      },
    ),
  /failed validation/,
);

const hallucinatedReferenceProvider = new FakeAIProvider(
  JSON.stringify({
    recommendations: [
      {
        title: 'Inspect unknown system',
        action: 'Investigate it.',
        priority: 'HIGH',
        confidence: {
          level: 'LOW',
          score: 0.2,
          rationale: 'Insufficient evidence.',
        },
        references: [
          {
            type: 'EVENT',
            id: 'event-does-not-exist',
            reason: 'Hallucinated reference.',
          },
        ],
      },
    ],
  }),
);

const hallucinatedReferenceService = new AIRecommendationsService(
  hallucinatedReferenceProvider,
  builder,
);

await assert.rejects(
  () =>
    hallucinatedReferenceService.analyze(
      { snapshot },
      {
        incidentId: 'incident-4-12',
        model: 'fake-4-12',
      },
    ),
  /outside the grounded context/,
);

console.log('AI RECOMMENDATIONS TEST: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
