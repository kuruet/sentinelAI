import assert from 'node:assert/strict';

import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { PrismaEvidenceDataAccess } from '../src/data-access/prisma-evidence-data-access';
import { PrismaIncidentDataAccess } from '../src/data-access/prisma-incident-data-access';
import { PrismaIncidentEventDataAccess } from '../src/data-access/prisma-incident-event-data-access';
import { PrismaInvestigationDataAccess } from '../src/data-access/prisma-investigation-data-access';
import { IntelligenceApiService } from '../src/intelligence/intelligence-api';
import { FakeAIProvider } from '../src/intelligence/providers/fake-ai-provider';
import { AIRecommendationsService } from '../src/intelligence/recommendations/recommendation-service';
import { IntelligenceContextService } from '../src/services/intelligence-context-service';

const TEST_MODEL = 'sentinelai-demo-recommendations-model';

async function main(): Promise<void> {
  console.log('=== STEP 6.8 RECOMMENDATIONS INTEGRATION TEST ===');

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

  const eventReferences = snapshot.context.events.slice(0, 2).map((event) => event.id);
  const evidenceReferences = snapshot.context.evidence.slice(0, 2).map((evidence) => evidence.id);

  assert.equal(eventReferences.length, 2);
  assert.equal(evidenceReferences.length, 2);

  const fakeRecommendationsOutput = JSON.stringify({
    recommendations: [
      {
        title: 'Validate database pool configuration',
        action:
          'Compare the deployed database pool configuration against the known-good configuration and confirm the effective runtime values before making changes.',
        priority: 'IMMEDIATE',
        confidence: {
          level: 'HIGH',
          score: 0.91,
          rationale:
            'The configuration evidence and database connection error event provide direct support for validating the pool configuration.',
        },
        references: [
          {
            type: 'EVIDENCE',
            id: evidenceReferences[0],
            reason: 'The evidence contains the database pool configuration record.',
          },
          {
            type: 'EVENT',
            id: eventReferences[0],
            reason: 'The event records database connection errors during the incident.',
          },
        ],
      },
      {
        title: 'Review configuration deployment timing',
        action:
          'Review the configuration deployment record and correlate its timing with the onset of checkout errors and database connection failures.',
        priority: 'HIGH',
        confidence: {
          level: 'MEDIUM',
          score: 0.74,
          rationale:
            'The deployment and incident timeline provide useful temporal evidence, but temporal association alone does not establish causation.',
        },
        references: [
          {
            type: 'EVIDENCE',
            id: evidenceReferences[1],
            reason: 'The evidence contains the configuration deployment record.',
          },
          {
            type: 'EVENT',
            id: eventReferences[1],
            reason: 'The event provides an observed incident signal for correlation.',
          },
        ],
      },
      {
        title: 'Preserve investigation evidence',
        action:
          'Preserve the existing incident evidence and investigation record while validating the suspected configuration regression.',
        priority: 'NORMAL',
        confidence: {
          level: 'MEDIUM',
          score: 0.68,
          rationale:
            'Preserving the current evidence supports continued investigation without changing the incident source of truth.',
        },
        references: [
          {
            type: 'EVIDENCE',
            id: evidenceReferences[0],
            reason: 'The existing evidence should remain available for validation.',
          },
        ],
      },
      {
        title: 'Document unresolved uncertainty',
        action:
          'Record any conflicting or unverified observations discovered during configuration validation before concluding that the configuration change caused the incident.',
        priority: 'LOW',
        confidence: {
          level: 'LOW',
          score: 0.42,
          rationale:
            'The supplied context does not independently prove causation, so unresolved uncertainty should remain explicit.',
        },
        references: [
          {
            type: 'EVENT',
            id: eventReferences[1],
            reason: 'The incident event provides context for the unresolved investigation state.',
          },
        ],
      },
    ],
  });

  const provider = new FakeAIProvider(fakeRecommendationsOutput);
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

  const result = await intelligenceApi.recommendations(
    DEMO_INCIDENT_ID,
    {
      model: TEST_MODEL,
    },
    snapshot,
  );

  assert.equal(result.incidentId, DEMO_INCIDENT_ID);
  assert.equal(result.provider, 'fake');
  assert.equal(result.model, TEST_MODEL);
  assert.equal(result.requestId, 'fake-request-id');
  assert.equal(result.latencyMs, 0);
  assert.equal(result.recommendations.length, 4);

  console.log('PASS: recommendations API integration');

  const priorities = result.recommendations.map((recommendation) => recommendation.priority);

  assert.deepEqual(priorities, ['IMMEDIATE', 'HIGH', 'NORMAL', 'LOW']);
  console.log('PASS: recommendations sorted by priority');

  const validContextReferenceKeys = new Set(
    snapshot.context.events
      .map((event) => `EVENT:${event.id}`)
      .concat(snapshot.context.evidence.map((evidence) => `EVIDENCE:${evidence.id}`))
      .concat([
        `INCIDENT:${snapshot.context.incident.id}`,
        `INVESTIGATION:${snapshot.context.investigation?.id}`,
      ]),
  );

  for (const recommendation of result.recommendations) {
    assert.ok(recommendation.id.startsWith('recommendation-'));
    assert.ok(recommendation.id.length > 'recommendation-'.length);
    assert.ok(recommendation.title.length > 0);
    assert.ok(recommendation.action.length > 0);

    assert.ok(
      ['IMMEDIATE', 'HIGH', 'NORMAL', 'LOW'].includes(recommendation.priority),
      'Recommendation priority should be valid.',
    );

    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(recommendation.confidence.level));
    assert.ok(
      recommendation.confidence.score !== undefined &&
        recommendation.confidence.score !== null &&
        recommendation.confidence.score >= 0 &&
        recommendation.confidence.score <= 1,
    );
    assert.ok(recommendation.confidence.rationale.length > 0);
    assert.ok(recommendation.references.length > 0);

    for (const reference of recommendation.references) {
      assert.ok(
        validContextReferenceKeys.has(`${reference.type}:${reference.id}`),
        `Recommendation reference must belong to grounded context: ${reference.type}:${reference.id}`,
      );
      assert.ok(reference.reason.length > 0);
    }
  }

  console.log('PASS: recommendation structure, confidence, and grounding references');

  assert.equal(
    new Set(result.recommendations.map((recommendation) => recommendation.id)).size,
    result.recommendations.length,
  );

  console.log('PASS: recommendation IDs are unique');

  assert.ok(AIRecommendationsService.limitations.length > 0);

  assert.ok(
    AIRecommendationsService.limitations.some((limitation) =>
      limitation.toLowerCase().includes('source-of-truth'),
    ),
    'Recommendation limitations should include source-of-truth boundary.',
  );

  assert.ok(
    AIRecommendationsService.limitations.some((limitation) =>
      limitation.toLowerCase().includes('causation'),
    ),
    'Recommendation limitations should include causation boundary.',
  );

  assert.ok(
    AIRecommendationsService.limitations.some((limitation) =>
      limitation.toLowerCase().includes('human validation'),
    ),
    'Recommendation limitations should require human validation.',
  );

  console.log('PASS: recommendation safety limitations');

  await assert.rejects(
    () =>
      intelligenceApi.recommendations(
        '00000000-0000-4000-8000-000000000099',
        {
          model: TEST_MODEL,
        },
        snapshot,
      ),
    /Recommendation analysis incidentId does not match the supplied context/,
  );

  console.log('PASS: incident/context mismatch rejected');

  await assert.rejects(
    () =>
      intelligenceApi.recommendations(
        DEMO_INCIDENT_ID,
        {
          model: '   ',
        },
        snapshot,
      ),
    /Recommendation analysis requires a model/,
  );

  console.log('PASS: blank model rejected');

  const invalidReferenceOutput = JSON.stringify({
    recommendations: [
      {
        title: 'Invalid grounded reference',
        action: 'This recommendation deliberately references unavailable context.',
        priority: 'HIGH',
        confidence: {
          level: 'LOW',
          score: 0.2,
          rationale: 'Test validation only.',
        },
        references: [
          {
            type: 'EVENT',
            id: '00000000-0000-4000-8000-000000000099',
            reason: 'This reference does not belong to the grounded incident.',
          },
        ],
      },
    ],
  });

  const invalidReferenceApi = new IntelligenceApiService({
    provider: new FakeAIProvider(invalidReferenceOutput),
  });

  await assert.rejects(
    () =>
      invalidReferenceApi.recommendations(
        DEMO_INCIDENT_ID,
        {
          model: TEST_MODEL,
        },
        snapshot,
      ),
    /Recommendation output contains a reference outside the grounded context/,
  );

  console.log('PASS: out-of-context recommendation reference rejected');

  const invalidStructuredOutputApi = new IntelligenceApiService({
    provider: new FakeAIProvider('not valid JSON'),
  });

  await assert.rejects(
    () =>
      invalidStructuredOutputApi.recommendations(
        DEMO_INCIDENT_ID,
        {
          model: TEST_MODEL,
        },
        snapshot,
      ),
    /Recommendation provider returned invalid structured output/,
  );

  console.log('PASS: invalid structured provider output rejected');

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

  console.log('STEP 6.8 RECOMMENDATIONS INTEGRATION VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error('STEP 6.8 RECOMMENDATIONS INTEGRATION VERIFICATION FAILED');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
