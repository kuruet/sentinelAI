import { GoogleGenAI } from '@google/genai';

import {
  AIProvider,
  AIProviderError,
  type AIProviderRequest,
  type AIProviderResponse,
} from './ai-provider';

export interface GeminiProviderOptions {
  apiKey: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  private readonly client: GoogleGenAI;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(options: GeminiProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new Error('Gemini API key is required.');
    }

    this.client = new GoogleGenAI({
      apiKey: options.apiKey,
    });
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 0;
  }

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    const startedAt = Date.now();

    try {
      const response = await this.withRetry(() =>
        this.withTimeout(
          this.client.models.generateContent({
            model: request.model,
            contents: request.input,
            config: request.instructions
              ? {
                  systemInstruction: request.instructions,
                }
              : undefined,
          }),
          this.timeoutMs,
        ),
      );

      const outputText = response.text?.trim();

      if (!outputText) {
        throw new AIProviderError({
          code: 'PROVIDER',
          provider: this.name,
          message: 'Gemini returned an empty response.',
          retryable: false,
        });
      }

      return {
        provider: this.name,
        model: request.model,
        outputText,
        requestId: this.extractRequestId(response),
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      throw this.toProviderError(error);
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        if (attempt >= this.maxRetries || !this.isRetryable(error)) {
          throw error;
        }

        attempt += 1;
      }
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('Gemini request timed out.'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error && error.message.includes('timed out')) {
      return true;
    }

    const statusCode = this.extractStatusCode(error);

    return statusCode === 429 || (statusCode !== null && statusCode >= 500);
  }

  private toProviderError(error: unknown): AIProviderError {
    const statusCode = this.extractStatusCode(error);
    const requestId = this.extractRequestId(error);

    if (statusCode === 401) {
      return new AIProviderError({
        code: 'AUTHENTICATION',
        provider: this.name,
        message: 'Gemini authentication failed.',
        retryable: false,
        requestId,
        statusCode,
        cause: error,
      });
    }

    if (statusCode === 403) {
      return new AIProviderError({
        code: 'PERMISSION',
        provider: this.name,
        message: 'Gemini permission was denied.',
        retryable: false,
        requestId,
        statusCode,
        cause: error,
      });
    }

    if (statusCode === 400 || statusCode === 404 || statusCode === 422) {
      return new AIProviderError({
        code: 'INVALID_REQUEST',
        provider: this.name,
        message: 'Gemini rejected the request.',
        retryable: false,
        requestId,
        statusCode,
        cause: error,
      });
    }

    if (statusCode === 429) {
      return new AIProviderError({
        code: 'RATE_LIMIT',
        provider: this.name,
        message: 'Gemini rate limit was reached.',
        retryable: true,
        requestId,
        statusCode,
        cause: error,
      });
    }

    if (statusCode !== null && statusCode >= 500) {
      return new AIProviderError({
        code: 'PROVIDER',
        provider: this.name,
        message: 'Gemini returned a server-side error.',
        retryable: true,
        requestId,
        statusCode,
        cause: error,
      });
    }

    if (error instanceof Error && error.message.includes('timed out')) {
      return new AIProviderError({
        code: 'TIMEOUT',
        provider: this.name,
        message: 'Gemini request timed out.',
        retryable: true,
        requestId,
        statusCode,
        cause: error,
      });
    }

    if (error instanceof Error) {
      return new AIProviderError({
        code: 'NETWORK',
        provider: this.name,
        message: 'Gemini connection failed.',
        retryable: true,
        requestId,
        statusCode,
        cause: error,
      });
    }

    return new AIProviderError({
      code: 'UNKNOWN',
      provider: this.name,
      message: 'Gemini request failed unexpectedly.',
      retryable: false,
      requestId,
      statusCode,
      cause: error,
    });
  }

  private extractStatusCode(error: unknown): number | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const candidate = error as {
      status?: unknown;
      statusCode?: unknown;
      response?: { status?: unknown };
    };

    for (const value of [
      candidate.status,
      candidate.statusCode,
      candidate.response?.status,
    ]) {
      if (typeof value === 'number' && Number.isInteger(value)) {
        return value;
      }
    }

    return null;
  }

  private extractRequestId(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const candidate = value as {
      requestId?: unknown;
      requestID?: unknown;
      headers?: { get?: (name: string) => string | null };
    };

    if (typeof candidate.requestId === 'string') {
      return candidate.requestId;
    }

    if (typeof candidate.requestID === 'string') {
      return candidate.requestID;
    }

    if (candidate.headers?.get) {
      return (
        candidate.headers.get('x-request-id') ??
        candidate.headers.get('x-goog-request-id')
      );
    }

    return null;
  }
}
