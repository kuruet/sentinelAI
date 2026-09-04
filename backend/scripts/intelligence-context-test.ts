import assert from 'node:assert/strict';

import type {
  EvidenceDataAccess,
} from '../src/data-access/evidence-data-access';
import type {
  IncidentDataAccess,
  IncidentRecord,
} from '../src/data-access/incident-data-access';
import type {
  IncidentEventDataAccess,
} from '../src/data-access/incident-event-data-access';
import type {
  InvestigationDataAccess,
} from '../src/data-access/investigation-data-access';
import type {
  EvidenceResponse,
  IncidentEventResponse,
  InvestigationResponse,
} from '../src/contracts';
import { IntelligenceContextService } from '../src/services/intelligence-context-service';

const incident: IncidentRecord = {
  id: 'incident-1',
  title: 'Database latency incident',
  description: 'Elevated database latency.',
  status: 'INVESTIGATING',
  severity: 'HIGH',
  priority: 8,
  startedAt: new Date('2026-09-04T08:00:00.000Z'),
  resolvedAt: null,
  closedAt: null,
  createdAt: new Date('2026-09-04T08:00:00.000Z'),
  updatedAt: new Date('2026-09-04T08:10:00.000Z'),
};

const events: IncidentEventResponse[] = [
  {
    id: 'event-2',
    incidentId: 'incident-1',
    eventType: 'LOG',
    occurredAt: '2026-09-04T08:05:00.000Z',
    sequence: 2,
    title: 'Error spike',
    description: 'Database errors increased.',
    source: 'application',
    metadata: null,
    createdAt: '2026-09-04T08:05:01.000Z',
  },
  {
    id: 'event-1',
    incidentId: 'incident-1',
    eventType: 'DEPLOYMENT',
    occurredAt: '2026-09-04T08:04:00.000Z',
    sequence: 1,
    title: 'Deployment',
    description: 'Application deployment completed.',
    source: 'deployment-system',
    metadata: null,
    createdAt: '2026-09-04T08:04:01.000Z',
  },
];

const evidence: EvidenceResponse[] = [
  {
    id: 'evidence-2',
    incidentId: 'incident-1',
    evidenceType: 'LOG',
    title: 'Later log',
    description: null,
    source: 'application',
    sourceRef: null,
    collectedAt: '2026-09-04T08:07:00.000Z',
    occurredAt: '2026-09-04T08:06:00.000Z',
    contentHash: null,
    trustLevel: 'HIGH',
    metadata: null,
    createdAt: '2026-09-04T08:07:00.000Z',
    updatedAt: '2026-09-04T08:07:00.000Z',
  },
  {
    id: 'evidence-1',
    incidentId: 'incident-1',
    evidenceType: 'DEPLOYMENT',
    title: 'Deployment evidence',
    description: null,
    source: 'deployment-system',
    sourceRef: null,
    collectedAt: '2026-09-04T08:05:00.000Z',
    occurredAt: '2026-09-04T08:04:00.000Z',
    contentHash: null,
    trustLevel: 'HIGH',
    metadata: null,
    createdAt: '2026-09-04T08:05:00.000Z',
    updatedAt: '2026-09-04T08:05:00.000Z',
  },
  {
    id: 'evidence-3',
    incidentId: 'incident-1',
    evidenceType: 'DOCUMENT',
    title: 'Undated document',
    description: null,
    source: 'manual',
    sourceRef: null,
    collectedAt: null,
    occurredAt: null,
    contentHash: null,
    trustLevel: 'MEDIUM',
    metadata: null,
    createdAt: '2026-09-04T08:08:00.000Z',
    updatedAt: '2026-09-04T08:08:00.000Z',
  },
];

const investigation: InvestigationResponse = {
  id: 'investigation-1',
  incidentId: 'incident-1',
  summary: 'Investigating recent deployment impact.',
  startedAt: '2026-09-04T08:02:00.000Z',
  completedAt: null,
  createdAt: '2026-09-04T08:02:00.000Z',
  updatedAt: '2026-09-04T08:02:00.000Z',
};

const incidentDataAccess: IncidentDataAccess = {
  findById: async () => incident,
  create: async () => incident,
  update: async () => incident,
  updateLifecycle: async () => incident,
  updateSeverityPriority: async () => incident,
  list: async () => ({ items: [incident], total: 1 }),
  listAccessibleToUser: async () => ({ items: [incident], total: 1 }),
};

const incidentEventDataAccess: IncidentEventDataAccess = {
  findByIncidentAndSequence: async () => null,
  create: async (_incidentId, input) => ({
    id: 'event-created',
    incidentId: 'incident-1',
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    sequence: input.sequence,
    title: input.title,
    description: input.description ?? null,
    source: input.source ?? null,
    metadata: input.metadata ?? null,
    createdAt: input.occurredAt,
  }),
  listByIncident: async () => [...events],
};

const evidenceDataAccess: EvidenceDataAccess = {
  findByIdForIncident: async () => null,
  create: async (_incidentId, input) => ({
    id: 'evidence-created',
    incidentId: 'incident-1',
    evidenceType: input.evidenceType,
    title: input.title,
    description: input.description ?? null,
    source: input.source,
    sourceRef: input.sourceRef ?? null,
    collectedAt: input.collectedAt ?? null,
    occurredAt: input.occurredAt ?? null,
    contentHash: input.contentHash ?? null,
    trustLevel: input.trustLevel ?? null,
    metadata: input.metadata ?? null,
    createdAt: input.collectedAt ?? new Date().toISOString(),
    updatedAt: input.collectedAt ?? new Date().toISOString(),
  }),
  listByIncident: async () => [...evidence],
  deleteByIdForIncident: async () => true,
};

const investigationDataAccess: InvestigationDataAccess = {
  findByIncidentId: async () => investigation,
  create: async () => investigation,
  update: async () => investigation,
  deleteByIncidentId: async () => investigation.id,
};

const service = new IntelligenceContextService(
  incidentDataAccess,
  incidentEventDataAccess,
  evidenceDataAccess,
  investigationDataAccess,
);

async function main() {
  console.log('Building intelligence context...');

  const snapshot = await service.buildContext('incident-1');

  assert.ok(snapshot);
  assert.equal(snapshot.context.incident.id, 'incident-1');
  assert.equal(snapshot.context.events.length, 2);
  assert.equal(snapshot.context.evidence.length, 3);
  assert.equal(snapshot.context.investigation?.id, 'investigation-1');

  assert.deepEqual(
    snapshot.context.events.map((event) => event.id),
    ['event-1', 'event-2'],
  );

  assert.deepEqual(
    snapshot.context.evidence.map((item) => item.id),
    ['evidence-1', 'evidence-2', 'evidence-3'],
  );

  assert.equal(snapshot.metadata.eventCount, 2);
  assert.equal(snapshot.metadata.evidenceCount, 3);
  assert.equal(snapshot.metadata.hasInvestigation, true);

  assert.deepEqual(
    events.map((event) => event.id),
    ['event-2', 'event-1'],
  );

  assert.deepEqual(
    evidence.map((item) => item.id),
    ['evidence-2', 'evidence-1', 'evidence-3'],
  );

  console.log('Ordering verification: PASS');
  console.log('Source immutability verification: PASS');
  console.log('Context metadata verification: PASS');

  const missingIncidentService = new IntelligenceContextService(
    {
      ...incidentDataAccess,
      findById: async () => null,
    },
    incidentEventDataAccess,
    evidenceDataAccess,
    investigationDataAccess,
  );

  const missingContext = await missingIncidentService.buildContext('missing');

  assert.equal(missingContext, null);

  console.log('Missing incident handling: PASS');
  console.log('STEP 4.3 CONTEXT BUILDER TEST: PASS');
}

main().catch((error) => {
  console.error('\n===== STEP 4.3 CONTEXT BUILDER TEST FAILED =====');
  console.error(error);
  process.exitCode = 1;
});
