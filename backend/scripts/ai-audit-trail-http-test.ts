import assert from 'node:assert/strict';

import { env } from '../src/config/env';
import { DEMO_INCIDENT_ID, DEMO_USER_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { PrismaAuditLogDataAccess } from '../src/data-access/prisma-audit-log-data-access';
import { AuditLogService } from '../src/services/audit-log-service';
import { AuditLogAIAuditRecorder } from '../src/intelligence';
import { buildApp } from '../src/index';
import { prisma } from '../src/infrastructure/database';

const UNAUTHORIZED_USER_ID = '00000000-0000-4000-8000-000000000099';
const INACCESSIBLE_INCIDENT_ID = '00000000-0000-4000-8000-000000000099';

async function main(): Promise<void> {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured for the HTTP audit trail test.');
  }

  await initializeDemoScenario();

  const auditLogService = new AuditLogService(new PrismaAuditLogDataAccess());
  const auditRecorder = new AuditLogAIAuditRecorder(auditLogService);

  await auditRecorder.record({
    action: 'AI_ANALYSIS_REQUESTED',
    incidentId: DEMO_INCIDENT_ID,
    resourceId: `${DEMO_INCIDENT_ID}:INVESTIGATION_ASSISTANT:http-test`,
    metadata: {
      outcome: 'REQUESTED',
      provider: 'fake-audit-http',
      model: 'fake-http-model',
      correlationId: 'http-audit-correlation-001',
      requestId: null,
      latencyMs: null,
      retryable: null,
      errorCode: null,
      statusCode: null,
      safetyDecision: null,
      groundedContextId: DEMO_INCIDENT_ID,
    },
  });

  await auditRecorder.record({
    action: 'AI_ANALYSIS_COMPLETED',
    incidentId: DEMO_INCIDENT_ID,
    resourceId: `${DEMO_INCIDENT_ID}:INVESTIGATION_ASSISTANT:http-test`,
    metadata: {
      outcome: 'COMPLETED',
      provider: 'fake-audit-http',
      model: 'fake-http-model',
      correlationId: 'http-audit-correlation-001',
      requestId: 'http-audit-request-001',
      latencyMs: 23,
      retryable: null,
      errorCode: null,
      statusCode: null,
      safetyDecision: null,
      groundedContextId: DEMO_INCIDENT_ID,
    },
  });

  await auditLogService.record({
    actorUserId: 'SYSTEM',
    action: 'AI_ANALYSIS_COMPLETED',
    resourceType: 'AI_ANALYSIS',
    resourceId: `${INACCESSIBLE_INCIDENT_ID}:other`,
    incidentId: INACCESSIBLE_INCIDENT_ID,
    metadata: {
      outcome: 'COMPLETED',
      provider: 'foreign-provider',
      model: 'foreign-model',
      correlationId: 'foreign-correlation',
      requestId: 'foreign-request',
      latencyMs: 99,
      retryable: null,
      errorCode: null,
      statusCode: null,
      safetyDecision: null,
      groundedContextId: INACCESSIBLE_INCIDENT_ID,
    },
  });

  const app = await buildApp();

  try {
    console.log('=== STEP 6.10.9 AI AUDIT TRAIL HTTP TEST ===');

    console.log('Testing unauthenticated audit request...');

    const unauthenticated = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/audit`,
    });

    assert.equal(unauthenticated.statusCode, 401);

    console.log('PASS: unauthenticated audit request rejected with 401');

    console.log('Testing authenticated but unauthorized audit request...');

    const unauthorizedToken = await app.jwt.sign({
      sub: UNAUTHORIZED_USER_ID,
    });

    const unauthorized = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/audit`,
      headers: {
        authorization: `Bearer ${unauthorizedToken}`,
      },
    });

    assert.equal(unauthorized.statusCode, 403);

    console.log('PASS: unauthorized participant rejected with 403');

    console.log('Testing authorized incident commander audit request...');

    const authorizedToken = await app.jwt.sign({
      sub: DEMO_USER_ID,
    });

    const authorized = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/audit`,
      headers: {
        authorization: `Bearer ${authorizedToken}`,
      },
    });

    assert.equal(authorized.statusCode, 200);

    const payload = JSON.parse(authorized.body) as {
      status: string;
      data: {
        items: Array<{
          id: string;
          actorUserId: string;
          action: string;
          resourceType: string;
          resourceId: string;
          incidentId: string | null;
          metadata: Record<string, unknown> | null;
          createdAt: string;
        }>;
      };
    };

    assert.equal(payload.status, 'ok');

    assert.ok(payload.data);
    assert.ok(Array.isArray(payload.data.items));

    assert.equal(payload.data.items.length, 2);

    assert.ok(
      payload.data.items.every((item) => item.incidentId === DEMO_INCIDENT_ID),
      'Every returned audit record must belong to the requested incident.',
    );

    assert.deepEqual(
      payload.data.items.map((item) => item.action),
      ['AI_ANALYSIS_REQUESTED', 'AI_ANALYSIS_COMPLETED'],
    );

    assert.ok(payload.data.items.every((item) => item.actorUserId === 'SYSTEM'));

    assert.ok(payload.data.items.every((item) => item.resourceType === 'AI_ANALYSIS'));

    assert.ok(
      payload.data.items.every((item) =>
        item.resourceId.startsWith(`${DEMO_INCIDENT_ID}:INVESTIGATION_ASSISTANT:`),
      ),
    );

    const completed = payload.data.items[1];

    assert.equal(completed.metadata?.outcome, 'COMPLETED');
    assert.equal(completed.metadata?.provider, 'fake-audit-http');
    assert.equal(completed.metadata?.model, 'fake-http-model');
    assert.equal(completed.metadata?.correlationId, 'http-audit-correlation-001');
    assert.equal(completed.metadata?.requestId, 'http-audit-request-001');
    assert.equal(completed.metadata?.latencyMs, 23);
    assert.equal(completed.metadata?.groundedContextId, DEMO_INCIDENT_ID);

    assert.equal(typeof completed.createdAt, 'string');
    assert.ok(completed.id.length > 0);

    const serializedPayload = JSON.stringify(payload);

    assert.equal(serializedPayload.includes('foreign-provider'), false);
    assert.equal(serializedPayload.includes('foreign-model'), false);
    assert.equal(serializedPayload.includes('foreign-correlation'), false);
    assert.equal(serializedPayload.includes('foreign-request'), false);

    console.log('PASS: authorized request returned 200');
    console.log('PASS: response envelope is { status: "ok", data: { items } }');
    console.log('PASS: exactly two demo audit records returned');
    console.log('PASS: returned audit records are incident-scoped');
    console.log('PASS: audit action ordering is deterministic');
    console.log('PASS: AI audit resource type and provenance are preserved');
    console.log('PASS: AI audit metadata is mapped through the HTTP response');
    console.log('PASS: foreign incident audit records do not leak');

    console.log('Testing access control for an inaccessible incident...');

    const inaccessible = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${INACCESSIBLE_INCIDENT_ID}/audit`,
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

    console.log('STEP 6.10.9 REAL HTTP AI AUDIT TRAIL VERIFICATION PASSED');
  } finally {
    await app.close();
  }
}

main()
  .catch((error: unknown) => {
    console.error('\n===== STEP 6.10.9 REAL HTTP AI AUDIT TRAIL FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
