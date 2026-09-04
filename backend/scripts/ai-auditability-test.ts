import {
  AIAuditabilityService,
  type AIAuditRecordInput,
  type AIAuditRecorder,
} from '../src/intelligence';
import {
  AIProviderError,
  type AIProvider,
  type AIProviderRequest,
} from '../src/intelligence/providers';

class FakeAuditRecorder implements AIAuditRecorder {
  readonly records: AIAuditRecordInput[] = [];

  async record(input: AIAuditRecordInput): Promise<void> {
    this.records.push(input);
  }
}

class FailingAuditRecorder implements AIAuditRecorder {
  async record(): Promise<void> {
    throw new Error('audit database unavailable');
  }
}

class SuccessProvider implements AIProvider {
  readonly name = 'fake-success';

  async generate(request: AIProviderRequest) {
    return {
      provider: this.name,
      model: request.model,
      outputText: '{"status":"ok"}',
      requestId: 'provider-request-1',
      latencyMs: 12,
    };
  }
}

class ProviderFailure implements AIProvider {
  readonly name = 'fake-failure';

  async generate(): Promise<never> {
    throw new AIProviderError({
      code: 'RATE_LIMIT',
      provider: this.name,
      message: 'Provider rate limit reached',
      retryable: true,
      requestId: 'provider-request-2',
      statusCode: 429,
    });
  }
}

async function main(): Promise<void> {
  const successAudit = new FakeAuditRecorder();
  const successService = new AIAuditabilityService(successAudit);

  const success = await successService.execute(
    new SuccessProvider(),
    {
      model: 'test-model',
      input: 'grounded incident context',
      correlationId: 'correlation-success',
    },
    {
      incidentId: 'incident-1',
      resourceId: 'analysis-1',
      groundedContextId: 'context-1',
      safetyDecision: 'ALLOW',
    },
  );

  if (!success.success) {
    throw new Error('Expected successful AI execution.');
  }

  if (successAudit.records.length !== 2) {
    throw new Error('Expected requested + completed audit records.');
  }

  if (
    successAudit.records[0].action !== 'AI_ANALYSIS_REQUESTED' ||
    successAudit.records[1].action !== 'AI_ANALYSIS_COMPLETED'
  ) {
    throw new Error('Incorrect success audit action sequence.');
  }

  if (
    successAudit.records[1].metadata.provider !== 'fake-success' ||
    successAudit.records[1].metadata.requestId !== 'provider-request-1' ||
    successAudit.records[1].metadata.outcome !== 'COMPLETED'
  ) {
    throw new Error('Completed audit metadata is incorrect.');
  }

  const failureAudit = new FakeAuditRecorder();
  const failureService = new AIAuditabilityService(failureAudit);

  const failure = await failureService.execute(
    new ProviderFailure(),
    {
      model: 'test-model',
      input: 'grounded incident context',
      correlationId: 'correlation-failure',
    },
    {
      incidentId: 'incident-2',
      resourceId: 'analysis-2',
    },
  );

  if (failure.success) {
    throw new Error('Expected failed AI execution.');
  }

  if (failure.error.code !== 'RATE_LIMIT') {
    throw new Error('Provider error code was not preserved.');
  }

  if (!failure.error.retryable) {
    throw new Error('Provider retryability was not preserved.');
  }

  if (failure.error.requestId !== 'provider-request-2') {
    throw new Error('Provider request ID was not preserved.');
  }

  if (failureAudit.records.length !== 2) {
    throw new Error('Expected requested + failed audit records.');
  }

  if (
    failureAudit.records[1].action !== 'AI_ANALYSIS_FAILED' ||
    failureAudit.records[1].metadata.errorCode !== 'RATE_LIMIT' ||
    failureAudit.records[1].metadata.statusCode !== 429 ||
    failureAudit.records[1].metadata.retryable !== true
  ) {
    throw new Error('Failed audit metadata is incorrect.');
  }

  class UnknownFailureProvider implements AIProvider {
    readonly name = 'fake-unknown';

    async generate(): Promise<never> {
      throw {
        code: 'NOT_A_REAL_PROVIDER_ERROR',
        provider: this.name,
        retryable: true,
      };
    }
  }

  const unknownAudit = new FakeAuditRecorder();
  const unknownService = new AIAuditabilityService(unknownAudit);

  const unknownFailure = await unknownService.execute(
    new UnknownFailureProvider(),
    {
      model: 'test-model',
      input: 'safe grounded context',
      correlationId: 'correlation-unknown',
    },
    {
      incidentId: 'incident-unknown',
      resourceId: 'analysis-unknown',
    },
  );

  if (unknownFailure.success) {
    throw new Error('Expected unknown provider failure.');
  }

  if (unknownFailure.error.code !== 'UNKNOWN') {
    throw new Error('Unknown runtime error code must normalize to UNKNOWN.');
  }

  if (unknownFailure.error.retryable) {
    throw new Error('Unknown runtime errors must not inherit untrusted retryability.');
  }

  if (unknownAudit.records[1].metadata.errorCode !== 'UNKNOWN') {
    throw new Error('Unknown runtime error audit classification is incorrect.');
  }

  const auditFailureService = new AIAuditabilityService(new FailingAuditRecorder());

  const auditFailureResult = await auditFailureService.execute(
    new SuccessProvider(),
    {
      model: 'test-model',
      input: 'safe grounded context',
      correlationId: 'correlation-audit-failure',
    },
    {
      incidentId: 'incident-3',
      resourceId: 'analysis-3',
    },
  );

  if (!auditFailureResult.success) {
    throw new Error(
      'Audit persistence failure must not convert a successful AI execution into failure.',
    );
  }

  for (const record of successAudit.records) {
    const serialized = JSON.stringify(record.metadata);

    if (
      serialized.includes('grounded incident context') ||
      serialized.includes('{"status":"ok"}')
    ) {
      throw new Error('Audit metadata must not contain AI input or AI output payloads.');
    }

    if (
      serialized.toLowerCase().includes('password') ||
      serialized.toLowerCase().includes('secret') ||
      serialized.toLowerCase().includes('token')
    ) {
      throw new Error('Audit metadata contains a forbidden secret-like field.');
    }
  }

  if (success.correlationId !== successAudit.records[0].metadata.correlationId) {
    throw new Error('Correlation ID was not preserved.');
  }

  console.log('STEP 4.15 AI AUDITABILITY & FAILURE HANDLING TEST: PASS');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
