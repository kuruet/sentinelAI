import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { PrismaIncidentDataAccess } from '../src/data-access/prisma-incident-data-access';
import { PrismaIncidentParticipantDataAccess } from '../src/data-access/prisma-incident-participant-data-access';
import { IncidentService } from '../src/services/incident-service';

async function main(): Promise<void> {
  await initializeDemoScenario();

  const incidentDataAccess = new PrismaIncidentDataAccess(prisma);
  const participantDataAccess = new PrismaIncidentParticipantDataAccess(prisma);
  const incidentService = new IncidentService(incidentDataAccess, participantDataAccess);

  const original = await prisma.incident.findUnique({
    where: { id: DEMO_INCIDENT_ID },
    include: {
      participants: true,
      events: true,
      evidence: true,
      investigation: true,
    },
  });

  if (!original) {
    throw new Error('Demo incident was not initialized.');
  }

  if (original.status !== 'INVESTIGATING') {
    throw new Error(`Demo incident must begin in INVESTIGATING state, got ${original.status}.`);
  }

  const originalCounts = {
    participants: original.participants.length,
    events: original.events.length,
    evidence: original.evidence.length,
    investigation: original.investigation ? 1 : 0,
  };

  if (
    originalCounts.participants !== 1 ||
    originalCounts.events !== 6 ||
    originalCounts.evidence !== 5 ||
    originalCounts.investigation !== 1
  ) {
    throw new Error(`Unexpected demo data counts: ${JSON.stringify(originalCounts)}`);
  }

  const resolved = await incidentService.updateIncidentLifecycle(DEMO_INCIDENT_ID, {
    status: 'RESOLVED',
  });

  if (!resolved || resolved.status !== 'RESOLVED') {
    throw new Error('INVESTIGATING -> RESOLVED transition failed.');
  }

  console.log('PASS: INVESTIGATING -> RESOLVED');

  if (!resolved.resolvedAt) {
    throw new Error('Resolved transition did not set resolvedAt.');
  }

  if (resolved.closedAt !== null) {
    throw new Error('Resolved incident must not have closedAt set.');
  }

  console.log('PASS: resolvedAt recorded');
  console.log('PASS: closedAt remains null');

  const closed = await incidentService.updateIncidentLifecycle(DEMO_INCIDENT_ID, {
    status: 'CLOSED',
  });

  if (!closed || closed.status !== 'CLOSED') {
    throw new Error('RESOLVED -> CLOSED transition failed.');
  }

  console.log('PASS: RESOLVED -> CLOSED');

  if (!closed.resolvedAt || !closed.closedAt) {
    throw new Error('Closed transition did not preserve/set lifecycle timestamps.');
  }

  if (new Date(closed.closedAt) < new Date(closed.resolvedAt)) {
    throw new Error('closedAt cannot be earlier than resolvedAt.');
  }

  console.log('PASS: lifecycle timestamps preserved');

  let invalidTransitionRejected = false;

  try {
    await incidentService.updateIncidentLifecycle(DEMO_INCIDENT_ID, { status: 'INVESTIGATING' });
  } catch (error: unknown) {
    invalidTransitionRejected =
      error instanceof Error && error.message.includes('Invalid incident lifecycle transition');
  }

  if (!invalidTransitionRejected) {
    throw new Error('CLOSED -> INVESTIGATING was not rejected.');
  }

  console.log('PASS: invalid CLOSED -> INVESTIGATING transition rejected');

  const afterLifecycle = await prisma.incident.findUnique({
    where: { id: DEMO_INCIDENT_ID },
    include: {
      participants: true,
      events: true,
      evidence: true,
      investigation: true,
    },
  });

  if (!afterLifecycle) {
    throw new Error('Demo incident disappeared after lifecycle transitions.');
  }

  const afterCounts = {
    participants: afterLifecycle.participants.length,
    events: afterLifecycle.events.length,
    evidence: afterLifecycle.evidence.length,
    investigation: afterLifecycle.investigation ? 1 : 0,
  };

  if (
    afterCounts.participants !== originalCounts.participants ||
    afterCounts.events !== originalCounts.events ||
    afterCounts.evidence !== originalCounts.evidence ||
    afterCounts.investigation !== originalCounts.investigation
  ) {
    throw new Error(
      `Lifecycle transition changed related demo data: before=${JSON.stringify(
        originalCounts,
      )}, after=${JSON.stringify(afterCounts)}`,
    );
  }

  console.log('PASS: participants preserved');
  console.log('PASS: events preserved');
  console.log('PASS: evidence preserved');
  console.log('PASS: investigation preserved');

  await initializeDemoScenario();

  const reset = await prisma.incident.findUnique({
    where: { id: DEMO_INCIDENT_ID },
  });

  if (!reset || reset.status !== 'INVESTIGATING') {
    throw new Error('Demo scenario was not restored to INVESTIGATING.');
  }

  if (reset.resolvedAt !== null || reset.closedAt !== null) {
    throw new Error('Demo scenario reset retained lifecycle timestamps.');
  }

  console.log('PASS: deterministic demo reset restored INVESTIGATING');
  console.log('PASS: lifecycle timestamps reset');
  console.log('STEP 6.3 INCIDENT LIFECYCLE VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
