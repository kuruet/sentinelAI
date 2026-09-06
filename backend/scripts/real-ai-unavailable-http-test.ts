import assert from 'node:assert/strict';

import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, DEMO_USER_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { buildApp } from '../src/index';

async function main() {
  console.log('STEP 6.11.5 — REAL AI PROVIDER UNAVAILABLE-PATH VERIFICATION');

  const openAiKey = process.env.OPENAI_API_KEY?.trim() ?? '';

  assert.equal(
    openAiKey,
    '',
    'This test must run with OPENAI_API_KEY empty so production unavailable-provider behavior is exercised.',
  );
  console.log('PASS: OPENAI_API_KEY is empty');

  await initializeDemoScenario();

  const beforeIncident = await prisma.incident.findUnique({
    where: { id: DEMO_INCIDENT_ID },
  });

  assert.ok(beforeIncident);
  assert.equal(beforeIncident.status, 'INVESTIGATING');
  assert.equal(beforeIncident.severity, 'HIGH');
  assert.equal(beforeIncident.priority, 1);
  console.log('PASS: deterministic demo incident loaded');

  const beforeAuditCount = await prisma.auditLog.count({
    where: { incidentId: DEMO_INCIDENT_ID },
  });

  const app = await buildApp();

  try {
    const unauthenticated = await app.inject({
      method: 'POST',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/assistant`,
      payload: {
        question: 'What is the likely root cause?',
        model: 'gpt-4.1-mini',
      },
    });

    assert.equal(unauthenticated.statusCode, 401);
    console.log('PASS: unauthenticated AI request rejected with 401');

    const unauthorizedToken = await app.jwt.sign({
      sub: '00000000-0000-4000-8000-000000000099',
    });

    const unauthorized = await app.inject({
      method: 'POST',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/assistant`,
      headers: {
        authorization: `Bearer ${unauthorizedToken}`,
      },
      payload: {
        question: 'What is the likely root cause?',
        model: 'gpt-4.1-mini',
      },
    });

    assert.equal(unauthorized.statusCode, 403);
    console.log('PASS: unauthorized AI request rejected with 403');

    const authorizedToken = await app.jwt.sign({
      sub: DEMO_USER_ID,
    });

    const authorized = await app.inject({
      method: 'POST',
      url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/assistant`,
      headers: {
        authorization: `Bearer ${authorizedToken}`,
      },
      payload: {
        question: 'What is the likely root cause?',
        model: 'gpt-4.1-mini',
      },
    });

    assert.notEqual(
      authorized.statusCode,
      200,
      'AI unavailable path must not return a successful fake AI response.',
    );
    assert.equal(authorized.statusCode, 503);

    const responseBody = authorized.json<{
      status?: string;
      error?: {
        code?: string;
        message?: string;
      };
    }>();

    assert.equal(responseBody.status, 'error');
    assert.equal(responseBody.error?.code, 'AI_PROVIDER_UNAVAILABLE');
    assert.equal(responseBody.error?.message, 'AI intelligence provider is not configured.');

    const serializedResponse = authorized.body.toLowerCase();

    assert.equal(
      openAiKey.length > 0 ? serializedResponse.includes(openAiKey.toLowerCase()) : false,
      false,
      'Response must not expose the configured OpenAI API key value.',
    );

    assert.equal(
      serializedResponse.includes('api_key'),
      false,
      'Response must not expose API-key fields.',
    );

    assert.equal(
      serializedResponse.includes('apikey'),
      false,
      'Response must not expose API-key fields.',
    );

    assert.equal(
      serializedResponse.includes('openai_api_key='),
      false,
      'Response must not expose environment configuration.',
    );

    console.log('PASS: authorized AI request returned explicit provider-unavailable response');
    console.log('PASS: production path did not fabricate a fake AI success');

    const additionalAiOperations = [
      {
        name: 'summary',
        url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/summary`,
        payload: {
          mode: 'EXECUTIVE',
          model: 'gpt-4.1-mini',
        },
      },
      {
        name: 'root-cause',
        url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/root-cause`,
        payload: {
          mode: 'PRIMARY',
          model: 'gpt-4.1-mini',
        },
      },
      {
        name: 'recommendations',
        url: `/api/v1/incidents/${DEMO_INCIDENT_ID}/intelligence/recommendations`,
        payload: {
          model: 'gpt-4.1-mini',
        },
      },
    ] as const;

    for (const operation of additionalAiOperations) {
      const response = await app.inject({
        method: 'POST',
        url: operation.url,
        headers: {
          authorization: `Bearer ${authorizedToken}`,
        },
        payload: operation.payload,
      });

      assert.notEqual(
        response.statusCode,
        200,
        `${operation.name} unavailable path must not return a successful fake AI response.`,
      );

      assert.equal(
        response.statusCode,
        503,
        `${operation.name} must return 503 when the AI provider is unavailable.`,
      );

      const body = response.json<{
        status?: string;
        error?: {
          code?: string;
          message?: string;
        };
      }>();

      assert.equal(body.status, 'error');
      assert.equal(body.error?.code, 'AI_PROVIDER_UNAVAILABLE');
      assert.equal(body.error?.message, 'AI intelligence provider is not configured.');

      const serializedOperationResponse = response.body.toLowerCase();

      assert.equal(
        openAiKey.length > 0
          ? serializedOperationResponse.includes(openAiKey.toLowerCase())
          : false,
        false,
        `${operation.name} response must not expose the configured OpenAI API key value.`,
      );

      assert.equal(
        serializedOperationResponse.includes('api_key'),
        false,
        `${operation.name} response must not expose API-key fields.`,
      );

      assert.equal(
        serializedOperationResponse.includes('apikey'),
        false,
        `${operation.name} response must not expose API-key fields.`,
      );

      assert.equal(
        serializedOperationResponse.includes('openai_api_key='),
        false,
        `${operation.name} response must not expose environment configuration.`,
      );

      console.log(`PASS: ${operation.name} returned explicit provider-unavailable response`);
    }

    console.log('PASS: all four AI operations reject unavailable provider safely');

    const afterAuditCount = await prisma.auditLog.count({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    assert.equal(
      afterAuditCount,
      beforeAuditCount,
      'No AI audit record should be created when no AI provider execution occurs.',
    );
    console.log('PASS: no AI audit record was created for unavailable provider');

    const afterIncident = await prisma.incident.findUnique({
      where: { id: DEMO_INCIDENT_ID },
    });

    assert.ok(afterIncident);
    assert.equal(afterIncident.status, beforeIncident.status);
    assert.equal(afterIncident.severity, beforeIncident.severity);
    assert.equal(afterIncident.priority, beforeIncident.priority);
    assert.equal(afterIncident.title, beforeIncident.title);
    assert.equal(afterIncident.description, beforeIncident.description);
    console.log('PASS: incident source-of-truth remained unchanged');

    const participantCount = await prisma.incidentParticipant.count({
      where: { incidentId: DEMO_INCIDENT_ID },
    });

    assert.equal(participantCount, 1);
    console.log('PASS: incident authorization participant remained persisted');

    console.log('STEP 6.11.5 REAL AI PROVIDER UNAVAILABLE-PATH VERIFICATION PASSED');
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
