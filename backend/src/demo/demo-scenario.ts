import { prisma } from '../infrastructure/database';

export const DEMO_INCIDENT_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_PAYMENT_INCIDENT_ID = '00000000-0000-4000-8000-000000000002';
export const DEMO_INVENTORY_INCIDENT_ID = '00000000-0000-4000-8000-000000000003';
export const DEMO_SEARCH_INCIDENT_ID = '00000000-0000-4000-8000-000000000004';
export const DEMO_NOTIFICATION_INCIDENT_ID = '00000000-0000-4000-8000-000000000005';
export const DEMO_AUTHENTICATION_INCIDENT_ID = '00000000-0000-4000-8000-000000000006';
export const DEMO_ORDERS_INCIDENT_ID = '00000000-0000-4000-8000-000000000007';
export const DEMO_SHIPPING_INCIDENT_ID = '00000000-0000-4000-8000-000000000008';
export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000010';

export type DemoScenarioId = 'checkout' | 'payment' | 'inventory' | 'search' | 'notification' | 'authentication' | 'orders' | 'shipping';

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

  search: {
    id: 'search',
    incidentId: DEMO_SEARCH_INCIDENT_ID,
    serviceName: 'sentinelai-demo-search',
    title: 'Search API Cluster Availability Failure',
    description:
      'Search requests are failing because the search cluster became unavailable.',
    scenarioKey: 'search-api-cluster-outage',
    severity: 'HIGH',
    priority: 4,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Search error-rate alert fired',
        description: 'The search service exceeded the configured 5xx error-rate threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Search failures increased',
        description: 'Search request failures increased sharply while traffic remained within the expected range.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Search deployment completed',
        description: 'A search service deployment completed shortly before the cluster failures increased.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Search cluster connection errors observed',
        description: 'Application logs contain repeated connection failures when contacting the search cluster.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Search cluster endpoint configuration identified',
        description: 'The investigation identified a recent search cluster endpoint configuration change.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to search dependency',
        description: 'Responders identified the search cluster as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Search error-rate alert',
        description: 'Alert showing search failures crossing the production threshold.',
        source: 'monitoring',
        sourceRef: 'alert:search-5xx-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Search failure metric',
        description: 'Metric snapshot showing elevated search failures with stable request volume.',
        source: 'metrics',
        sourceRef: 'metric:search-failures',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Search deployment record',
        description: 'Deployment record immediately preceding the search cluster failure spike.',
        source: 'deployment-system',
        sourceRef: 'deploy:search-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Search cluster connection errors',
        description: 'Representative application logs showing repeated search cluster connection failures.',
        source: 'application-logs',
        sourceRef: 'logs:search-cluster',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Search endpoint configuration diff',
        description: 'Configuration diff identifying the search cluster endpoint change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:search-endpoint',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that the search cluster availability regression is the leading explanation for the search failure spike.',
    investigationOffsetMinutes: 15,
  },

  notification: {
    id: 'notification',
    incidentId: DEMO_NOTIFICATION_INCIDENT_ID,
    serviceName: 'sentinelai-demo-notification',
    title: 'Notification Service Queue Backlog',
    description:
      'Notification delivery is degraded because the message queue has accumulated a large backlog.',
    scenarioKey: 'notification-queue-backlog',
    severity: 'HIGH',
    priority: 5,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Notification queue depth alert fired',
        description: 'The notification queue exceeded the configured backlog threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Queue depth increased rapidly',
        description: 'Pending notification messages increased while consumer throughput remained below normal.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Notification consumer deployment detected',
        description: 'A notification consumer deployment completed shortly before queue depth increased.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Notification processing delays observed',
        description: 'Application logs show delayed message processing and repeated consumer retries.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Consumer concurrency configuration identified',
        description: 'The investigation identified a recent change to notification consumer concurrency.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to queue consumers',
        description: 'Responders identified reduced consumer throughput as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Notification queue backlog alert',
        description: 'Alert showing queue depth crossing the safe threshold.',
        source: 'monitoring',
        sourceRef: 'alert:notification-queue-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Notification queue depth metric',
        description: 'Metric snapshot showing rapid queue growth and reduced consumer throughput.',
        source: 'metrics',
        sourceRef: 'metric:notification-queue-depth',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Notification consumer deployment record',
        description: 'Deployment record preceding the queue backlog increase.',
        source: 'deployment-system',
        sourceRef: 'deploy:notification-consumer-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Notification consumer retry evidence',
        description: 'Representative logs showing delayed processing and repeated consumer retries.',
        source: 'application-logs',
        sourceRef: 'logs:notification-retries',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Notification consumer configuration diff',
        description: 'Configuration diff identifying the consumer concurrency change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:notification-concurrency',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that reduced notification consumer throughput is the leading explanation for the queue backlog.',
    investigationOffsetMinutes: 15,
  },

  authentication: {
    id: 'authentication',
    incidentId: DEMO_AUTHENTICATION_INCIDENT_ID,
    serviceName: 'sentinelai-demo-authentication',
    title: 'Authentication Session Store Outage',
    description:
      'Authentication requests are failing because the Redis-backed session store is unavailable.',
    scenarioKey: 'authentication-session-store-outage',
    severity: 'HIGH',
    priority: 6,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Authentication failure alert fired',
        description: 'Authentication failures exceeded the configured production threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Login failure rate increased',
        description: 'Authentication failures increased sharply while login traffic remained normal.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Authentication deployment detected',
        description: 'An authentication service deployment completed shortly before failures increased.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Redis session-store errors observed',
        description: 'Application logs contain repeated connection failures to the Redis session store.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Session-store configuration identified',
        description: 'The investigation identified a recent Redis session-store configuration change.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to Redis',
        description: 'Responders identified the Redis session store as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Authentication failure alert',
        description: 'Alert showing authentication failures crossing the production threshold.',
        source: 'monitoring',
        sourceRef: 'alert:authentication-failures-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Authentication failure metric',
        description: 'Metric snapshot showing elevated login failures with stable request volume.',
        source: 'metrics',
        sourceRef: 'metric:authentication-failures',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Authentication deployment record',
        description: 'Deployment record immediately preceding the Redis session-store failure.',
        source: 'deployment-system',
        sourceRef: 'deploy:authentication-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Redis session-store connection errors',
        description: 'Representative logs showing repeated Redis connection failures.',
        source: 'application-logs',
        sourceRef: 'logs:authentication-redis',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Session-store configuration diff',
        description: 'Configuration diff identifying the Redis session-store change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:authentication-redis',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that the Redis-backed session store outage is the leading explanation for the authentication failure spike.',
    investigationOffsetMinutes: 15,
  },

  orders: {
    id: 'orders',
    incidentId: DEMO_ORDERS_INCIDENT_ID,
    serviceName: 'sentinelai-demo-orders',
    title: 'Order Service Downstream Timeout',
    description:
      'Order creation requests are timing out because the downstream fulfillment service is responding too slowly.',
    scenarioKey: 'orders-downstream-timeout',
    severity: 'HIGH',
    priority: 7,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Order timeout alert fired',
        description: 'The order service exceeded the configured downstream timeout threshold.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Order response latency increased',
        description: 'Order API latency increased sharply while incoming traffic remained stable.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Order service deployment detected',
        description: 'An order service deployment completed shortly before downstream timeouts increased.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Fulfillment timeout errors observed',
        description: 'Application logs contain repeated timeout errors when calling the fulfillment service.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Downstream timeout configuration identified',
        description: 'The investigation identified a recent change to the fulfillment request timeout.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to fulfillment dependency',
        description: 'Responders identified the fulfillment service as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Order timeout alert',
        description: 'Alert showing downstream order timeouts crossing the production threshold.',
        source: 'monitoring',
        sourceRef: 'alert:orders-timeout-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Order latency metric',
        description: 'Metric snapshot showing elevated order latency with stable request volume.',
        source: 'metrics',
        sourceRef: 'metric:orders-latency',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Order deployment record',
        description: 'Deployment record immediately preceding the downstream timeout increase.',
        source: 'deployment-system',
        sourceRef: 'deploy:orders-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Fulfillment timeout evidence',
        description: 'Representative logs showing fulfillment-service request timeouts.',
        source: 'application-logs',
        sourceRef: 'logs:orders-fulfillment-timeout',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Fulfillment timeout configuration diff',
        description: 'Configuration diff identifying the downstream timeout change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:orders-timeout',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that fulfillment-service latency and the downstream timeout configuration are the leading explanation for the order failures.',
    investigationOffsetMinutes: 15,
  },

  shipping: {
    id: 'shipping',
    incidentId: DEMO_SHIPPING_INCIDENT_ID,
    serviceName: 'sentinelai-demo-shipping',
    title: 'Shipping Carrier API Degradation',
    description:
      'Shipping requests are degraded because the external carrier API is intermittently slow and failing.',
    scenarioKey: 'shipping-carrier-api-degradation',
    severity: 'HIGH',
    priority: 8,
    incidentEvents: [
      {
        sequence: 1,
        eventType: 'ALERT',
        offsetMinutes: 0,
        title: 'Shipping carrier degradation alert fired',
        description: 'Carrier API latency and failure rates exceeded the configured thresholds.',
        source: 'monitoring',
      },
      {
        sequence: 2,
        eventType: 'METRIC',
        offsetMinutes: 5,
        title: 'Carrier response latency increased',
        description: 'External carrier response latency increased sharply with intermittent failures.',
        source: 'metrics',
      },
      {
        sequence: 3,
        eventType: 'DEPLOYMENT',
        offsetMinutes: 10,
        title: 'Shipping deployment detected',
        description: 'A shipping service deployment completed shortly before carrier failures increased.',
        source: 'deployment-system',
      },
      {
        sequence: 4,
        eventType: 'LOG',
        offsetMinutes: 15,
        title: 'Carrier API errors observed',
        description: 'Shipping logs contain repeated timeout and upstream error responses from the carrier API.',
        source: 'application-logs',
      },
      {
        sequence: 5,
        eventType: 'CONFIGURATION_CHANGE',
        offsetMinutes: 20,
        title: 'Carrier integration configuration identified',
        description: 'The investigation identified a recent carrier integration configuration change.',
        source: 'configuration-management',
      },
      {
        sequence: 6,
        eventType: 'MANUAL',
        offsetMinutes: 30,
        title: 'Investigation narrowed to carrier dependency',
        description: 'Responders identified the external carrier API as the leading investigation target.',
        source: 'incident-response',
      },
    ],
    evidence: [
      {
        evidenceType: 'ALERT',
        title: 'Shipping carrier degradation alert',
        description: 'Alert showing carrier API latency and failure rates crossing production thresholds.',
        source: 'monitoring',
        sourceRef: 'alert:shipping-carrier-001',
        offsetMinutes: 0,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'METRIC',
        title: 'Carrier API latency metric',
        description: 'Metric snapshot showing elevated carrier latency and intermittent failures.',
        source: 'metrics',
        sourceRef: 'metric:shipping-carrier-latency',
        offsetMinutes: 5,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'DEPLOYMENT',
        title: 'Shipping deployment record',
        description: 'Deployment record immediately preceding the carrier degradation.',
        source: 'deployment-system',
        sourceRef: 'deploy:shipping-20260901',
        offsetMinutes: 10,
        trustLevel: 'HIGH',
      },
      {
        evidenceType: 'LOG',
        title: 'Carrier API error evidence',
        description: 'Representative logs showing carrier API timeouts and upstream errors.',
        source: 'application-logs',
        sourceRef: 'logs:shipping-carrier',
        offsetMinutes: 15,
        trustLevel: 'MEDIUM',
      },
      {
        evidenceType: 'CONFIGURATION',
        title: 'Carrier integration configuration diff',
        description: 'Configuration diff identifying the recent carrier integration change.',
        source: 'configuration-management',
        sourceRef: 'configdiff:shipping-carrier',
        offsetMinutes: 20,
        trustLevel: 'HIGH',
      },
    ],
    investigationSummary:
      'Investigation indicates that external carrier API degradation is the leading explanation for the shipping latency and failure increase.',
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

