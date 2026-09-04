import assert from 'node:assert/strict';

import {
  AIContextBuilder,
  FakeAIProvider,
  RootCauseAnalysisService,
} from '../src/intelligence';

const incident = {
  id: 'incident-4-11',
  title: 'Checkout latency incident',
  description: 'Checkout latency increased after a deployment.',
  severity: 'HIGH' as const,
  status: 'INVESTIGATING' as const,
  priority: 'HIGH' as const,
  startedAt: new Date('2026-09-04T01:00:00.000Z'),
  resolvedAt: null,
  closedAt: null,
  createdAt: new Date('2026-09-04T01:00:00.000Z'),
  updatedAt: new Date('2026-09-04T01:20:00.000Z'),
};

const events = [
  {
    id: 'event-1',
    incidentId: incident.id,
    eventType: 'DEPLOYMENT' as const,
    occurredAt: '2026-09-04T01:05:00.000Z',
    sequence: 1,
    title: 'Checkout deployment',
    description: 'Checkout service version 42 deployed.',
    source: 'deployment-system',
    metadata: {},
    createdAt: '2026-09-04T01:05:00.000Z',
  },
  {
    id: 'event-2',
    incidentId: incident.id,
    eventType: 'ALERT' as const,
    occurredAt: '2026-09-04T01:07:00.000Z',
    sequence: 2,
    title: 'Latency alert',
    description: 'Checkout latency exceeded threshold.',
    source: 'monitoring',
    metadata: {},
    createdAt: '2026-09-04T01:07:00.000Z',
  },
];

const evidence = [
  {
    id: 'evidence-1',
    incidentId: incident.id,
    evidenceType: 'LOG' as const,
    title: 'Database timeout logs',
    description: 'Database timeout messages observed during the incident.',
    source: 'checkout-logs',
    sourceRef: 'checkout-service',
    collectedAt: '2026-09-04T01:10:00.000Z',
    occurredAt: '2026-09-04T01:08:00.000Z',
    contentHash: 'hash-1',
    trustLevel: 'MEDIUM' as const,
    metadata: {},
    createdAt: '2026-09-04T01:10:00.000Z',
    updatedAt: '2026-09-04T01:10:00.000Z',
  },
];

const investigation = {
  id: 'investigation-1',
  incidentId: incident.id,
  summary: 'Investigating deployment and database behavior.',
  startedAt: '2026-09-04T01:10:00.000Z',
  completedAt: null,
  createdAt: '2026-09-04T01:10:00.000Z',
  updatedAt: '2026-09-04T01:10:00.000Z',
};

const findings = [
  {
    id: 'finding-1',
    type: 'CORRELATION' as const,
    title: 'Deployment and latency alert are temporally correlated',
    description:
      'The deployment occurred shortly before the latency alert.',
    confidence: {
      level: 'MEDIUM' as const,
      rationale: 'Deterministic temporal relationship.',
    },
    references: [
      {
        type: 'EVENT' as const,
        id: 'event-1',
        reason: 'Deployment event.',
      },
      {
        type: 'EVENT' as const,
        id: 'event-2',
        reason: 'Latency alert event.',
      },
    ],
  },
];

const snapshot = {
  context: {
    incident,
    events,
    evidence,
    investigation,
  },
  metadata: {
    generatedAt: '2026-09-04T01:20:00.000Z',
    eventCount: events.length,
    evidenceCount: evidence.length,
    hasInvestigation: true,
  },
};

const structuredOutput = JSON.stringify({
  analysis:
    'The deployment is a plausible contributor to checkout latency, but the available database timeout evidence means causation remains unconfirmed.',
  hypotheses: [
    {
      title: 'Deployment may have contributed to checkout latency',
      description:
        'The deployment preceded the latency alert, while database timeout logs provide additional evidence requiring investigation.',
      confidence: {
        level: 'MEDIUM',
        score: 0.68,
        rationale:
          'Temporal ordering and supporting evidence exist, but causation is not established.',
      },
      supportingReferences: [
        {
          type: 'EVENT',
          id: 'event-1',
          reason: 'Deployment occurred before the latency alert.',
        },
        {
          type: 'EVIDENCE',
          id: 'evidence-1',
          reason: 'Database timeout logs were observed during the incident.',
        },
        {
          type: 'EVENT',
          id: 'event-1',
          reason: 'Duplicate reference normalization test.',
        },
      ],
      contradictingReferences: [
        {
          type: 'EVENT',
          id: 'event-2',
          reason: 'The alert itself does not establish the deployment as causal.',
        },
      ],
    },
  ],
});

async function main() {
  const provider = new FakeAIProvider(structuredOutput);
  const service = new RootCauseAnalysisService(
    provider,
    new AIContextBuilder(),
  );

  const originalSnapshot = structuredClone(snapshot);

  const result = await service.analyze(
    {
      incidentId: incident.id,
      mode: 'PRIMARY',
      model: 'fake-4-11',
    },
    snapshot,
    findings,
  );

  assert.equal(result.incidentId, incident.id);
  assert.equal(result.mode, 'PRIMARY');
  assert.equal(result.provider, 'fake');
  assert.equal(result.model, 'fake-4-11');

  assert.equal(result.hypotheses.length, 1);

  const hypothesis = result.hypotheses[0];

  assert.ok(hypothesis);
  assert.match(
    hypothesis.id,
    /^hypothesis-[a-f0-9]{24}$/,
  );

  assert.equal(
    hypothesis.title,
    'Deployment may have contributed to checkout latency',
  );

  assert.equal(
    hypothesis.confidence.level,
    'MEDIUM',
  );

  assert.equal(
    hypothesis.confidence.score,
    0.68,
  );

  assert.equal(
    hypothesis.supportingReferences.length,
    2,
  );

  assert.deepEqual(
    hypothesis.supportingReferences.map(
      (reference) => `${reference.type}:${reference.id}`,
    ),
    [
      'EVENT:event-1',
      'EVIDENCE:evidence-1',
    ],
  );

  assert.equal(
    hypothesis.contradictingReferences.length,
    1,
  );

  assert.ok(
    result.analysis.includes('causation remains unconfirmed'),
  );

  assert.equal(
    result.limitations.length,
    5,
  );

  assert.ok(
    result.limitations.some(
      (limitation) =>
        limitation.includes('not a confirmed root cause'),
    ),
  );

  assert.deepEqual(snapshot, originalSnapshot);

  await assert.rejects(
    service.analyze(
      {
        incidentId: 'wrong-incident',
        mode: 'PRIMARY',
        model: 'fake-4-11',
      },
      snapshot,
      findings,
    ),
    /RCA incident ID does not match intelligence context/,
  );

  await assert.rejects(
    service.analyze(
      {
        incidentId: incident.id,
        mode: 'PRIMARY',
        model: '   ',
      },
      snapshot,
      findings,
    ),
    /RCA model is required/,
  );

  const malformedProvider = new FakeAIProvider(
    '{"analysis":"broken","hypotheses":[{"title":"invalid"}]}',
  );

  const malformedService = new RootCauseAnalysisService(
    malformedProvider,
    new AIContextBuilder(),
  );

  await assert.rejects(
    malformedService.analyze(
      {
        incidentId: incident.id,
        mode: 'PRIMARY',
        model: 'fake-4-11',
      },
      snapshot,
      findings,
    ),
    /structured output that failed validation/,
  );

  const hallucinatedReferenceProvider = new FakeAIProvider(
    JSON.stringify({
      analysis: 'Candidate hypothesis with an invalid reference.',
      hypotheses: [
        {
          title: 'Unsupported hypothesis',
          description: 'This reference does not exist in the context.',
          confidence: {
            level: 'LOW',
            rationale: 'Insufficient evidence.',
          },
          supportingReferences: [
            {
              type: 'EVENT',
              id: 'hallucinated-event',
              reason: 'This reference is not grounded.',
            },
          ],
          contradictingReferences: [],
        },
      ],
    }),
  );

  const hallucinatedReferenceService =
    new RootCauseAnalysisService(
      hallucinatedReferenceProvider,
      new AIContextBuilder(),
    );

  await assert.rejects(
    hallucinatedReferenceService.analyze(
      {
        incidentId: incident.id,
        mode: 'PRIMARY',
        model: 'fake-4-11',
      },
      snapshot,
      findings,
    ),
    /outside the grounded context/,
  );

  console.log(
    'AI ROOT CAUSE ANALYSIS TEST: PASS',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
