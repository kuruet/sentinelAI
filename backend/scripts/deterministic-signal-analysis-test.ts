import assert from 'node:assert/strict';

import {
  DeterministicSignalAnalysisService,
} from '../src/services/deterministic-signal-analysis-service';

import type {
  EvidenceResponse,
  IncidentEventResponse,
} from '../src/contracts';

import type {
  IntelligenceContextSnapshot,
  IntelligenceCorrelation,
} from '../src/intelligence';

const incident = {
  id: 'incident-1',
  title: 'Deterministic analysis test',
  description: 'Synthetic incident.',
  status: 'INVESTIGATING' as const,
  severity: 'HIGH' as const,
  priority: 1,
  startedAt: '2026-09-04T10:00:00.000Z',
  resolvedAt: null,
  closedAt: null,
  createdAt: '2026-09-04T09:59:00.000Z',
  updatedAt: '2026-09-04T10:10:00.000Z',
};

function event(
  id: string,
  eventType: IncidentEventResponse['eventType'],
  occurredAt: string,
  source: string,
): IncidentEventResponse {
  return {
    id,
    incidentId: incident.id,
    eventType,
    occurredAt,
    sequence: Number(id.replace('event-', '')),
    title: id,
    description: null,
    source,
    metadata: {},
    createdAt: occurredAt,
  };
}

function evidence(
  id: string,
  occurredAt: string,
  source: string,
): EvidenceResponse {
  return {
    id,
    incidentId: incident.id,
    evidenceType: 'LOG',
    title: id,
    description: null,
    source,
    sourceRef: null,
    collectedAt: occurredAt,
    occurredAt,
    contentHash: null,
    trustLevel: null,
    metadata: {},
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

const events = [
  event('event-1', 'ALERT', '2026-09-04T10:00:00.000Z', 'api'),
  event('event-2', 'ALERT', '2026-09-04T10:01:00.000Z', 'api'),
  event('event-3', 'ALERT', '2026-09-04T10:02:00.000Z', 'api'),
  event('event-4', 'SYSTEM', '2026-09-04T10:03:00.000Z', 'api'),
];

const evidenceItems = [
  evidence('evidence-1', '2026-09-04T10:00:30.000Z', 'api'),
  evidence('evidence-2', '2026-09-04T10:01:30.000Z', 'api'),
  evidence('evidence-3', '2026-09-04T10:02:30.000Z', 'api'),
];

const snapshot: IntelligenceContextSnapshot = {
  context: {
    incident,
    events,
    evidence: evidenceItems,
    investigation: null,
  },
  metadata: {
    generatedAt: '2026-09-04T10:10:00.000Z',
    eventCount: events.length,
    evidenceCount: evidenceItems.length,
    hasInvestigation: false,
  },
};

const correlations: IntelligenceCorrelation[] = [
  {
    id: 'correlation-1',
    type: 'TEMPORAL',
    title: 'Test correlation',
    description: 'Synthetic correlation.',
    confidence: 'MEDIUM',
    references: [
      {
        type: 'EVENT',
        id: 'event-1',
        reason: 'Test reference.',
      },
      {
        type: 'EVENT',
        id: 'event-2',
        reason: 'Test reference.',
      },
    ],
    occurredAt: '2026-09-04T10:00:00.000Z',
  },
  {
    id: 'correlation-2',
    type: 'EVENT_EVIDENCE',
    title: 'Test correlation',
    description: 'Synthetic correlation.',
    confidence: 'MEDIUM',
    references: [
      {
        type: 'EVENT',
        id: 'event-2',
        reason: 'Test reference.',
      },
      {
        type: 'EVIDENCE',
        id: 'evidence-1',
        reason: 'Test reference.',
      },
    ],
    occurredAt: '2026-09-04T10:01:00.000Z',
  },
  {
    id: 'correlation-3',
    type: 'SHARED_SOURCE',
    title: 'Test correlation',
    description: 'Synthetic correlation.',
    confidence: 'LOW',
    references: [
      {
        type: 'EVENT',
        id: 'event-3',
        reason: 'Test reference.',
      },
      {
        type: 'EVIDENCE',
        id: 'evidence-2',
        reason: 'Test reference.',
      },
    ],
    occurredAt: '2026-09-04T10:02:00.000Z',
  },
];

const originalEvents = [...snapshot.context.events];
const originalEvidence = [...snapshot.context.evidence];

const service = new DeterministicSignalAnalysisService();

const first = service.analyze(snapshot, correlations);
const second = service.analyze(snapshot, correlations);

assert.deepEqual(first, second);

assert.deepEqual(snapshot.context.events, originalEvents);
assert.deepEqual(snapshot.context.evidence, originalEvidence);

assert.ok(first.findings.length >= 4);

assert.ok(
  first.findings.some((finding) =>
    finding.title.includes('Event burst detected'),
  ),
);

assert.ok(
  first.findings.some((finding) =>
    finding.title.includes('Repeated ALERT events detected'),
  ),
);

assert.ok(
  first.findings.some((finding) =>
    finding.title.includes('source concentration'),
  ),
);

assert.ok(
  first.findings.some((finding) =>
    finding.title.includes('Evidence cluster detected'),
  ),
);

assert.ok(
  first.findings.some((finding) =>
    finding.title.includes('correlation density'),
  ),
);

for (const finding of first.findings) {
  assert.equal(finding.type, 'ANOMALY');
  assert.match(finding.id, /^finding-[a-f0-9]{24}$/);
  assert.ok(finding.references.length > 0);
  assert.ok(finding.confidence.rationale.length > 0);
}

const emptySnapshot: IntelligenceContextSnapshot = {
  context: {
    ...snapshot.context,
    events: [],
    evidence: [],
  },
  metadata: {
    ...snapshot.metadata,
    eventCount: 0,
    evidenceCount: 0,
  },
};

assert.deepEqual(service.analyze(emptySnapshot, []), {
  findings: [],
});

const sparseSnapshot: IntelligenceContextSnapshot = {
  context: {
    ...snapshot.context,
    events: [
      event(
        'event-sparse',
        'SYSTEM',
        '2026-09-04T15:00:00.000Z',
        'single-source',
      ),
    ],
    evidence: [],
  },
  metadata: {
    ...snapshot.metadata,
    eventCount: 1,
    evidenceCount: 0,
  },
};

assert.deepEqual(service.analyze(sparseSnapshot, []), {
  findings: [],
});

console.log('STEP 4.5 DETERMINISTIC ANALYSIS TEST: PASS');
