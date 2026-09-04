import {
  AI_PROVIDER_ERROR_CODES,
  type AIProviderError,
  type AIProviderErrorCode,
  type AIProviderResponse,
} from './providers/ai-provider';

export const AI_AUDIT_ACTIONS = [
  'AI_ANALYSIS_REQUESTED',
  'AI_ANALYSIS_COMPLETED',
  'AI_ANALYSIS_FAILED',
] as const;

export type AIAuditAction = (typeof AI_AUDIT_ACTIONS)[number];

export const AI_AUDIT_RESOURCE_TYPE = 'AI_ANALYSIS';

export interface AIAuditMetadata {
  outcome: 'REQUESTED' | 'COMPLETED' | 'FAILED';
  provider: string;
  model: string;
  correlationId: string;
  requestId: string | null;
  latencyMs: number | null;
  retryable: boolean | null;
  errorCode: AIProviderErrorCode | null;
  statusCode: number | null;
  safetyDecision: 'ALLOW' | 'BLOCK' | null;
  groundedContextId: string | null;
}

export interface AIAuditRecordInput {
  action: AIAuditAction;
  incidentId: string;
  resourceId: string;
  metadata: AIAuditMetadata;
}

export interface AIAuditRecorder {
  record(input: AIAuditRecordInput): Promise<void>;
}

export interface AIExecutionOptions {
  incidentId: string;
  resourceId: string;
  correlationId?: string;
  groundedContextId?: string | null;
  safetyDecision?: 'ALLOW' | 'BLOCK' | null;
}

export interface AISafeExecutionResult {
  success: true;
  response: AIProviderResponse;
  correlationId: string;
}

export interface AIFailedExecutionResult {
  success: false;
  error: {
    code: AIProviderErrorCode;
    provider: string;
    message: string;
    retryable: boolean;
    requestId: string | null;
    statusCode: number | null;
  };
  correlationId: string;
}

export type AIExecutionResult = AISafeExecutionResult | AIFailedExecutionResult;

export function isAIProviderError(error: unknown): error is AIProviderError {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Partial<AIProviderError>;

  const isKnownErrorCode =
    typeof candidate.code === 'string' &&
    (AI_PROVIDER_ERROR_CODES as readonly string[]).includes(candidate.code);

  return (
    isKnownErrorCode &&
    typeof candidate.provider === 'string' &&
    typeof candidate.retryable === 'boolean'
  );
}
