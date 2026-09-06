import assert from 'node:assert/strict';

import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { PrismaEvidenceDataAccess } from '../src/data-access/prisma-evidence-data-access';
import { PrismaIncidentDataAccess } from '../src/data-access/prisma-incident-data-access';
import { PrismaIncidentEventDataAccess } from '../src/data-access/prisma-incident-event-data-access';
import { PrismaInvestigationDataAccess } from '../src/data-access/prisma-investigation-data-access';
import { IntelligenceContextService } from '../src/services/intelligence-context-service';
import { FakeAIProvider } from '../src/intelligence/providers/fake-ai-provider';
import {
  IntelligenceApiService,
  intelligenceRcaRequestSchema,
} from '../src/intelligence/intelligence-api';

const TEST_MODEL = 'sentinelai-demo-rca-model';

const EXPECTED_MODES = ['PRIMARY', 'ALTERNATIVE'] as const;

async function main(): Promise<void> {
  console.log('=== STEP 6.7 ROOT CAUSE ANALYSIS INTEGRATION TEST ===');

  await initializeDemoScenario();

  const incidentDataAccess = new PrismaIncidentDataAccess(prisma);
  const eventDataAccess = new PrismaIncidentEventDataAccess(prisma);
  const evidenceDataAccess = new PrismaEvidenceDataAccess(prisma);
  const investigationDataAccess = new PrismaInvestigationDataAccess(prisma);

  const contextService = new IntelligenceContextService(
    incidentDataAccess,
    eventDataAccess,
    evidenceDataAccess,
    investigationDataAccess,
  );

  const snapshot = await contextService.buildContext(DEMO_INCIDENT_ID);

  assert.ok(snapshot, 'Demo intelligence context should exist.');
  assert.equal(snapshot.context.incident.id, DEMO_INCIDENT_ID);
  assert.equal(snapshot.context.incident.status, 'INVESTIGATING');
  assert.equal(snapshot.context.incident.severity, 'HIGH');
  assert.equal(snapshot.context.events.length, 6);
  assert.equal(snapshot.context.evidence.length, 5);
  assert.ok(snapshot.context.investigation);

  console.log('PASS: deterministic intelligence context loaded');

  const eventReference = snapshot.context.events[0]?.id;
  const evidenceReference = snapshot.context.evidence[0]?.id;
  const investigationReference = snapshot.context.investigation?.id;

  assert.ok(eventReference, 'Expected at least one event reference.');
  assert.ok(evidenceReference, 'Expected at least one evidence reference.');
  assert.ok(investigationReference, 'Expected an investigation reference.');

  const fakeRcaOutput = JSON.stringify({
    analysis:
      'The strongest candidate is a database connection-pool configuration regression following the detected configuration deployment. The supplied context supports temporal association and direct configuration evidence, but does not by itself prove causation.',
    hypotheses: [
      {
        title: 'Database connection-pool configuration regression',
        description:
          'A database pool configuration change is the strongest candidate explanation for the checkout API errors because the configuration change and database connection failures occur within the supplied incident timeline.',
        confidence: {
          level: 'HIGH',
          score: 0.82,
          rationale:
            'The candidate is supported by the configuration evidence, database error event, and temporal relationship in the grounded context.',
        },
        supportingReferences: [
          {
            type: 'EVENT',
            id: eventReference,
            reason: 'The event records database connection errors during the incident.',
          },
          {
            type: 'EVIDENCE',
            id: evidenceReference,
            reason: 'The evidence contains the database pool configuration record.',
          },
        ],
        contradictingReferences: [],
      },
    ],
  });

  const provider = new FakeAIProvider(fakeRcaOutput);
  const intelligenceApi = new IntelligenceApiService({
    provider,
  });

  const persistedBefore = await prisma.incident.findUnique({
    where: {
      id: DEMO_INCIDENT_ID,
    },
    include: {
      participants: true,
      events: true,
      evidence: true,
      investigation: true,
    },
  });

  assert.ok(persistedBefore);
  assert.equal(persistedBefore.status, 'INVESTIGATING');
  assert.equal(persistedBefore.severity, 'HIGH');
  assert.equal(persistedBefore.events.length, 6);
  assert.equal(persistedBefore.evidence.length, 5);
  assert.ok(persistedBefore.investigation);

  for (const mode of EXPECTED_MODES) {
    const validatedRequest = intelligenceRcaRequestSchema.parse({
      mode,
      model: TEST_MODEL,
    });

    const result = await intelligenceApi.rootCause(DEMO_INCIDENT_ID, validatedRequest, snapshot);

    assert.equal(result.incidentId, DEMO_INCIDENT_ID);
    assert.equal(result.mode, mode);
    assert.equal(result.provider, 'fake');
    assert.equal(result.model, TEST_MODEL);
    assert.equal(result.requestId, 'fake-request-id');
    assert.equal(result.latencyMs, 0);
    assert.ok(result.analysis.length > 0);
    assert.ok(result.hypotheses.length > 0);
    assert.ok(result.limitations.length > 0);

    const hypothesis = result.hypotheses[0];

    assert.ok(hypothesis.id.startsWith('hypothesis-'));
    assert.ok(hypothesis.id.length > 'hypothesis-'.length);
    assert.ok(hypothesis.title.length > 0);
    assert.ok(hypothesis.description.length > 0);

    assert.ok(
      ['HIGH', 'MEDIUM', 'LOW'].includes(hypothesis.confidence.level),
      'Hypothesis confidence level should be valid.',
    );
    assert.equal(hypothesis.confidence.score, 0.82);
    assert.ok(hypothesis.confidence.rationale.length > 0);

    assert.ok(hypothesis.supportingReferences.length > 0);
    assert.ok(Array.isArray(hypothesis.contradictingReferences));

    const validContextReferenceKeys = new Set(
      snapshot.context.events
        .map((event) => `EVENT:${event.id}`)
        .concat(snapshot.context.evidence.map((evidence) => `EVIDENCE:${evidence.id}`))
        .concat([`INVESTIGATION:${investigationReference}`]),
    );

    for (const reference of [
      ...hypothesis.supportingReferences,
      ...hypothesis.contradictingReferences,
    ]) {
      assert.ok(
        validContextReferenceKeys.has(`${reference.type}:${reference.id}`),
        `RCA reference must belong to grounded context: ${reference.type}:${reference.id}`,
      );
      assert.ok(reference.reason.length > 0);
    }

    assert.ok(
      result.limitations.some((limitation) => limitation.toLowerCase().includes('source-of-truth')),
      'RCA limitations should include source-of-truth boundary.',
    );

    assert.ok(
      result.limitations.some((limitation) => limitation.toLowerCase().includes('causation')),
      'RCA limitations should include causation boundary.',
    );

    assert.ok(
      result.limitations.some((limitation) =>
        limitation.toLowerCase().includes('human validation'),
      ),
      'RCA limitations should require human validation.',
    );

    console.log(`PASS: ${mode} RCA analysis`);
    console.log(`  hypothesis id: ${hypothesis.id}`);
    console.log(`  confidence: ${hypothesis.confidence.level} (${hypothesis.confidence.score})`);
    console.log(`  supporting references: ${hypothesis.supportingReferences.length}`);
  }

  await assert.rejects(
    () =>
      intelligenceApi.rootCause(
        '00000000-0000-4000-8000-000000000099',
        {
          mode: 'PRIMARY',
          model: TEST_MODEL,
        },
        snapshot,
      ),
    /RCA incident ID does not match intelligence context/,
  );

  console.log('PASS: incident/context mismatch rejected');

  await assert.rejects(
    () =>
      intelligenceApi.rootCause(
        DEMO_INCIDENT_ID,
        {
          mode: 'PRIMARY',
          model: '   ',
        },
        snapshot,
      ),
    /RCA model is required/,
  );

  console.log('PASS: blank model rejected');

  assert.throws(
    () =>
      intelligenceRcaRequestSchema.parse({
        mode: 'INVALID',
        model: TEST_MODEL,
      }),
    /Invalid option/,
  );

  console.log('PASS: invalid RCA mode rejected by request schema');

  const persistedAfter = await prisma.incident.findUnique({
    where: {
      id: DEMO_INCIDENT_ID,
    },
    include: {
      participants: true,
      events: true,
      evidence: true,
      investigation: true,
    },
  });

  assert.ok(persistedAfter);
  assert.equal(persistedAfter.status, persistedBefore.status);
  assert.equal(persistedAfter.severity, persistedBefore.severity);
  assert.equal(persistedAfter.title, persistedBefore.title);
  assert.equal(persistedAfter.events.length, persistedBefore.events.length);
  assert.equal(persistedAfter.evidence.length, persistedBefore.evidence.length);
  assert.equal(persistedAfter.participants.length, persistedBefore.participants.length);
  assert.equal(persistedAfter.investigation?.id, persistedBefore.investigation?.id);

  assert.deepEqual(
    persistedAfter.events.map((event) => ({
      id: event.id,
      sequence: event.sequence,
      type: event.type,
    })),
    persistedBefore.events.map((event) => ({
      id: event.id,
      sequence: event.sequence,
      type: event.type,
    })),
  );

  assert.deepEqual(
    persistedAfter.evidence.map((evidence) => ({
      id: evidence.id,
      type: evidence.type,
    })),
    persistedBefore.evidence.map((evidence) => ({
      id: evidence.id,
      type: evidence.type,
    })),
  );

  console.log('PASS: incident source-of-truth remained unchanged');

  console.log('STEP 6.7 ROOT CAUSE ANALYSIS INTEGRATION VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error('STEP 6.7 ROOT CAUSE ANALYSIS INTEGRATION VERIFICATION FAILED');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
