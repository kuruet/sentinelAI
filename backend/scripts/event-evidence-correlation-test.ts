import assert from 'node:assert/strict';

import {
  EventEvidenceCorrelationService,
} from '../src/services/event-evidence-correlation-service';

import type {
  EvidenceResponse,
  IncidentEventResponse,
  IncidentResponse,
} from '../src/contracts';

import type { IntelligenceContextSnapshot } from '../src/intelligence';

const incident: IncidentResponse = {
  id: 'incident-1',
  title: 'API outage',
  description: 'Synthetic incident for correlation testing.',
  status: 'INVESTIGATING',
  severity: 'HIGH',
  priority: 1,
  startedAt: '2026-09-04T10:00:00.000Z',
  resolvedAt: null,
  closedAt: null,
  createdAt: '2026-09-04T09:59:00.000Z',
  updatedAt: '2026-09-04T10:05:00.000Z',
};

function event(
  id: string,
  occurredAt: string,
  source: string,
): IncidentEventResponse {
  return {
    id,
    incidentId: incident.id,
    eventType: 'SYSTEM',
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
  occurredAt: string | null,
  source: string,
  createdAt: string,
): EvidenceResponse {
  return {
    id,
    incidentId: incident.id,
    evidenceType: 'LOG',
    title: id,
    description: null,
    source,
    sourceRef: null,
    collectedAt: createdAt,
    occurredAt,
    contentHash: null,
    trustLevel: null,
    metadata: {},
    createdAt,
    updatedAt: createdAt,
  };
}

const firstEvent = event(
  'event-1',
  '2026-09-04T10:00:00.000Z',
  'api-service',
);

const secondEvent = event(
  'event-2',
  '2026-09-04T10:03:00.000Z',
  'api-service',
);

const unrelatedEvent = event(
  'event-3',
  '2026-09-04T11:00:00.000Z',
  'database-service',
);

const relatedEvidence = evidence(
  'evidence-1',
  '2026-09-04T10:02:00.000Z',
  'api-service',
  '2026-09-04T10:04:00.000Z',
);

const distantEvidence = evidence(
  'evidence-2',
  '2026-09-04T12:00:00.000Z',
  'other-service',
  '2026-09-04T12:01:00.000Z',
);

const missingTimestampEvidence = evidence(
  'evidence-3',
  null,
  'api-service',
  '2026-09-04T10:05:00.000Z',
);

const events = [unrelatedEvent, secondEvent, firstEvent];
const evidenceItems = [
  distantEvidence,
  missingTimestampEvidence,
  relatedEvidence,
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

const originalEvents = [...snapshot.context.events];
const originalEvidence = [...snapshot.context.evidence];

const service = new EventEvidenceCorrelationService();

const firstRun = service.correlate(snapshot);
const secondRun = service.correlate(snapshot);

assert.deepEqual(firstRun, secondRun);

assert.deepEqual(snapshot.context.events, originalEvents);
assert.deepEqual(snapshot.context.evidence, originalEvidence);

assert.ok(firstRun.length > 0);

const temporalCorrelation = firstRun.find(
  (item) =>
    item.type === 'TEMPORAL' &&
    item.references.some((reference) => reference.id === 'event-1') &&
    item.references.some((reference) => reference.id === 'event-2'),
);

assert.ok(temporalCorrelation);
assert.equal(temporalCorrelation.confidence, 'HIGH');
assert.equal(temporalCorrelation.references.length, 2);

const eventEvidenceCorrelation = firstRun.find(
  (item) =>
    item.type === 'EVENT_EVIDENCE' &&
    item.references.some((reference) => reference.id === 'event-1') &&
    item.references.some((reference) => reference.id === 'evidence-1'),
);

assert.ok(eventEvidenceCorrelation);
assert.equal(eventEvidenceCorrelation.confidence, 'HIGH');
assert.equal(eventEvidenceCorrelation.references.length, 2);

const unrelatedCorrelation = firstRun.find(
  (item) =>
    item.references.some((reference) => reference.id === 'event-3') &&
    item.references.some((reference) => reference.id === 'evidence-2'),
);

assert.equal(unrelatedCorrelation, undefined);

const sourceOnlyEvidenceCorrelation = firstRun.find(
  (item) =>
    item.references.some((reference) => reference.id === 'event-1') &&
    item.references.some((reference) => reference.id === 'evidence-3'),
);

assert.ok(sourceOnlyEvidenceCorrelation);
assert.equal(sourceOnlyEvidenceCorrelation.confidence, 'LOW');

const noTimestampSnapshot: IntelligenceContextSnapshot = {
  context: {
    ...snapshot.context,
    events: [firstEvent],
    evidence: [missingTimestampEvidence],
  },
  metadata: {
    ...snapshot.metadata,
    eventCount: 1,
    evidenceCount: 1,
  },
};

const noTimestampResult = service.correlate(noTimestampSnapshot);

assert.equal(noTimestampResult.length, 1);
assert.equal(noTimestampResult[0].confidence, 'LOW');

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

assert.deepEqual(service.correlate(emptySnapshot), []);

for (const correlation of firstRun) {
  assert.match(correlation.id, /^correlation-[a-f0-9]{24}$/);
  assert.ok(correlation.references.length >= 2);
  assert.ok(correlation.description.toLowerCase().includes('not causation'));
}

const narrowWindowService = new EventEvidenceCorrelationService(60_000);

const narrowWindowResult = narrowWindowService.correlate({
  ...snapshot,
  context: {
    ...snapshot.context,
    events: [firstEvent, secondEvent],
  },
  metadata: {
    ...snapshot.metadata,
    eventCount: 2,
  },
});

assert.equal(
  narrowWindowResult.some(
    (item) =>
      item.references.some((reference) => reference.id === 'event-1') &&
      item.references.some((reference) => reference.id === 'event-2'),
  ),
  true,
);

console.log('STEP 4.4 CORRELATION ENGINE TEST: PASS');
