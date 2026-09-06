import assert from 'node:assert/strict';

import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, DEMO_USER_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { buildApp } from '../src/index';

const UNAUTHORIZED_USER_ID = '00000000-0000-4000-8000-000000000099';
const UNKNOWN_INCIDENT_ID = '00000000-0000-4000-8000-000000000099';

type ErrorPayload = {
  status?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

function assertErrorEnvelope(body: ErrorPayload, code: string, message?: string): void {
  assert.equal(body.status, 'error');
  assert.equal(body.error?.code, code);

  if (message !== undefined) {
    assert.equal(body.error?.message, message);
  }
}

async function main(): Promise<void> {
  console.log('==================================================');
  console.log('STEP 6.12.5 — END-TO-END FAILURE & SECURITY HTTP TEST');
  console.log('==================================================');

  assert.equal(
    process.env.OPENAI_API_KEY?.trim() ?? '',
    '',
    'This deterministic failure test requires OPENAI_API_KEY to be empty.',
  );

  await initializeDemoScenario();

  const beforeIncident = await prisma.incident.findUnique({
    where: { id: DEMO_INCIDENT_ID },
  });

  assert.ok(beforeIncident);

  const beforeAuditCount = await prisma.auditLog.count({
    where: { incidentId: DEMO_INCIDENT_ID },
  });

  const app = await buildApp();

  try {
    const assistantUrl = `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/assistant`;

    console.log('\n=== AUTHENTICATION BOUNDARY ===');

    const unauthenticated = await app.inject({
      method: 'POST',
      url: assistantUrl,
      payload: {
        question: 'What is the likely root cause?',
        intent: 'INVESTIGATION_SUMMARY',
        model: 'gpt-4.1-mini',
      },
    });

    assert.equal(unauthenticated.statusCode, 401);

    const unauthenticatedBody = unauthenticated.json<ErrorPayload>();

    assertErrorEnvelope(unauthenticatedBody, 'UNAUTHORIZED', 'Authentication required.');

    console.log('PASS: unauthenticated AI request rejected with 401');
    console.log('PASS: authentication error uses stable error envelope');

    console.log('\n=== AUTHORIZATION BOUNDARY ===');

    const unauthorizedToken = await app.jwt.sign({
      sub: UNAUTHORIZED_USER_ID,
    });

    const unauthorized = await app.inject({
      method: 'POST',
      url: assistantUrl,
      headers: {
        authorization: `Bearer ${unauthorizedToken}`,
      },
      payload: {
        question: 'What is the likely root cause?',
        intent: 'INVESTIGATION_SUMMARY',
        model: 'gpt-4.1-mini',
      },
    });

    assert.equal(unauthorized.statusCode, 403);

    const unauthorizedBody = unauthorized.json<ErrorPayload>();

    assertErrorEnvelope(unauthorizedBody, 'FORBIDDEN');

    console.log('PASS: authenticated unauthorized AI request rejected with 403');
    console.log('PASS: authorization occurs before AI provider execution');

    console.log('\n=== PROVIDER AVAILABILITY BOUNDARY ===');

    const authorizedToken = await app.jwt.sign({
      sub: DEMO_USER_ID,
    });

    const unavailable = await app.inject({
      method: 'POST',
      url: assistantUrl,
      headers: {
        authorization: `Bearer ${authorizedToken}`,
      },
      payload: {
        question: 'What is the likely root cause?',
        intent: 'INVESTIGATION_SUMMARY',
        model: 'gpt-4.1-mini',
      },
    });

    assert.equal(unavailable.statusCode, 503);

    const unavailableBody = unavailable.json<ErrorPayload>();

    assertErrorEnvelope(
      unavailableBody,
      'AI_PROVIDER_UNAVAILABLE',
      'AI intelligence provider is not configured.',
    );

    console.log('PASS: authorized request returns explicit provider-unavailable response');
    console.log('PASS: provider availability is checked before AI execution');

    console.log('\n=== PROVIDER FAILURE IS NON-FABRICATING ===');

    assert.notEqual(
      unavailable.statusCode,
      200,
      'Unavailable provider must never produce a successful fake AI response.',
    );

    assert.equal(
      unavailableBody.status,
      'error',
      'Unavailable provider must produce an error response.',
    );

    console.log('PASS: unavailable provider cannot produce fake AI success');

    console.log('\n=== EXPLAINABILITY SECURITY BOUNDARY ===');

    const explainUrl = `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/explain`;

    const explainUnauthenticated = await app.inject({
      method: 'POST',
      url: explainUrl,
      payload: {},
    });

    assert.equal(explainUnauthenticated.statusCode, 401);

    const explainUnauthenticatedBody = explainUnauthenticated.json<ErrorPayload>();

    assertErrorEnvelope(explainUnauthenticatedBody, 'UNAUTHORIZED', 'Authentication required.');

    console.log('PASS: explainability endpoint requires authentication');

    const explainUnauthorized = await app.inject({
      method: 'POST',
      url: explainUrl,
      headers: {
        authorization: `Bearer ${unauthorizedToken}`,
      },
      payload: {},
    });

    assert.equal(explainUnauthorized.statusCode, 403);

    const explainUnauthorizedBody = explainUnauthorized.json<ErrorPayload>();

    assertErrorEnvelope(explainUnauthorizedBody, 'FORBIDDEN');

    console.log('PASS: explainability endpoint enforces incident authorization');

    console.log('\n=== INACCESSIBLE INCIDENT BOUNDARY ===');

    const unknownIncidentResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/incidents/${UNKNOWN_INCIDENT_ID}/intelligence/assistant`,
      headers: {
        authorization: `Bearer ${authorizedToken}`,
      },
      payload: {
        question: 'What is the likely root cause?',
        intent: 'INVESTIGATION_SUMMARY',
        model: 'gpt-4.1-mini',
      },
    });

    assert.equal(
      unknownIncidentResponse.statusCode,
      403,
      'An inaccessible incident must not be usable to probe intelligence.',
    );

    const unknownIncidentBody = unknownIncidentResponse.json<ErrorPayload>();

    assertErrorEnvelope(unknownIncidentBody, 'FORBIDDEN');

    console.log('PASS: inaccessible incident is rejected before provider execution');

    console.log('\n=== SECRET / CREDENTIAL LEAKAGE ===');

    const serializedResponses = [
      unauthenticated.body,
      unauthorized.body,
      unavailable.body,
      explainUnauthenticated.body,
      explainUnauthorized.body,
      unknownIncidentResponse.body,
    ]
      .join('\n')
      .toLowerCase();

    assert.equal(serializedResponses.includes('api_key'), false);
    assert.equal(serializedResponses.includes('apikey'), false);
    assert.equal(serializedResponses.includes('openai_api_key='), false);
    assert.equal(serializedResponses.includes('authorization:'), false);
    assert.equal(serializedResponses.includes('bearer '), false);

    console.log('PASS: API-key/configuration material is not exposed');
    console.log('PASS: authorization credentials are not reflected');

    console.log('\n=== AUDIT INTEGRITY ===');

    const afterAuditCount = await prisma.auditLog.count({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    assert.equal(
      afterAuditCount,
      beforeAuditCount,
      'Rejected/unavailable requests must not create AI execution audit records.',
    );

    console.log('PASS: rejected/unavailable requests created no AI execution audit records');

    console.log('\n=== INCIDENT SOURCE-OF-TRUTH INTEGRITY ===');

    const afterIncident = await prisma.incident.findUnique({
      where: { id: DEMO_INCIDENT_ID },
    });

    assert.ok(afterIncident);

    assert.equal(afterIncident.id, beforeIncident.id);
    assert.equal(afterIncident.title, beforeIncident.title);
    assert.equal(afterIncident.description, beforeIncident.description);
    assert.equal(afterIncident.status, beforeIncident.status);
    assert.equal(afterIncident.severity, beforeIncident.severity);
    assert.equal(afterIncident.priority, beforeIncident.priority);
    assert.equal(afterIncident.resolvedAt, beforeIncident.resolvedAt);
    assert.equal(afterIncident.closedAt, beforeIncident.closedAt);

    console.log('PASS: AI failure/security requests did not mutate incident source-of-truth');

    console.log('\n=== AUTHORIZATION DATA INTEGRITY ===');

    const participantCount = await prisma.incidentParticipant.count({
      where: {
        incidentId: DEMO_INCIDENT_ID,
      },
    });

    assert.equal(participantCount, 1);

    const participant = await prisma.incidentParticipant.findFirst({
      where: {
        incidentId: DEMO_INCIDENT_ID,
        userId: DEMO_USER_ID,
      },
    });

    assert.ok(participant);

    console.log('PASS: authorized incident participant remains persisted');
    console.log('PASS: authorization data was not mutated');

    console.log('\n==================================================');
    console.log('STEP 6.12.5 END-TO-END FAILURE & SECURITY HTTP TEST PASSED');
    console.log('==================================================');
  } finally {
    await app.close();
  }
}

main()
  .catch((error: unknown) => {
    console.error('\n===== STEP 6.12.5 FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
