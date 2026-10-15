export type DemoScenarioId = 'checkout' | 'payment' | 'inventory' | 'search' | 'notification' | 'authentication' | 'orders' | 'shipping';

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


  search: {
    id: 'search',
    incidentId: '00000000-0000-4000-8000-000000000004',
    serviceName: 'sentinelai-demo-search',
    serviceVersion: '0.1.0',
    title: 'Search API Cluster Availability Failure',
    description:
      'Search requests are failing because the search cluster became unavailable.',
    failureMode: 'search-cluster-outage',
    workloadPath: '/search',
    workloadName: 'Search API',
    successMessage: 'Search request completed successfully.',
    failureErrorCode: 'SEARCH_CLUSTER_UNAVAILABLE',
    failureMessage:
      'Search request could not complete because the search cluster is unavailable.',
    dependency: 'search-cluster',
    failureMetricName: 'search',
    signalTitle: 'Search cluster availability failure',
    signalDescription:
      'Controlled search telemetry shows requests failing because the search cluster is unavailable.',
    evidenceTitle: 'Search application observed cluster connection failures',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the search workload observed repeated search cluster connection failures.',
  },

  notification: {
    id: 'notification',
    incidentId: '00000000-0000-4000-8000-000000000005',
    serviceName: 'sentinelai-demo-notification',
    serviceVersion: '0.1.0',
    title: 'Notification Service Queue Backlog',
    description:
      'Notification delivery is degraded because the message queue has accumulated a large backlog.',
    failureMode: 'queue-backlog',
    workloadPath: '/notification',
    workloadName: 'Notification Delivery',
    successMessage: 'Notification processed successfully.',
    failureErrorCode: 'NOTIFICATION_QUEUE_BACKLOG',
    failureMessage:
      'Notification processing is delayed because the message queue has accumulated a large backlog.',
    dependency: 'notification-queue',
    failureMetricName: 'notification',
    signalTitle: 'Notification queue backlog detected',
    signalDescription:
      'Controlled notification telemetry shows queue depth increasing while consumer throughput remains below normal.',
    evidenceTitle: 'Notification service observed queue processing delays',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the notification workload observed elevated queue depth and processing delays.',
  },

  authentication: {
    id: 'authentication',
    incidentId: '00000000-0000-4000-8000-000000000006',
    serviceName: 'sentinelai-demo-authentication',
    serviceVersion: '0.1.0',
    title: 'Authentication Session Store Outage',
    description:
      'Authentication requests are failing because the Redis-backed session store is unavailable.',
    failureMode: 'session-store-outage',
    workloadPath: '/authentication',
    workloadName: 'Authentication',
    successMessage: 'Authentication request completed successfully.',
    failureErrorCode: 'AUTH_SESSION_STORE_UNAVAILABLE',
    failureMessage:
      'Authentication could not complete because the session store is unavailable.',
    dependency: 'redis-session-store',
    failureMetricName: 'authentication',
    signalTitle: 'Authentication session store failure',
    signalDescription:
      'Controlled authentication telemetry shows requests failing because the Redis-backed session store is unavailable.',
    evidenceTitle: 'Authentication service observed Redis session-store failures',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the authentication workload observed session-store connection failures.',
  },

  orders: {
    id: 'orders',
    incidentId: '00000000-0000-4000-8000-000000000007',
    serviceName: 'sentinelai-demo-orders',
    serviceVersion: '0.1.0',
    title: 'Order Service Downstream Timeout',
    description:
      'Order requests are timing out because a downstream fulfillment dependency is responding too slowly.',
    failureMode: 'downstream-timeout',
    workloadPath: '/orders',
    workloadName: 'Order Processing',
    successMessage: 'Order processed successfully.',
    failureErrorCode: 'ORDERS_DOWNSTREAM_TIMEOUT',
    failureMessage:
      'Order processing timed out while waiting for the downstream fulfillment service.',
    dependency: 'fulfillment-service',
    failureMetricName: 'orders',
    signalTitle: 'Order downstream timeout spike',
    signalDescription:
      'Controlled order telemetry shows elevated request latency and timeouts from the downstream fulfillment dependency.',
    evidenceTitle: 'Order service observed downstream fulfillment timeouts',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the order workload observed repeated downstream timeout responses.',
  },

  shipping: {
    id: 'shipping',
    incidentId: '00000000-0000-4000-8000-000000000008',
    serviceName: 'sentinelai-demo-shipping',
    serviceVersion: '0.1.0',
    title: 'Shipping Carrier API Degradation',
    description:
      'Shipping requests are degraded because the external carrier API is intermittently slow and failing.',
    failureMode: 'carrier-api-degradation',
    workloadPath: '/shipping',
    workloadName: 'Shipping',
    successMessage: 'Shipping request completed successfully.',
    failureErrorCode: 'SHIPPING_CARRIER_API_DEGRADED',
    failureMessage:
      'Shipping request was degraded because the external carrier API responded slowly or failed.',
    dependency: 'carrier-api',
    failureMetricName: 'shipping',
    signalTitle: 'Shipping carrier API degradation',
    signalDescription:
      'Controlled shipping telemetry shows elevated latency and failures from the external carrier API.',
    evidenceTitle: 'Shipping service observed carrier API degradation',
    evidenceDescription:
      'Controlled telemetry evidence emitted after the shipping workload observed carrier API timeouts and upstream failures.',
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
