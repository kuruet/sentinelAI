export type DemoScenarioId = 'checkout' | 'payment' | 'inventory';

export interface DemoScenario {
  id: DemoScenarioId;
  incidentId: string;
  serviceName: string;
  serviceVersion: string;
  title: string;
  description: string;
  failureMode: string;
  workloadPath: string;
  workloadName: string;
  successMessage: string;
  failureErrorCode: string;
  failureMessage: string;
  dependency: string;
  failureMetricName: string;
  signalTitle: string;
  signalDescription: string;
  evidenceTitle: string;
  evidenceDescription: string;
}

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenario> = {
  checkout: {
    id: 'checkout',
    incidentId: '00000000-0000-4000-8000-000000000001',
    serviceName: 'sentinelai-demo-checkout',
    serviceVersion: '0.1.0',
    title: 'Checkout API Elevated Error Rate',
    description:
      'Checkout requests are failing because the PostgreSQL dependency is unavailable.',
    failureMode: 'database-unavailable',
    workloadPath: '/checkout',
    workloadName: 'Checkout',
    successMessage: 'Checkout completed successfully.',
    failureErrorCode: 'CHECKOUT_DEPENDENCY_UNAVAILABLE',
    failureMessage:
      'Checkout could not complete because the database is unavailable.',
    dependency: 'postgresql',
    failureMetricName: 'checkout',
    signalTitle: 'Checkout API database dependency failure',
    signalDescription:
      'Controlled checkout telemetry shows requests failing because the PostgreSQL dependency is unavailable.',
    evidenceTitle: 'Checkout application observed database failure',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the checkout workload observed a PostgreSQL dependency failure.',
  },

  payment: {
    id: 'payment',
    incidentId: '00000000-0000-4000-8000-000000000002',
    serviceName: 'sentinelai-demo-payment',
    serviceVersion: '0.1.0',
    title: 'Payment Service Authorization Failures',
    description:
      'Payment authorization requests are failing because the payment provider is rejecting service credentials.',
    failureMode: 'provider-authorization-failure',
    workloadPath: '/payment',
    workloadName: 'Payment Authorization',
    successMessage: 'Payment authorization completed successfully.',
    failureErrorCode: 'PAYMENT_PROVIDER_AUTHORIZATION_FAILED',
    failureMessage:
      'Payment authorization could not complete because the payment provider rejected the service credentials.',
    dependency: 'payment-provider',
    failureMetricName: 'payment',
    signalTitle: 'Payment provider authorization failure',
    signalDescription:
      'Controlled payment telemetry shows authorization requests failing because the payment provider rejected the service credentials.',
    evidenceTitle: 'Payment application observed provider authorization failure',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the payment workload observed a provider authorization failure.',
  },

  inventory: {
    id: 'inventory',
    incidentId: '00000000-0000-4000-8000-000000000003',
    serviceName: 'sentinelai-demo-inventory',
    serviceVersion: '0.1.0',
    title: 'Inventory Service Latency Spike',
    description:
      'Inventory lookups are experiencing elevated latency because the cache is missing and requests fall back to a slow data path.',
    failureMode: 'cache-regression',
    workloadPath: '/inventory',
    workloadName: 'Inventory Lookup',
    successMessage: 'Inventory lookup completed successfully.',
    failureErrorCode: 'INVENTORY_LOOKUP_LATENCY_SPIKE',
    failureMessage:
      'Inventory lookup completed through the slow fallback path because the cache was unavailable.',
    dependency: 'inventory-cache',
    failureMetricName: 'inventory',
    signalTitle: 'Inventory cache regression causing latency',
    signalDescription:
      'Controlled inventory telemetry shows elevated lookup latency caused by cache misses and fallback to the slower data path.',
    evidenceTitle: 'Inventory application observed cache latency regression',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the inventory workload observed cache misses and elevated lookup latency.',
  },
};

export const DEMO_SCENARIO_IDS = Object.keys(
  DEMO_SCENARIOS,
) as DemoScenarioId[];

export function getDemoScenario(id: DemoScenarioId): DemoScenario {
  return DEMO_SCENARIOS[id];
}
