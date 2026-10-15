import test from 'node:test';
import assert from 'node:assert/strict';

import type { IntelligenceContextSnapshot } from '../intelligence';
import type { IncidentDataAccess } from '../data-access/incident-data-access';
import type { IncidentAuthorizationService } from './incident-authorization-service';
import type { IntelligenceContextService } from './intelligence-context-service';
import { HistoricalIncidentSimilarityService } from './historical-incident-similarity-service';
import { HistoricalIncidentIntelligenceService } from './historical-incident-intelligence-service';

type Dependencies = ConstructorParameters<
  typeof HistoricalIncidentIntelligenceService
>;

function makeSnapshot(
  id: string,
  title = 'Checkout database connection timeout',
): IntelligenceContextSnapshot {
  const timestamp = '2026-10-01T10:00:00.000Z';

  return {
    context: {
      incident: {
        id,
        title,
        description: title,
        status: 'INVESTIGATING',
        severity: 'HIGH',
        priority: 2,
        startedAt: timestamp,
        resolvedAt: null,
        closedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      events: [],
      evidence: [],
      investigation: null,
    },
    metadata: {
      generatedAt: timestamp,
      eventCount: 0,
      evidenceCount: 0,
      hasInvestigation: false,
    },
  };
}

function makeService(options: {
  listAccessibleToUser: (query: { page: number; limit: number }, userId: string) => Promise<{
    items: Array<{ id: string }>;
    total: number;
  }>;
  requireReadAccess?: (incidentId: string, userId: string) => Promise<unknown>;
  buildContext: (incidentId: string) => Promise<IntelligenceContextSnapshot | null>;
}) {
  const dataAccess = {
    listAccessibleToUser: options.listAccessibleToUser,
  } as unknown as Dependencies[0];

  const authorization = {
    requireReadAccess: options.requireReadAccess ?? (async () => undefined),
  } as unknown as Dependencies[1];

  const contextService = {
    buildContext: options.buildContext,
  } as unknown as Dependencies[2];

  return new HistoricalIncidentIntelligenceService(
    dataAccess,
    authorization,
    contextService,
    new HistoricalIncidentSimilarityService(),
  );
}

test('authorizes the current incident before loading its context', async () => {
  const order: string[] = [];
  const snapshots = new Map([
    ['current', makeSnapshot('current')],
    ['historical', makeSnapshot('historical')],
  ]);

  const service = makeService({
    requireReadAccess: async () => {
      order.push('authorize');
    },
    buildContext: async (id) => {
      order.push(`context:${id}`);
      return snapshots.get(id) ?? null;
    },
    listAccessibleToUser: async () => {
      order.push('list-candidates');
      return {
        items: [{ id: 'current' }, { id: 'historical' }],
        total: 2,
      };
    },
  });

  await service.findSimilarIncidents('current', 'user-1');

  assert.equal(order[0], 'authorize');
  assert.ok(order.indexOf('authorize') < order.indexOf('context:current'));
  assert.ok(order.indexOf('context:current') < order.indexOf('list-candidates'));
});

test('does not load contexts or list candidates when authorization fails', async () => {
  let contextCalls = 0;
  let listCalls = 0;

  const service = makeService({
    requireReadAccess: async () => {
      throw new Error('Forbidden');
    },
    buildContext: async () => {
      contextCalls++;
      return null;
    },
    listAccessibleToUser: async () => {
      listCalls++;
      return { items: [], total: 0 };
    },
  });

  await assert.rejects(
    service.findSimilarIncidents('private-incident', 'user-1'),
    /Forbidden/,
  );

  assert.equal(contextCalls, 0);
  assert.equal(listCalls, 0);
});

test('loads only listed candidate IDs and excludes the current incident', async () => {
  const loadedIds: string[] = [];
  const snapshots = new Map([
    ['current', makeSnapshot('current')],
    ['historical', makeSnapshot('historical')],
  ]);

  const service = makeService({
    buildContext: async (id) => {
      loadedIds.push(id);
      return snapshots.get(id) ?? null;
    },
    listAccessibleToUser: async () => ({
      items: [
        { id: 'current' },
        { id: 'historical' },
        { id: 'missing-context' },
      ],
      total: 3,
    }),
  });

  const result = await service.findSimilarIncidents('current', 'user-1');

  assert.deepEqual(loadedIds, ['current', 'historical', 'missing-context']);
  assert.equal(result.currentIncidentId, 'current');
  assert.equal(result.candidatesExamined, 2);
  assert.deepEqual(result.matches.map((match) => match.incidentId), ['historical']);
});

test('loads historical contexts in batches of at most ten', async () => {
  const candidateIds = Array.from({ length: 25 }, (_, index) => `candidate-${index}`);
  const snapshots = new Map<string, IntelligenceContextSnapshot>([
    ['current', makeSnapshot('current')],
    ...candidateIds.map((id) => [id, makeSnapshot(id)] as const),
  ]);

  let activeCandidateLoads = 0;
  let maxActiveCandidateLoads = 0;

  const service = makeService({
    listAccessibleToUser: async () => ({
      items: [{ id: 'current' }, ...candidateIds.map((id) => ({ id }))],
      total: candidateIds.length + 1,
    }),
    buildContext: async (id) => {
      if (id !== 'current') {
        activeCandidateLoads++;
        maxActiveCandidateLoads = Math.max(
          maxActiveCandidateLoads,
          activeCandidateLoads,
        );

        await new Promise((resolve) => setTimeout(resolve, 2));
        activeCandidateLoads--;
      }

      return snapshots.get(id) ?? null;
    },
  });

  const result = await service.findSimilarIncidents('current', 'user-1');

  assert.equal(result.candidatesExamined, 25);
  assert.ok(maxActiveCandidateLoads <= 10);
});

test('continues pagination when more than one hundred incidents are accessible', async () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: `incident-${index}`,
  }));
  const secondPage = Array.from({ length: 5 }, (_, index) => ({
    id: `incident-${100 + index}`,
  }));

  const snapshots = new Map<string, IntelligenceContextSnapshot>();
  for (const item of [...firstPage, ...secondPage]) {
    snapshots.set(item.id, makeSnapshot(item.id));
  }

  const pagesRequested: number[] = [];

  const service = makeService({
    listAccessibleToUser: async ({ page }) => {
      pagesRequested.push(page);

      return {
        items: page === 1 ? firstPage : secondPage,
        total: 105,
      };
    },
    buildContext: async (id) => snapshots.get(id) ?? null,
  });

  const result = await service.findSimilarIncidents('incident-0', 'user-1');

  assert.deepEqual(pagesRequested, [1, 2]);
  assert.equal(result.candidatesExamined, 104);
});

test('skips historical candidates whose access has been revoked', async () => {
  const loadedIds: string[] = [];
  const snapshots = new Map([
    ['current', makeSnapshot('current')],
    ['accessible', makeSnapshot('accessible')],
    ['revoked', makeSnapshot('revoked')],
  ]);

  const service = makeService({
    requireReadAccess: async (id) => {
      if (id === 'revoked') {
        const { AppError } = await import('../errors/app-error.js');
        throw new AppError(
          403,
          'FORBIDDEN',
          'Access has been revoked.',
        );
      }
    },
    listAccessibleToUser: async () => ({
      items: [{ id: 'current' }, { id: 'accessible' }, { id: 'revoked' }],
      total: 3,
    }),
    buildContext: async (id) => {
      loadedIds.push(id);
      return snapshots.get(id) ?? null;
    },
  });

  const result = await service.findSimilarIncidents('current', 'user-1');

  assert.ok(loadedIds.includes('current'));
  assert.ok(loadedIds.includes('accessible'));
  assert.ok(!loadedIds.includes('revoked'));
  assert.deepEqual(
    result.matches.map((match) => match.incidentId),
    ['accessible'],
  );
});

test('propagates unexpected candidate authorization failures', async () => {
  const loadedIds: string[] = [];

  const service = makeService({
    requireReadAccess: async (id) => {
      if (id === 'candidate') {
        throw new Error('Authorization data store unavailable');
      }
    },
    listAccessibleToUser: async () => ({
      items: [{ id: 'current' }, { id: 'candidate' }],
      total: 2,
    }),
    buildContext: async (id) => {
      loadedIds.push(id);
      return makeSnapshot(id);
    },
  });

  await assert.rejects(
    service.findSimilarIncidents('current', 'user-1'),
    /Authorization data store unavailable/,
  );

  assert.deepEqual(loadedIds, ['current']);
});
