import { prisma } from '../src/infrastructure/database';
import {
  DEMO_INCIDENT_ID,
  DEMO_USER_ID,
  initializeDemoScenario,
} from '../src/demo/demo-scenario';

async function main(): Promise<void> {
  const result = await initializeDemoScenario();

  const incident = await prisma.incident.findUnique({
    where: { id: result.incidentId },
    include: {
      participants: true,
      events: { orderBy: { sequence: 'asc' } },
      evidence: { orderBy: { occurredAt: 'asc' } },
      investigation: true,
    },
  });

  if (!incident) {
    throw new Error('Demo incident was not created.');
  }

  const checks = [
    ['incident id', incident.id === DEMO_INCIDENT_ID],
    ['incident status', incident.status === 'INVESTIGATING'],
    ['incident severity', incident.severity === 'HIGH'],
    ['commander', incident.participants.some(
      (participant) =>
        participant.userId === DEMO_USER_ID &&
        participant.role === 'INCIDENT_COMMANDER',
    )],
    ['event count', incident.events.length === 6],
    ['event sequence', incident.events.every(
      (event, index) => event.sequence === index + 1,
    )],
    ['chronological events', incident.events.every(
      (event, index, events) =>
        index === 0 || event.occurredAt >= events[index - 1].occurredAt,
    )],
    ['evidence count', incident.evidence.length === 5],
    ['investigation', incident.investigation !== null],
  ] as const;

  for (const [name, passed] of checks) {
    if (!passed) {
      throw new Error(`Demo scenario check failed: ${name}`);
    }

    console.log(`PASS: ${name}`);
  }

  const secondRun = await initializeDemoScenario();

  if (secondRun.incidentId !== DEMO_INCIDENT_ID) {
    throw new Error('Demo scenario identifier was not deterministic.');
  }

  const counts = await Promise.all([
    prisma.incident.count({ where: { id: DEMO_INCIDENT_ID } }),
    prisma.incidentParticipant.count({ where: { incidentId: DEMO_INCIDENT_ID } }),
    prisma.incidentEvent.count({ where: { incidentId: DEMO_INCIDENT_ID } }),
    prisma.evidence.count({ where: { incidentId: DEMO_INCIDENT_ID } }),
    prisma.investigation.count({ where: { incidentId: DEMO_INCIDENT_ID } }),
  ]);

  const expected = [1, 1, 6, 5, 1];

  for (let index = 0; index < expected.length; index += 1) {
    if (counts[index] !== expected[index]) {
      throw new Error(
        `Repeatability check failed at index ${index}: expected ${expected[index]}, got ${counts[index]}.`,
      );
    }
  }

  console.log('PASS: deterministic repeat initialization');
  console.log(`PASS: demo incident ${DEMO_INCIDENT_ID}`);
  console.log('STEP 6.2 DEMO SCENARIO VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

