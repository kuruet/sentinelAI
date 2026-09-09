import assert from 'node:assert/strict';

import { env } from '../src/config/env';
import { prisma } from '../src/infrastructure/database';
import {
  DEMO_INCIDENT_IDS,
  DEMO_USER_ID,
  initializeDemoScenario,
} from '../src/demo/demo-scenario';
import { buildApp } from '../src/index';

const UNAUTHORIZED_USER_ID = '00000000-0000-4000-8000-000000000099';

async function main(): Promise<void> {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured for the demo reset HTTP test.');
  }

  await initializeDemoScenario();

  const app = await buildApp();

  try {
    console.log('Testing unauthenticated demo reset request...');

    const unauthenticated = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/reset',
    });

    assert.equal(unauthenticated.statusCode, 401);

    console.log('PASS: unauthenticated demo reset rejected with 401');

    console.log('Testing authenticated but unauthorized demo reset request...');

    const unauthorizedToken = await app.jwt.sign({
      sub: UNAUTHORIZED_USER_ID,
    });

    const unauthorized = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/reset',
      headers: {
        authorization: `Bearer ${unauthorizedToken}`,
      },
    });

    assert.equal(unauthorized.statusCode, 403);

    console.log('PASS: unauthorized demo reset rejected with 403');

    console.log('Testing authorized demo reset request...');

    const authorizedToken = await app.jwt.sign({
      sub: DEMO_USER_ID,
    });

    const authorized = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/reset',
      headers: {
        authorization: `Bearer ${authorizedToken}`,
      },
    });

    assert.equal(authorized.statusCode, 200);

    const payload = JSON.parse(authorized.body) as {
      status: string;
      data: {
        reset: boolean;
        initialized: boolean;
        incidentIds: string[];
        scenarios: Array<{
          id: string;
          incidentId: string;
          title: string;
          serviceName: string;
        }>;
      };
    };

    assert.equal(payload.status, 'ok');
    assert.equal(payload.data.reset, true);
    assert.equal(payload.data.initialized, true);

    assert.deepEqual(
      [...payload.data.incidentIds].sort(),
      [...DEMO_INCIDENT_IDS].sort(),
    );

    assert.equal(payload.data.scenarios.length, 3);

    const incidents = await prisma.incident.findMany({
      where: {
        id: {
          in: DEMO_INCIDENT_IDS,
        },
      },
      include: {
        events: true,
        evidence: true,
        investigation: true,
        participants: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    assert.equal(incidents.length, 3);

    for (const incident of incidents) {
      assert.equal(incident.status, 'INVESTIGATING');
      assert.equal(incident.severity, 'HIGH');
      assert.equal(incident.events.length, 6);
      assert.equal(incident.evidence.length, 5);
      assert.ok(incident.investigation);
      assert.equal(incident.participants.length, 1);
      assert.equal(incident.participants[0]?.userId, DEMO_USER_ID);

      assert.deepEqual(
        incident.events.map((event) => event.sequence).sort((a, b) => a - b),
        [1, 2, 3, 4, 5, 6],
      );
    }

    console.log('PASS: authorized demo reset returned 200');
    console.log('PASS: response identifies exactly three demo incidents');
    console.log('PASS: all three incidents were recreated');
    console.log('PASS: each incident contains six deterministic events');
    console.log('PASS: each incident contains five evidence records');
    console.log('PASS: each incident contains an investigation');
    console.log('PASS: each incident contains one demo participant');

    console.log('STEP DEMO RESET HTTP VERIFICATION PASSED');
  } finally {
    await app.close();
  }
}

main()
  .catch((error: unknown) => {
    console.error('\n===== DEMO RESET HTTP VERIFICATION FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
