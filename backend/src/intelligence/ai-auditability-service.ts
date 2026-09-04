import { randomUUID } from 'node:crypto';

import type {
  AIProvider,
  AIProviderError,
  AIProviderRequest,
} from './providers/ai-provider';

import type {
  AIAuditMetadata,
  AIAuditRecorder,
  AIExecutionOptions,
  AIExecutionResult,
} from './auditability';

import {
  AI_AUDIT_RESOURCE_TYPE,
  isAIProviderError,
} from './auditability';

export class AIAuditabilityService {
  constructor(
    private readonly auditRecorder: AIAuditRecorder,
  ) {}

  async execute(
    provider: AIProvider,
    request: AIProviderRequest,
    options: AIExecutionOptions,
  ): Promise<AIExecutionResult> {
    const correlationId =
      request.correlationId ??
      options.correlationId ??
      randomUUID();

    const normalizedRequest: AIProviderRequest = {
      ...request,
      correlationId,
    };

    await this.recordBestEffort({
      action: 'AI_ANALYSIS_REQUESTED',
      incidentId: options.incidentId,
      resourceId: options.resourceId,
      metadata: {
        outcome: 'REQUESTED',
        provider: provider.name,
        model: request.model,
        correlationId,
        requestId: null,
        latencyMs: null,
        retryable: null,
        errorCode: null,
        statusCode: null,
        safetyDecision: options.safetyDecision ?? null,
        groundedContextId: options.groundedContextId ?? null,
      },
    });

    const startedAt = Date.now();

    try {
      const response = await provider.generate(normalizedRequest);

      const latencyMs = Math.max(
        0,
        Number.isFinite(response.latencyMs)
          ? response.latencyMs
          : Date.now() - startedAt,
      );

      await this.recordBestEffort({
        action: 'AI_ANALYSIS_COMPLETED',
        incidentId: options.incidentId,
        resourceId: options.resourceId,
        metadata: {
          outcome: 'COMPLETED',
          provider: response.provider,
          model: response.model,
          correlationId,
          requestId: response.requestId ?? null,
          latencyMs,
          retryable: null,
          errorCode: null,
          statusCode: null,
          safetyDecision: options.safetyDecision ?? null,
          groundedContextId: options.groundedContextId ?? null,
        },
      });

      return {
        success: true,
        response,
        correlationId,
      };
    } catch (error: unknown) {
      const normalizedError = this.normalizeProviderError(
        error,
        provider.name,
      );

      await this.recordBestEffort({
        action: 'AI_ANALYSIS_FAILED',
        incidentId: options.incidentId,
        resourceId: options.resourceId,
        metadata: {
          outcome: 'FAILED',
          provider: normalizedError.provider,
          model: request.model,
          correlationId,
          requestId: normalizedError.requestId,
          latencyMs: Math.max(0, Date.now() - startedAt),
          retryable: normalizedError.retryable,
          errorCode: normalizedError.code,
          statusCode: normalizedError.statusCode,
          safetyDecision: options.safetyDecision ?? null,
          groundedContextId: options.groundedContextId ?? null,
        },
      });

      return {
        success: false,
        error: normalizedError,
        correlationId,
      };
    }
  }

  private normalizeProviderError(
    error: unknown,
    provider: string,
  ): {
    code: AIProviderError['code'];
    provider: string;
    message: string;
    retryable: boolean;
    requestId: string | null;
    statusCode: number | null;
  } {
    if (isAIProviderError(error)) {
      return {
        code: error.code,
        provider: error.provider,
        message: error.message,
        retryable: error.retryable,
        requestId: error.requestId ?? null,
        statusCode: error.statusCode ?? null,
      };
    }

    let message = 'Unknown AI provider failure';

    if (error instanceof Error) {
      message = error.message;
    }

    return {
      code: 'UNKNOWN',
      provider,
      message,
      retryable: false,
      requestId: null,
      statusCode: null,
    };
  }

  private async recordBestEffort(input: {
    action:
      | 'AI_ANALYSIS_REQUESTED'
      | 'AI_ANALYSIS_COMPLETED'
      | 'AI_ANALYSIS_FAILED';
    incidentId: string;
    resourceId: string;
    metadata: AIAuditMetadata;
  }): Promise<void> {
    try {
      await this.auditRecorder.record({
        action: input.action,
        incidentId: input.incidentId,
        resourceId: input.resourceId,
        metadata: input.metadata,
      });
    } catch {
      // Audit persistence failure must never alter the AI execution result.
    }
  }
}

export class AuditLogAIAuditRecorder implements AIAuditRecorder {
  constructor(
    private readonly auditLog: {
      record(input: {
        actorUserId: string;
        action: string;
        resourceType: string;
        resourceId: string;
        incidentId?: string | null;
        metadata?: unknown;
      }): Promise<void>;
    },
    private readonly actorUserId = 'SYSTEM',
  ) {}

  async record(input: {
    action:
      | 'AI_ANALYSIS_REQUESTED'
      | 'AI_ANALYSIS_COMPLETED'
      | 'AI_ANALYSIS_FAILED';
    incidentId: string;
    resourceId: string;
    metadata: AIAuditMetadata;
  }): Promise<void> {
    await this.auditLog.record({
      actorUserId: this.actorUserId,
      action: input.action,
      resourceType: AI_AUDIT_RESOURCE_TYPE,
      resourceId: input.resourceId,
      incidentId: input.incidentId,
      metadata: input.metadata,
    });
  }
}
