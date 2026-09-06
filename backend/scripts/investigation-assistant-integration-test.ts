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
import { INVESTIGATION_ASSISTANT_INTENTS } from '../src/intelligence/assistant/investigation-assistant';

const TEST_MODEL = 'sentinelai-demo-assistant-model';

const QUESTIONS: Record<(typeof INVESTIGATION_ASSISTANT_INTENTS)[number], string> = {
  INVESTIGATION_SUMMARY: 'What is the current investigation state and what facts are established?',
  EVIDENCE_INTERPRETATION: 'What does the available evidence indicate about this incident?',
  TIMELINE_ANALYSIS:
    'What does the observed timeline tell us, and what remains uncertain about causation?',
  NEXT_INVESTIGATION_STEP:
    'What should the investigator examine next based only on the supplied context?',
  HYPOTHESIS_REVIEW:
    'How should the current evidence be used to evaluate the likely configuration-change hypothesis?',
};

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
  console.log('PASS: assistant has deterministic incident context');

  const provider = new FakeAIProvider();

  const intelligenceApi = new IntelligenceApiService({
    provider,
  });

  for (const intent of INVESTIGATION_ASSISTANT_INTENTS) {
    console.log(`Asking assistant with ${intent}...`);

    const result = await intelligenceApi.answer(
      DEMO_INCIDENT_ID,
      {
        incidentId: DEMO_INCIDENT_ID,
        question: QUESTIONS[intent],
        intent,
        model: TEST_MODEL,
      },
      snapshot,
    );

    assert.equal(result.incidentId, DEMO_INCIDENT_ID);
    assert.equal(result.provider, provider.name);
    assert.equal(result.model, TEST_MODEL);

    assert.ok(
      typeof result.answer === 'string' && result.answer.trim().length > 0,
      `${intent} assistant response must contain answer text`,
    );

    assert.ok(
      result.latencyMs >= 0,
      `${intent} assistant response must contain non-negative latency`,
    );

    assert.ok(
      Array.isArray(result.references) && result.references.length > 0,
      `${intent} assistant response must contain grounding references`,
    );

    assert.ok(
      result.references.some(
        (reference) => reference.type === 'INCIDENT' && reference.id === DEMO_INCIDENT_ID,
      ),
      `${intent} assistant response must reference the authoritative incident`,
    );

    assert.ok(
      result.references.some((reference) => reference.type === 'EVENT'),
      `${intent} assistant response must contain event references`,
    );

    assert.ok(
      result.references.some((reference) => reference.type === 'EVIDENCE'),
      `${intent} assistant response must contain evidence references`,
    );

    assert.ok(
      result.references.some((reference) => reference.type === 'INVESTIGATION'),
      `${intent} assistant response must contain investigation reference`,
    );

    assert.ok(
      Array.isArray(result.limitations) && result.limitations.length > 0,
      `${intent} assistant response must contain safety limitations`,
    );

    assert.ok(
      result.limitations.some((limitation) => limitation.toLowerCase().includes('source-of-truth')),
      `${intent} assistant response must preserve source-of-truth limitation`,
    );

    console.log(`PASS: ${intent} assistant response generated`);
    console.log(`PASS: ${intent} response is incident-scoped`);
    console.log(`PASS: ${intent} response returned grounding references`);
    console.log(`PASS: ${intent} response returned safety limitations`);
  }

  console.log('Testing incident/context identity enforcement...');

  await assert.rejects(
    () =>
      intelligenceApi.answer(
        '00000000-0000-4000-8000-000000000099',
        {
          incidentId: '00000000-0000-4000-8000-000000000099',
          question: QUESTIONS.INVESTIGATION_SUMMARY,
          intent: 'INVESTIGATION_SUMMARY',
          model: TEST_MODEL,
        },
        snapshot,
      ),
    /Investigation assistant incident ID does not match context/,
  );

  console.log('PASS: assistant rejects mismatched incident/context identity');

  console.log('Testing empty-question validation...');

  await assert.rejects(
    () =>
      intelligenceApi.answer(
        DEMO_INCIDENT_ID,
        {
          incidentId: DEMO_INCIDENT_ID,
          question: '   ',
          intent: 'INVESTIGATION_SUMMARY',
          model: TEST_MODEL,
        },
        snapshot,
      ),
    /Investigation assistant question is required/,
  );

  console.log('PASS: assistant rejects empty questions');

  console.log('Testing source persistence after assistant requests...');

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

  console.log('PASS: assistant does not modify incident state');
  console.log('PASS: persisted events remain unchanged');
  console.log('PASS: persisted evidence remains unchanged');
  console.log('PASS: persisted investigation remains unchanged');

  console.log('STEP 6.6 INVESTIGATION ASSISTANT INTEGRATION VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error('\n===== STEP 6.6 INVESTIGATION ASSISTANT INTEGRATION FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
