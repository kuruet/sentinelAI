import assert from 'node:assert/strict';

import { OpenAIProvider } from '../src/intelligence/providers/openai-provider';

console.log('STEP 6.11.8 — OPENAI PROVIDER CONFIGURATION CONTRACT');

const invalidApiKeys = ['', '   ', '\t\n'];

for (const apiKey of invalidApiKeys) {
  assert.throws(
    () =>
      new OpenAIProvider({
        apiKey,
      }),
    (error: unknown) => error instanceof Error && error.message === 'OpenAI API key is required.',
    `OpenAIProvider must reject an invalid API key value: ${JSON.stringify(apiKey)}`,
  );

  console.log(`PASS: OpenAIProvider rejected invalid API key value ${JSON.stringify(apiKey)}`);
}

console.log('PASS: provider construction fails explicitly before any AI request can execute');
console.log('PASS: missing credentials do not produce a fake AI response');
console.log('STEP 6.11.8 OPENAI PROVIDER CONFIGURATION CONTRACT PASSED');
