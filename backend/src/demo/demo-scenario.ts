import { prisma } from '../infrastructure/database';

export const DEMO_INCIDENT_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000010';

const baseTime = new Date('2026-09-01T10:00:00.000Z');

export async function resetDemoScenario(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    await tx.investigation.deleteMany({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    await tx.evidence.deleteMany({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    await tx.incidentEvent.deleteMany({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    await tx.incidentParticipant.deleteMany({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    await tx.incident.deleteMany({
      where: { id: DEMO_INCIDENT_ID },
    });
  });
}

export async function initializeDemoScenario(): Promise<{
  incidentId: string;
}> {
  await resetDemoScenario();

  await prisma.$transaction(async (tx) => {
    await tx.incident.create({
      data: {
        id: DEMO_INCIDENT_ID,
        title: 'Checkout API Elevated Error Rate',
        description:
          'Production checkout requests are experiencing elevated 5xx responses following a configuration change.',
        status: 'INVESTIGATING',
        severity: 'HIGH',
        priority: 1,
        startedAt: new Date(baseTime),
      },
    });

    await tx.incidentParticipant.create({
      data: {
        incidentId: DEMO_INCIDENT_ID,
        userId: DEMO_USER_ID,
        role: 'INCIDENT_COMMANDER',
      },
    });

    const events = [
      {
        sequence: 1,
        eventType: 'ALERT' as const,
        offsetMinutes: 0,
        title: 'Checkout error-rate alert fired',
        description:
          'The checkout service exceeded the configured 5xx error-rate threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC' as const,
        offsetMinutes: 5,
        title: 'Checkout 5xx rate increased',
        description:
          'The checkout API error rate increased sharply while request volume remained within normal range.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT' as const,
        offsetMinutes: 10,
        title: 'Configuration deployment detected',
        description:
          'A production configuration deployment completed shortly before the error-rate increase.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG' as const,
        offsetMinutes: 15,
        title: 'Database connection errors observed',
        description:
          'Application logs contain repeated database connection failures from checkout workers.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE' as const,
        offsetMinutes: 20,
        title: 'Database pool configuration identified',
        description:
          'The recent configuration change modified the checkout service database connection-pool settings.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL' as const,
        offsetMinutes: 30,
        title: 'Investigation narrowed to configuration change',
        description:
          'Responders identified the recent database pool configuration as the leading investigation target.',
        source: 'incident-response',
      },
    ];

    for (const event of events) {
      const occurredAt = new Date(
        baseTime.getTime() + event.offsetMinutes * 60_000,
      );

      await tx.incidentEvent.create({
        data: {
          incidentId: DEMO_INCIDENT_ID,
          eventType: event.eventType,
          occurredAt,
          sequence: event.sequence,
          title: event.title,
          description: event.description,
          source: event.source,
          metadata: {
            demoScenario: 'checkout-api-config-regression',
            deterministic: true,
          },
        },
      });
    }

    const evidence = [
      {
        evidenceType: 'ALERT' as const,
        title: 'Checkout error-rate alert',
        description:
          'Alert showing the checkout 5xx rate crossing the production threshold.',
        source: 'monitoring',
        sourceRef: 'alert:checkout-5xx-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC' as const,
        title: 'Checkout error-rate metric',
        description:
          'Metric snapshot showing elevated 5xx responses with stable request volume.',
        source: 'metrics',
        sourceRef: 'metric:checkout-5xx-rate',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT' as const,
        title: 'Configuration deployment record',
        description:
          'Deployment record for the configuration change immediately preceding the incident.',
        source: 'deployment-system',
        sourceRef: 'deploy:checkout-config-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG' as const,
        title: 'Checkout worker database errors',
        description:
          'Representative application log evidence showing database connection failures.',
        source: 'application-logs',
        sourceRef: 'logs:checkout-db-errors',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION' as const,
        title: 'Database pool configuration diff',
        description:
          'Configuration diff identifying the database connection-pool change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:checkout-db-pool',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ];

    for (const item of evidence) {
      const occurredAt = new Date(
        baseTime.getTime() + item.offsetMinutes * 60_000,
      );

      await tx.evidence.create({
        data: {
          incidentId: DEMO_INCIDENT_ID,
          evidenceType: item.evidenceType,
          title: item.title,
          description: item.description,
          source: item.source,
          sourceRef: item.sourceRef,
          collectedAt: occurredAt,
          occurredAt,
          contentHash: `demo-${item.sourceRef}`,
          trustLevel: item.trustLevel,
          metadata: {
            demoScenario: 'checkout-api-config-regression',
            deterministic: true,
          },
        },
      });
    }

    await tx.investigation.create({
      data: {
        incidentId: DEMO_INCIDENT_ID,
        summary:
          'Investigation indicates that a recent database connection-pool configuration change is the leading explanation for the checkout error spike.',
        startedAt: new Date(baseTime.getTime() + 15 * 60_000),
      },
    });
  });

  return { incidentId: DEMO_INCIDENT_ID };
}
