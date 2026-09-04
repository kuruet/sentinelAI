import OpenAI from 'openai';

import {
  AIProvider,
  AIProviderError,
  type AIProviderRequest,
  type AIProviderResponse,
} from './ai-provider';

export interface OpenAIProviderOptions {
  apiKey: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  private readonly client: OpenAI;

  constructor(options: OpenAIProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new Error('OpenAI API key is required.');
    }

    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs ?? 30_000,
      maxRetries: options.maxRetries ?? 0,
    });
  }

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    const startedAt = Date.now();

    try {
      const response = await this.client.responses.create({
        model: request.model,
        instructions: request.instructions,
        input: request.input,
      });

      return {
        provider: this.name,
        model: request.model,
        outputText: response.output_text,
        requestId: response._request_id ?? null,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      throw this.toProviderError(error);
    }
  }

  private toProviderError(error: unknown): AIProviderError {
    if (error instanceof OpenAI.APIError) {
      const statusCode = error.status ?? null;

      if (statusCode === 401) {
        return new AIProviderError({
          code: 'AUTHENTICATION',
          provider: this.name,
          message: 'OpenAI authentication failed.',
          retryable: false,
          requestId: error.requestID ?? null,
          statusCode,
          cause: error,
        });
      }

      if (statusCode === 403) {
        return new AIProviderError({
          code: 'PERMISSION',
          provider: this.name,
          message: 'OpenAI permission was denied.',
          retryable: false,
          requestId: error.requestID ?? null,
          statusCode,
          cause: error,
        });
      }

      if (statusCode === 400 || statusCode === 404 || statusCode === 422) {
        return new AIProviderError({
          code: 'INVALID_REQUEST',
          provider: this.name,
          message: 'OpenAI rejected the request.',
          retryable: false,
          requestId: error.requestID ?? null,
          statusCode,
          cause: error,
        });
      }

      if (statusCode === 429) {
        return new AIProviderError({
          code: 'RATE_LIMIT',
          provider: this.name,
          message: 'OpenAI rate limit was reached.',
          retryable: true,
          requestId: error.requestID ?? null,
          statusCode,
          cause: error,
        });
      }

      if (statusCode !== null && statusCode >= 500) {
        return new AIProviderError({
          code: 'PROVIDER',
          provider: this.name,
          message: 'OpenAI returned a server-side error.',
          retryable: true,
          requestId: error.requestID ?? null,
          statusCode,
          cause: error,
        });
      }

      return new AIProviderError({
        code: 'UNKNOWN',
        provider: this.name,
        message: 'OpenAI returned an unexpected API error.',
        retryable: false,
        requestId: error.requestID ?? null,
        statusCode,
        cause: error,
      });
    }

    if (
      error instanceof Error &&
      error.name === 'APIConnectionTimeoutError'
    ) {
      return new AIProviderError({
        code: 'TIMEOUT',
        provider: this.name,
        message: 'OpenAI request timed out.',
        retryable: true,
        cause: error,
      });
    }

    if (error instanceof Error) {
      return new AIProviderError({
        code: 'NETWORK',
        provider: this.name,
        message: 'OpenAI connection failed.',
        retryable: true,
        cause: error,
      });
    }

    return new AIProviderError({
      code: 'UNKNOWN',
      provider: this.name,
      message: 'OpenAI request failed unexpectedly.',
      retryable: false,
      cause: error,
    });
  }
}

