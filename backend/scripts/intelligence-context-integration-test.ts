import assert from 'node:assert/strict';

import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, DEMO_USER_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { PrismaEvidenceDataAccess } from '../src/data-access/prisma-evidence-data-access';
import { PrismaIncidentDataAccess } from '../src/data-access/prisma-incident-data-access';
import { PrismaIncidentEventDataAccess } from '../src/data-access/prisma-incident-event-data-access';
import { PrismaInvestigationDataAccess } from '../src/data-access/prisma-investigation-data-access';
import { IntelligenceContextService } from '../src/services/intelligence-context-service';

async function main(): Promise<void> {
  console.log('Initializing deterministic demo scenario...');
  await initializeDemoScenario();

  const incidentDataAccess = new PrismaIncidentDataAccess(prisma);
  const incidentEventDataAccess = new PrismaIncidentEventDataAccess(prisma);
  const evidenceDataAccess = new PrismaEvidenceDataAccess(prisma);
  const investigationDataAccess = new PrismaInvestigationDataAccess(prisma);

  const contextService = new IntelligenceContextService(
    incidentDataAccess,
    incidentEventDataAccess,
    evidenceDataAccess,
    investigationDataAccess,
  );

  console.log('Building intelligence context from real persistence...');

  const snapshot = await contextService.buildContext(DEMO_INCIDENT_ID);

  assert.ok(snapshot, 'Intelligence context snapshot must exist.');

  assert.equal(snapshot.context.incident.id, DEMO_INCIDENT_ID);
  assert.equal(snapshot.context.incident.status, 'INVESTIGATING');
  assert.equal(snapshot.context.incident.severity, 'HIGH');

  console.log('PASS: authoritative incident loaded');

  assert.equal(snapshot.context.events.length, 6);

  assert.deepEqual(
    snapshot.context.events.map((event) => event.sequence),
    [1, 2, 3, 4, 5, 6],
  );

  assert.deepEqual(
    snapshot.context.events.map((event) => event.eventType),
    ['ALERT', 'METRIC', 'DEPLOYMENT', 'LOG', 'CONFIGURATION_CHANGE', 'MANUAL'],
  );

  console.log('PASS: six persisted events loaded in deterministic order');

  assert.equal(snapshot.context.evidence.length, 5);

  assert.deepEqual(
    snapshot.context.evidence.map((item) => item.evidenceType),
    ['ALERT', 'METRIC', 'DEPLOYMENT', 'LOG', 'CONFIGURATION'],
  );

  console.log('PASS: five persisted evidence records loaded in deterministic order');

  assert.ok(snapshot.context.investigation);
  assert.equal(snapshot.context.investigation.incidentId, DEMO_INCIDENT_ID);

  console.log('PASS: persisted investigation loaded');

  assert.equal(snapshot.metadata.eventCount, 6);
  assert.equal(snapshot.metadata.evidenceCount, 5);
  assert.equal(snapshot.metadata.hasInvestigation, true);

  console.log('PASS: context metadata matches persisted source data');

  const participant = await prisma.incidentParticipant.findFirst({
    where: {
      incidentId: DEMO_INCIDENT_ID,
      userId: DEMO_USER_ID,
      role: 'INCIDENT_COMMANDER',
    },
  });

  assert.ok(participant, 'Deterministic demo commander must remain persisted.');

  console.log('PASS: incident authorization source participant preserved');

  const missingSnapshot = await contextService.buildContext('00000000-0000-4000-8000-000000000099');

  assert.equal(missingSnapshot, null);

  console.log('PASS: missing incident returns null context');

  console.log('STEP 6.4 INTELLIGENCE CONTEXT INTEGRATION VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error('\n===== STEP 6.4 INTELLIGENCE CONTEXT INTEGRATION FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
