import assert from 'node:assert/strict';

import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { PrismaEvidenceDataAccess } from '../src/data-access/prisma-evidence-data-access';
import { PrismaIncidentDataAccess } from '../src/data-access/prisma-incident-data-access';
import { PrismaIncidentEventDataAccess } from '../src/data-access/prisma-incident-event-data-access';
import { PrismaInvestigationDataAccess } from '../src/data-access/prisma-investigation-data-access';
import { IntelligenceContextService } from '../src/services/intelligence-context-service';
import { IntelligenceApiService } from '../src/intelligence/intelligence-api';
import { FakeAIProvider } from '../src/intelligence/providers/fake-ai-provider';

const TEST_MODEL = 'sentinelai-demo-summary-model';

async function main(): Promise<void> {
  console.log('Initializing deterministic demo scenario...');
  await initializeDemoScenario();

  const contextService = new IntelligenceContextService(
    new PrismaIncidentDataAccess(prisma),
    new PrismaIncidentEventDataAccess(prisma),
    new PrismaEvidenceDataAccess(prisma),
    new PrismaInvestigationDataAccess(prisma),
  );

  console.log('Building intelligence context from real persistence...');

  const snapshot = await contextService.buildContext(DEMO_INCIDENT_ID);

  assert.ok(snapshot, 'Intelligence context snapshot must exist.');

  assert.equal(snapshot.context.incident.id, DEMO_INCIDENT_ID);
  assert.equal(snapshot.context.incident.status, 'INVESTIGATING');
  assert.equal(snapshot.context.incident.severity, 'HIGH');
  assert.equal(snapshot.context.events.length, 6);
  assert.equal(snapshot.context.evidence.length, 5);
  assert.ok(snapshot.context.investigation);

  console.log('PASS: real persisted incident context loaded');

  const provider = new FakeAIProvider();

  const intelligenceApi = new IntelligenceApiService({
    provider,
  });

  for (const mode of ['EXECUTIVE', 'INVESTIGATION', 'TIMELINE'] as const) {
    console.log(`Generating ${mode} summary...`);

    const result = await intelligenceApi.summarize(
      DEMO_INCIDENT_ID,
      {
        mode,
        model: TEST_MODEL,
      },
      snapshot,
    );

    assert.equal(result.incidentId, DEMO_INCIDENT_ID);
    assert.equal(result.mode, mode);
    assert.equal(result.provider, provider.name);
    assert.equal(result.model, TEST_MODEL);

    assert.ok(
      typeof result.summary === 'string' && result.summary.trim().length > 0,
      `${mode} summary must contain output text`,
    );

    assert.ok(result.latencyMs >= 0);

    assert.ok(Array.isArray(result.references));
    assert.ok(result.references.length > 0);

    assert.ok(
      result.references.some(
        (reference) => reference.type === 'INCIDENT' && reference.id === DEMO_INCIDENT_ID,
      ),
      `${mode} summary must reference the authoritative incident`,
    );

    assert.ok(
      result.references.some((reference) => reference.type === 'EVENT'),
      `${mode} summary must contain event references`,
    );

    assert.ok(
      result.references.some((reference) => reference.type === 'EVIDENCE'),
      `${mode} summary must contain evidence references`,
    );

    assert.ok(
      result.references.some((reference) => reference.type === 'INVESTIGATION'),
      `${mode} summary must contain investigation reference`,
    );

    assert.ok(Array.isArray(result.limitations));
    assert.ok(result.limitations.length > 0);

    assert.ok(
      result.limitations.some((limitation) => limitation.toLowerCase().includes('source-of-truth')),
      `${mode} summary must preserve source-of-truth limitation`,
    );

    console.log(`PASS: ${mode} summary generated`);
    console.log(`PASS: ${mode} summary is incident-scoped`);
    console.log(`PASS: ${mode} summary returned grounding references`);
    console.log(`PASS: ${mode} summary returned safety limitations`);
  }

  console.log('Testing incident/context identity enforcement...');

  await assert.rejects(
    () =>
      intelligenceApi.summarize(
        '00000000-0000-4000-8000-000000000099',
        {
          mode: 'EXECUTIVE',
          model: TEST_MODEL,
        },
        snapshot,
      ),
    /Incident summarization incident ID does not match context/,
  );

  console.log('PASS: summary rejects mismatched incident/context identity');

  console.log('Testing source persistence after summary generation...');

  const persistedIncident = await prisma.incident.findUnique({
    where: {
      id: DEMO_INCIDENT_ID,
    },
  });

  assert.ok(persistedIncident);
  assert.equal(persistedIncident.status, 'INVESTIGATING');
  assert.equal(persistedIncident.severity, 'HIGH');

  const persistedEventCount = await prisma.incidentEvent.count({
    where: {
      incidentId: DEMO_INCIDENT_ID,
    },
  });

  const persistedEvidenceCount = await prisma.evidence.count({
    where: {
      incidentId: DEMO_INCIDENT_ID,
    },
  });

  const persistedInvestigationCount = await prisma.investigation.count({
    where: {
      incidentId: DEMO_INCIDENT_ID,
    },
  });

  assert.equal(persistedEventCount, 6);
  assert.equal(persistedEvidenceCount, 5);
  assert.equal(persistedInvestigationCount, 1);

  console.log('PASS: summary generation does not modify incident state');
  console.log('PASS: persisted events remain unchanged');
  console.log('PASS: persisted evidence remains unchanged');
  console.log('PASS: persisted investigation remains unchanged');

  console.log('STEP 6.5 AI SUMMARY INTEGRATION VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error('\n===== STEP 6.5 AI SUMMARY INTEGRATION FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
