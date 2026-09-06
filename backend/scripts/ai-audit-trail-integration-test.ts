import assert from 'node:assert/strict';

import { prisma } from '../src/infrastructure/database';
import { DEMO_INCIDENT_ID, initializeDemoScenario } from '../src/demo/demo-scenario';
import { PrismaAuditLogDataAccess } from '../src/data-access/prisma-audit-log-data-access';
import { PrismaEvidenceDataAccess } from '../src/data-access/prisma-evidence-data-access';
import { PrismaIncidentDataAccess } from '../src/data-access/prisma-incident-data-access';
import { PrismaIncidentEventDataAccess } from '../src/data-access/prisma-incident-event-data-access';
import { PrismaInvestigationDataAccess } from '../src/data-access/prisma-investigation-data-access';
import { AuditLogService } from '../src/services/audit-log-service';
import { IntelligenceContextService } from '../src/services/intelligence-context-service';
import {
  AIProviderError,
  AuditLogAIAuditRecorder,
  IntelligenceApiService,
  type AIProvider,
  type AIProviderRequest,
  type AIProviderResponse,
} from '../src/intelligence';

const TEST_MODEL = 'sentinelai-demo-audit-model';

class SuccessProvider implements AIProvider {
  readonly name = 'fake-audit-success';

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    return {
      provider: this.name,
      model: request.model,
      outputText: 'The deterministic demo context was processed successfully.',
      requestId: 'audit-provider-request-success',
      latencyMs: 17,
    };
  }
}

class FailureProvider implements AIProvider {
  readonly name = 'fake-audit-failure';

  async generate(): Promise<never> {
    throw new AIProviderError({
      code: 'RATE_LIMIT',
      provider: this.name,
      message: 'Provider rate limit reached',
      retryable: true,
      requestId: 'audit-provider-request-failure',
      statusCode: 429,
    });
  }
}

function metadataRecord(metadata: unknown): Record<string, unknown> {
  assert.ok(metadata && typeof metadata === 'object' && !Array.isArray(metadata));
  return metadata as Record<string, unknown>;
}

async function main(): Promise<void> {
  console.log('=== STEP 6.10 AI AUDIT TRAIL INTEGRATION TEST ===');

  await initializeDemoScenario();

  const contextService = new IntelligenceContextService(
    new PrismaIncidentDataAccess(prisma),
    new PrismaIncidentEventDataAccess(prisma),
    new PrismaEvidenceDataAccess(prisma),
    new PrismaInvestigationDataAccess(prisma),
  );

  const snapshot = await contextService.buildContext(DEMO_INCIDENT_ID);

  assert.ok(snapshot);
  assert.equal(snapshot.context.incident.id, DEMO_INCIDENT_ID);
  assert.equal(snapshot.context.incident.status, 'INVESTIGATING');
  assert.equal(snapshot.context.incident.severity, 'HIGH');
  assert.equal(snapshot.context.events.length, 6);
  assert.equal(snapshot.context.evidence.length, 5);
  assert.ok(snapshot.context.investigation);

  console.log('PASS: deterministic intelligence context loaded');

  const auditLogService = new AuditLogService(new PrismaAuditLogDataAccess());
  const auditRecorder = new AuditLogAIAuditRecorder(auditLogService);

  const successApi = new IntelligenceApiService({
    provider: new SuccessProvider(),
    auditRecorder,
  });

  const failureApi = new IntelligenceApiService({
    provider: new FailureProvider(),
    auditRecorder,
  });

  const beforeSuccessCount = await prisma.auditLog.count({
    where: { incidentId: DEMO_INCIDENT_ID },
  });

  const success = await successApi.answer(
    DEMO_INCIDENT_ID,
    {
      incidentId: DEMO_INCIDENT_ID,
      question: 'What is the current investigation state?',
      intent: 'INVESTIGATION_SUMMARY',
      model: TEST_MODEL,
    },
    snapshot,
  );

  assert.equal(success.incidentId, DEMO_INCIDENT_ID);
  assert.equal(success.provider, 'fake-audit-success');
  assert.equal(success.model, TEST_MODEL);
  assert.ok(success.answer.trim().length > 0);
  assert.equal(success.requestId, 'audit-provider-request-success');
  assert.equal(success.latencyMs, 17);

  console.log('PASS: successful public AI operation completed');

  const afterSuccessEntries = await auditLogService.listByIncident(DEMO_INCIDENT_ID);
  const successEntries = afterSuccessEntries.slice(beforeSuccessCount);

  assert.equal(successEntries.length, 2);
  assert.equal(successEntries[0].action, 'AI_ANALYSIS_REQUESTED');
  assert.equal(successEntries[1].action, 'AI_ANALYSIS_COMPLETED');

  const successRequested = metadataRecord(successEntries[0].metadata);
  const successCompleted = metadataRecord(successEntries[1].metadata);

  assert.equal(successEntries[0].actorUserId, 'SYSTEM');
  assert.equal(successEntries[1].actorUserId, 'SYSTEM');
  assert.equal(successEntries[0].resourceType, 'AI_ANALYSIS');
  assert.equal(successEntries[1].resourceType, 'AI_ANALYSIS');
  assert.equal(successEntries[0].incidentId, DEMO_INCIDENT_ID);
  assert.equal(successEntries[1].incidentId, DEMO_INCIDENT_ID);

  assert.equal(successRequested.outcome, 'REQUESTED');
  assert.equal(successCompleted.outcome, 'COMPLETED');
  assert.equal(successRequested.provider, 'fake-audit-success');
  assert.equal(successCompleted.provider, 'fake-audit-success');
  assert.equal(successRequested.model, TEST_MODEL);
  assert.equal(successCompleted.model, TEST_MODEL);

  assert.equal(typeof successRequested.correlationId, 'string');
  assert.ok(String(successRequested.correlationId).length > 0);
  assert.equal(successCompleted.correlationId, successRequested.correlationId);

  assert.equal(successCompleted.requestId, 'audit-provider-request-success');
  assert.equal(successCompleted.latencyMs, 17);
  assert.equal(successCompleted.safetyDecision, null);
  assert.equal(successCompleted.groundedContextId, DEMO_INCIDENT_ID);

  assert.ok(
    String(successEntries[0].resourceId).startsWith(`${DEMO_INCIDENT_ID}:INVESTIGATION_ASSISTANT:`),
  );
  assert.equal(successEntries[0].resourceId, successEntries[1].resourceId);
  console.log('PASS: successful AI audit records persisted with execution provenance');

  const beforeFailureCount = afterSuccessEntries.length;

  await assert.rejects(
    () =>
      failureApi.answer(
        DEMO_INCIDENT_ID,
        {
          incidentId: DEMO_INCIDENT_ID,
          question: 'What should be investigated next?',
          intent: 'NEXT_INVESTIGATION_STEP',
          model: TEST_MODEL,
        },
        snapshot,
      ),
    (error: unknown) =>
      error instanceof AIProviderError &&
      error.code === 'RATE_LIMIT' &&
      error.retryable === true &&
      error.requestId === 'audit-provider-request-failure',
  );

  console.log('PASS: failed public AI operation preserved provider failure semantics');

  const afterFailureEntries = await auditLogService.listByIncident(DEMO_INCIDENT_ID);
  const failureEntries = afterFailureEntries.slice(beforeFailureCount);

  assert.equal(failureEntries.length, 2);
  assert.equal(failureEntries[0].action, 'AI_ANALYSIS_REQUESTED');
  assert.equal(failureEntries[1].action, 'AI_ANALYSIS_FAILED');

  const failureRequested = metadataRecord(failureEntries[0].metadata);
  const failureMetadata = metadataRecord(failureEntries[1].metadata);

  assert.equal(failureRequested.outcome, 'REQUESTED');
  assert.equal(failureMetadata.outcome, 'FAILED');
  assert.equal(failureMetadata.provider, 'fake-audit-failure');
  assert.equal(failureMetadata.model, TEST_MODEL);
  assert.equal(failureMetadata.errorCode, 'RATE_LIMIT');
  assert.equal(failureMetadata.statusCode, 429);
  assert.equal(failureMetadata.retryable, true);
  assert.equal(failureMetadata.requestId, 'audit-provider-request-failure');
  assert.equal(failureMetadata.correlationId, failureRequested.correlationId);
  assert.equal(failureEntries[0].resourceId, failureEntries[1].resourceId);

  console.log('PASS: failed AI audit records persisted with failure provenance');

  const allAiEntries = [...successEntries, ...failureEntries];

  for (const entry of allAiEntries) {
    const serialized = JSON.stringify(entry.metadata).toLowerCase();

    assert.ok(
      !serialized.includes('what is the current investigation state'),
      'Audit metadata must not contain AI input questions.',
    );

    assert.ok(
      !serialized.includes('what should be investigated next'),
      'Audit metadata must not contain AI input questions.',
    );

    assert.ok(
      !serialized.includes('deterministic demo context was processed successfully'),
      'Audit metadata must not contain AI output payloads.',
    );

    assert.ok(!serialized.includes('password'));
    assert.ok(!serialized.includes('secret'));
    assert.ok(!serialized.includes('token'));
    assert.ok(!serialized.includes('api_key'));

    assert.ok(!serialized.includes('chain of thought'));
    assert.ok(!serialized.includes('hidden reasoning'));
    assert.ok(!serialized.includes('internal reasoning'));
  }

  console.log('PASS: audit metadata excludes AI payloads, secrets, and hidden reasoning');

  const incidentBefore = await prisma.incident.findUnique({
    where: { id: DEMO_INCIDENT_ID },
  });

  const eventsBefore = await prisma.incidentEvent.findMany({
    where: { incidentId: DEMO_INCIDENT_ID },
    orderBy: { sequence: 'asc' },
  });

  const evidenceBefore = await prisma.evidence.findMany({
    where: { incidentId: DEMO_INCIDENT_ID },
    orderBy: { createdAt: 'asc' },
  });

  const investigationBefore = await prisma.investigation.findUnique({
    where: { incidentId: DEMO_INCIDENT_ID },
  });

  const beforeAuditCount = await prisma.auditLog.count({
    where: { incidentId: DEMO_INCIDENT_ID },
  });

  const bestEffortApi = new IntelligenceApiService({
    provider: new SuccessProvider(),
    auditRecorder: {
      async record(): Promise<void> {
        throw new Error('simulated audit persistence outage');
      },
    },
  });

  const bestEffortResult = await bestEffortApi.answer(
    DEMO_INCIDENT_ID,
    {
      incidentId: DEMO_INCIDENT_ID,
      question: 'What is the current investigation state?',
      intent: 'INVESTIGATION_SUMMARY',
      model: TEST_MODEL,
    },
    snapshot,
  );

  assert.equal(bestEffortResult.incidentId, DEMO_INCIDENT_ID);
  assert.equal(bestEffortResult.provider, 'fake-audit-success');
  assert.equal(bestEffortResult.model, TEST_MODEL);

  const afterAuditCount = await prisma.auditLog.count({
    where: { incidentId: DEMO_INCIDENT_ID },
  });

  assert.equal(afterAuditCount, beforeAuditCount);

  console.log('PASS: audit persistence failure remains best-effort');

  const incidentAfter = await prisma.incident.findUnique({
    where: { id: DEMO_INCIDENT_ID },
  });

  const eventsAfter = await prisma.incidentEvent.findMany({
    where: { incidentId: DEMO_INCIDENT_ID },
    orderBy: { sequence: 'asc' },
  });

  const evidenceAfter = await prisma.evidence.findMany({
    where: { incidentId: DEMO_INCIDENT_ID },
    orderBy: { createdAt: 'asc' },
  });

  const investigationAfter = await prisma.investigation.findUnique({
    where: { incidentId: DEMO_INCIDENT_ID },
  });

  assert.deepEqual(
    {
      id: incidentAfter?.id,
      title: incidentAfter?.title,
      description: incidentAfter?.description,
      status: incidentAfter?.status,
      severity: incidentAfter?.severity,
      priority: incidentAfter?.priority,
    },
    {
      id: incidentBefore?.id,
      title: incidentBefore?.title,
      description: incidentBefore?.description,
      status: incidentBefore?.status,
      severity: incidentBefore?.severity,
      priority: incidentBefore?.priority,
    },
  );

  assert.deepEqual(
    eventsAfter.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      sequence: event.sequence,
    })),
    eventsBefore.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      sequence: event.sequence,
    })),
  );

  assert.deepEqual(
    evidenceAfter.map((evidence) => ({
      id: evidence.id,
      evidenceType: evidence.evidenceType,
    })),
    evidenceBefore.map((evidence) => ({
      id: evidence.id,
      evidenceType: evidence.evidenceType,
    })),
  );

  assert.deepEqual(
    {
      id: investigationAfter?.id,
      summary: investigationAfter?.summary,
    },
    {
      id: investigationBefore?.id,
      summary: investigationBefore?.summary,
    },
  );

  console.log('PASS: incident source-of-truth remained unchanged');

  console.log('STEP 6.10 AI AUDIT TRAIL INTEGRATION VERIFICATION PASSED');
}

main()
  .catch((error: unknown) => {
    console.error('\n===== STEP 6.10 AI AUDIT TRAIL INTEGRATION FAILED =====');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
