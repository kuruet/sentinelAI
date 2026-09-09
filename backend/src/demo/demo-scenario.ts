import { prisma } from '../infrastructure/database';

export const DEMO_INCIDENT_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_PAYMENT_INCIDENT_ID = '00000000-0000-4000-8000-000000000002';
export const DEMO_INVENTORY_INCIDENT_ID = '00000000-0000-4000-8000-000000000003';
export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000010';

export type DemoScenarioId = 'checkout' | 'payment' | 'inventory';

export interface DemoScenarioDefinition {
  id: DemoScenarioId;
  incidentId: string;
  serviceName: string;
  title: string;
  description: string;
  scenarioKey: string;
  severity: 'HIGH';
  priority: number;
  incidentEvents: Array<{
    sequence: number;
    eventType:
      | 'ALERT'
      | 'LOG'
      | 'METRIC'
      | 'DEPLOYMENT'
      | 'CONFIGURATION_CHANGE'
      | 'MANUAL'
      | 'SYSTEM';
    offsetMinutes: number;
    title: string;
    description: string;
    source: string;
  }>;
  evidence: Array<{
    evidenceType:
      | 'LOG'
      | 'METRIC'
      | 'TRACE'
      | 'ALERT'
      | 'DEPLOYMENT'
      | 'CONFIGURATION'
      | 'DOCUMENT'
      | 'MANUAL'
      | 'OTHER';
    title: string;
    description: string;
    source: string;
    sourceRef: string;
    offsetMinutes: number;
    trustLevel: string;
  }>;
  investigationSummary: string;
  investigationOffsetMinutes: number;
}

const baseTime = new Date('2026-09-01T10:00:00.000Z');

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenarioDefinition> = {
  checkout: {
    id: 'checkout',
    incidentId: DEMO_INCIDENT_ID,
    serviceName: 'sentinelai-demo-checkout',
    title: 'Checkout API Elevated Error Rate',
    description:
      'Production checkout requests are experiencing elevated 5xx responses following a configuration change.',
    scenarioKey: 'checkout-api-config-regression',
    severity: 'HIGH',
    priority: 1,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Checkout error-rate alert fired',
        description: 'The checkout service exceeded the configured 5xx error-rate threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Checkout 5xx rate increased',
        description:
          'The checkout API error rate increased sharply while request volume remained within normal range.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Configuration deployment detected',
        description:
          'A production configuration deployment completed shortly before the error-rate increase.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Database connection errors observed',
        description:
          'Application logs contain repeated database connection failures from checkout workers.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Database pool configuration identified',
        description:
          'The recent configuration change modified the checkout service database connection-pool settings.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to configuration change',
        description:
          'Responders identified the recent database pool configuration as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Checkout error-rate alert',
        description: 'Alert showing the checkout 5xx rate crossing the production threshold.',
        source: 'monitoring',
        sourceRef: 'alert:checkout-5xx-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Checkout error-rate metric',
        description: 'Metric snapshot showing elevated 5xx responses with stable request volume.',
        source: 'metrics',
        sourceRef: 'metric:checkout-5xx-rate',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Configuration deployment record',
        description:
          'Deployment record for the configuration change immediately preceding the incident.',
        source: 'deployment-system',
        sourceRef: 'deploy:checkout-config-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Checkout worker database errors',
        description:
          'Representative application log evidence showing database connection failures.',
        source: 'application-logs',
        sourceRef: 'logs:checkout-db-errors',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Database pool configuration diff',
        description: 'Configuration diff identifying the database connection-pool change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:checkout-db-pool',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that a recent database connection-pool configuration change is the leading explanation for the checkout error spike.',
    investigationOffsetMinutes: 15,
  },

  payment: {
    id: 'payment',
    incidentId: DEMO_PAYMENT_INCIDENT_ID,
    serviceName: 'sentinelai-demo-payment',
    title: 'Payment Service Authorization Failures',
    description:
      'Payment authorization requests are failing at elevated rates after a credential configuration change.',
    scenarioKey: 'payment-api-credential-regression',
    severity: 'HIGH',
    priority: 2,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Payment authorization failure alert fired',
        description:
          'The payment service exceeded the configured authorization failure threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Payment authorization failures increased',
        description:
          'Authorization failures increased sharply while payment request volume remained within normal range.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Payment configuration deployment detected',
        description:
          'A production payment configuration deployment completed shortly before the authorization failures increased.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Payment provider credential errors observed',
        description:
          'Payment service logs contain repeated authentication failures when contacting the payment provider.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Payment provider credential change identified',
        description:
          'The recent configuration change modified the credential reference used by the payment provider integration.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to credential configuration',
        description:
          'Responders identified the recent payment provider credential configuration as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Payment authorization failure alert',
        description:
          'Alert showing payment authorization failures crossing the production threshold.',
        source: 'monitoring',
        sourceRef: 'alert:payment-auth-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Payment authorization failure metric',
        description:
          'Metric snapshot showing elevated authorization failures with stable payment request volume.',
        source: 'metrics',
        sourceRef: 'metric:payment-auth-failures',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Payment configuration deployment record',
        description:
          'Deployment record for the payment configuration change immediately preceding the incident.',
        source: 'deployment-system',
        sourceRef: 'deploy:payment-config-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Payment provider authentication errors',
        description:
          'Representative application log evidence showing payment provider authentication failures.',
        source: 'application-logs',
        sourceRef: 'logs:payment-provider-auth',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Payment credential configuration diff',
        description:
          'Configuration diff identifying the payment provider credential reference change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:payment-provider-credential',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that a recent payment provider credential configuration change is the leading explanation for the authorization failure spike.',
    investigationOffsetMinutes: 15,
  },

  inventory: {
    id: 'inventory',
    incidentId: DEMO_INVENTORY_INCIDENT_ID,
    serviceName: 'sentinelai-demo-inventory',
    title: 'Inventory Service Latency Spike',
    description:
      'Inventory availability requests are experiencing severe latency after a cache configuration change.',
    scenarioKey: 'inventory-api-cache-regression',
    severity: 'HIGH',
    priority: 3,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Inventory latency alert fired',
        description:
          'The inventory service exceeded the configured response-latency threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Inventory response latency increased',
        description:
          'Inventory API latency increased sharply while request volume remained within normal range.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Inventory configuration deployment detected',
        description:
          'A production inventory configuration deployment completed shortly before latency increased.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Inventory cache miss storm observed',
        description:
          'Application logs contain repeated cache-miss warnings followed by slow inventory data lookups.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Inventory cache configuration identified',
        description:
          'The recent configuration change modified the cache settings used by the inventory service.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to cache configuration',
        description:
          'Responders identified the recent inventory cache configuration as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Inventory latency alert',
        description:
          'Alert showing inventory response latency crossing the production threshold.',
        source: 'monitoring',
        sourceRef: 'alert:inventory-latency-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Inventory latency metric',
        description:
          'Metric snapshot showing elevated response latency with stable request volume.',
        source: 'metrics',
        sourceRef: 'metric:inventory-latency',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Inventory configuration deployment record',
        description:
          'Deployment record for the inventory configuration change immediately preceding the latency spike.',
        source: 'deployment-system',
        sourceRef: 'deploy:inventory-config-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Inventory cache-miss evidence',
        description:
          'Representative application log evidence showing repeated cache misses and slow lookups.',
        source: 'application-logs',
        sourceRef: 'logs:inventory-cache-miss',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Inventory cache configuration diff',
        description:
          'Configuration diff identifying the inventory cache configuration change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:inventory-cache',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that a recent inventory cache configuration change is the leading explanation for the latency spike.',
    investigationOffsetMinutes: 15,
  },
};

export const DEMO_INCIDENT_IDS = Object.values(DEMO_SCENARIOS).map(
  (scenario) => scenario.incidentId,
);

export function getDemoScenario(scenarioId: DemoScenarioId): DemoScenarioDefinition {
  return DEMO_SCENARIOS[scenarioId];
}

export async function resetDemoScenario(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({
      where: {
        incidentId: {
          in: DEMO_INCIDENT_IDS,
        },
      },
    });

    await tx.incident.deleteMany({
      where: {
        id: {
          in: DEMO_INCIDENT_IDS,
        },
      },
    });
  });
}

export async function initializeDemoScenario(): Promise<{
  incidentId: string;
}> {
  await resetDemoScenario();

  await prisma.$transaction(async (tx) => {
    for (const scenario of Object.values(DEMO_SCENARIOS)) {
      await tx.incident.create({
        data: {
          id: scenario.incidentId,
          title: scenario.title,
          description: scenario.description,
          status: 'INVESTIGATING',
          severity: scenario.severity,
          priority: scenario.priority,
          startedAt: new Date(baseTime),
        },
      });

      await tx.incidentParticipant.create({
        data: {
          incidentId: scenario.incidentId,
          userId: DEMO_USER_ID,
          role: 'INCIDENT_COMMANDER',
        },
      });

      for (const event of scenario.incidentEvents) {
        const occurredAt = new Date(
          baseTime.getTime() + event.offsetMinutes * 60_000,
        );

        await tx.incidentEvent.create({
          data: {
            incidentId: scenario.incidentId,
            eventType: event.eventType,
            occurredAt,
            sequence: event.sequence,
            title: event.title,
            description: event.description,
            source: event.source,
            metadata: {
              demoScenario: scenario.scenarioKey,
              deterministic: true,
            },
          },
        });
      }

      for (const item of scenario.evidence) {
        const occurredAt = new Date(
          baseTime.getTime() + item.offsetMinutes * 60_000,
        );

        await tx.evidence.create({
          data: {
            incidentId: scenario.incidentId,
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
              demoScenario: scenario.scenarioKey,
              deterministic: true,
            },
          },
        });
      }

      await tx.investigation.create({
        data: {
          incidentId: scenario.incidentId,
          summary: scenario.investigationSummary,
          startedAt: new Date(
            baseTime.getTime() + scenario.investigationOffsetMinutes * 60_000,
          ),
        },
      });
    }
  });

  return { incidentId: DEMO_INCIDENT_ID };
}
