export const AI_PROVIDER_ERROR_CODES = [
  'AUTHENTICATION',
  'PERMISSION',
  'INVALID_REQUEST',
  'RATE_LIMIT',
  'TIMEOUT',
  'NETWORK',
  'PROVIDER',
  'UNKNOWN',
] as const;

export type AIProviderErrorCode = (typeof AI_PROVIDER_ERROR_CODES)[number];

export interface AIProviderRequest {
  model: string;
  input: string;
  instructions?: string;
  correlationId?: string;
}

export interface AIProviderResponse {
  provider: string;
  model: string;
  outputText: string;
  requestId?: string | null;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: string;

  generate(request: AIProviderRequest): Promise<AIProviderResponse>;
}

export class AIProviderError extends Error {
  readonly code: AIProviderErrorCode;
  readonly provider: string;
  readonly retryable: boolean;
  readonly requestId?: string | null;
  readonly statusCode?: number | null;

  constructor(input: {
    code: AIProviderErrorCode;
    provider: string;
    message: string;
    retryable: boolean;
    requestId?: string | null;
    statusCode?: number | null;
    cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = 'AIProviderError';
    this.code = input.code;
    this.provider = input.provider;
    this.retryable = input.retryable;
    this.requestId = input.requestId ?? null;
    this.statusCode = input.statusCode ?? null;
  }
}
