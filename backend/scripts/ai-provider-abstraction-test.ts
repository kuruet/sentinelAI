import {
  AIProviderError,
  FakeAIProvider,
  OpenAIProvider,
  type AIProvider,
} from '../src/intelligence/providers';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function main(): Promise<void> {
  const provider: AIProvider = new FakeAIProvider('controlled fake response');

  const result = await provider.generate({
    model: 'test-model',
    input: 'test input',
    instructions: 'test instructions',
    correlationId: 'test-correlation-id',
  });

  assert(provider.name === 'fake', 'Provider name must be exposed.');
  assert(result.provider === 'fake', 'Provider response must identify the provider.');
  assert(result.model === 'test-model', 'Provider response must preserve the requested model.');
  assert(
    result.outputText === 'controlled fake response',
    'Fake provider output must be deterministic.',
  );
  assert(result.requestId === 'fake-request-id', 'Provider request ID must be preserved.');
  assert(result.latencyMs >= 0, 'Provider latency must be non-negative.');

  const error = new AIProviderError({
    code: 'RATE_LIMIT',
    provider: 'fake',
    message: 'rate limited',
    retryable: true,
    requestId: 'request-123',
    statusCode: 429,
  });

  assert(error.name === 'AIProviderError', 'Error name must be stable.');
  assert(error.code === 'RATE_LIMIT', 'Error code must be preserved.');
  assert(error.provider === 'fake', 'Error provider must be preserved.');
  assert(error.retryable === true, 'Retryability must be preserved.');
  assert(error.requestId === 'request-123', 'Request ID must be preserved.');
  assert(error.statusCode === 429, 'Status code must be preserved.');

  let missingKeyRejected = false;

  try {
    new OpenAIProvider({
      apiKey: '',
    });
  } catch {
    missingKeyRejected = true;
  }

  assert(missingKeyRejected, 'OpenAI provider must reject a missing API key.');

  console.log('STEP 4.7 AI PROVIDER ABSTRACTION TEST: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
