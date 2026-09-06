import assert from 'node:assert/strict';

import { env } from '../src/config/env';
import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, DEMO_USER_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { buildApp } from '../src/index';

const UNAUTHORIZED_USER_ID = '00000000-0000-4000-8000-000000000099';

async function main(): Promise<void> {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured for the HTTP authentication test.');
  }

  await initializeDemoScenario();

  const app = await buildApp();

  try {
    console.log('Testing unauthenticated intelligence context request...');

    const unauthenticated = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/context`,
    });

    assert.equal(unauthenticated.statusCode, 401);

    console.log('PASS: unauthenticated request rejected with 401');

    console.log('Testing authenticated but unauthorized intelligence context request...');

    const unauthorizedToken = await app.jwt.sign({
      sub: UNAUTHORIZED_USER_ID,
    });

    const unauthorized = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/context`,
      headers: {
        authorization: `Bearer ${unauthorizedToken}`,
      },
    });

    assert.equal(unauthorized.statusCode, 403);

    console.log('PASS: unauthorized participant rejected with 403');

    console.log('Testing authenticated incident commander intelligence context request...');

    const authorizedToken = await app.jwt.sign({
      sub: DEMO_USER_ID,
    });

    const authorized = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/context`,
      headers: {
        authorization: `Bearer ${authorizedToken}`,
      },
    });

    assert.equal(authorized.statusCode, 200);

    const payload = JSON.parse(authorized.body) as {
      status: string;
      data: {
        context: {
          incident: {
            id: string;
            status: string;
            severity: string;
          };
          events: Array<{
            id: string;
            sequence: number;
            incidentId: string;
          }>;
          evidence: Array<{
            id: string;
            incidentId: string;
          }>;
          investigation: {
            id: string;
            incidentId: string;
          } | null;
        };
        metadata: {
          eventCount: number;
          evidenceCount: number;
          hasInvestigation: boolean;
        };
      };
    };

    assert.equal(payload.status, 'ok');

    assert.equal(payload.data.context.incident.id, DEMO_INCIDENT_ID);

    assert.equal(payload.data.context.incident.status, 'INVESTIGATING');

    assert.equal(payload.data.context.incident.severity, 'HIGH');

    assert.equal(payload.data.context.events.length, 6);

    assert.deepEqual(
      payload.data.context.events.map((event) => event.sequence),
      [1, 2, 3, 4, 5, 6],
    );

    assert.ok(payload.data.context.events.every((event) => event.incidentId === DEMO_INCIDENT_ID));

    assert.equal(payload.data.context.evidence.length, 5);

    assert.ok(payload.data.context.evidence.every((item) => item.incidentId === DEMO_INCIDENT_ID));

    assert.ok(payload.data.context.investigation);

    assert.equal(payload.data.context.investigation?.incidentId, DEMO_INCIDENT_ID);

    assert.equal(payload.data.metadata.eventCount, 6);
    assert.equal(payload.data.metadata.evidenceCount, 5);
    assert.equal(payload.data.metadata.hasInvestigation, true);

    console.log('PASS: authorized request returned 200');
    console.log('PASS: response envelope is { status: "ok", data }');
    console.log('PASS: authoritative incident context returned');
    console.log('PASS: six incident-scoped events returned');
    console.log('PASS: event sequence ordering is deterministic');
    console.log('PASS: five incident-scoped evidence records returned');
    console.log('PASS: investigation context returned');
    console.log('PASS: metadata counts match persisted source data');

    console.log('Testing access control for an incident the user cannot access...');

    const inaccessible = await app.inject({
      method: 'GET',
      url: '/api/v1/incidents/00000000-0000-4000-8000-000000000099/intelligence/context',
      headers: {
        authorization: `Bearer ${authorizedToken}`,
      },
    });

    assert.equal(inaccessible.statusCode, 403);

    console.log('PASS: inaccessible incident remains authorization-protected');

    const participantCount = await prisma.incidentParticipant.count({
      where: {
        incidentId: DEMO_INCIDENT_ID,
      },
    });

    assert.equal(participantCount, 1);

    console.log('PASS: deterministic incident participant remains persisted');

    console.log('STEP 6.4 REAL HTTP INTELLIGENCE CONTEXT VERIFICATION PASSED');
  } finally {
    await app.close();
  }
}

main()
  .catch((error: unknown) => {
    console.error('\n===== STEP 6.4 REAL HTTP INTELLIGENCE CONTEXT FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
