import type { AIProvider, AIProviderRequest, AIProviderResponse } from './ai-provider';

export class FakeAIProvider implements AIProvider {
  readonly name = 'fake';

  constructor(private readonly responseText = 'fake provider response') {}

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    return {
      provider: this.name,
      model: request.model,
      outputText: this.responseText,
      requestId: 'fake-request-id',
      latencyMs: 0,
    };
  }
}
