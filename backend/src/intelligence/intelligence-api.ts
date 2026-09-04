import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { AIProvider, AIProviderRequest, AIProviderResponse } from './providers';
import { AIProviderError } from './providers';
import { AIContextBuilder } from './grounding';
import { InvestigationAssistantService } from './assistant';
import { IncidentSummarizationService } from './summarization';
import { RootCauseAnalysisService } from './root-cause-analysis';
import { AIRecommendationsService } from './recommendations/recommendation-service';
import { IntelligenceExplainabilityService } from './explainability';
import { AIAuditabilityService } from './ai-auditability-service';
import type { AIAuditRecorder } from './auditability';
import type {
  IntelligenceContextSnapshot,
  IntelligenceFinding,
  IntelligenceHypothesis,
  IntelligenceRecommendation,
} from './contracts';
import { EventEvidenceCorrelationService } from '../services/event-evidence-correlation-service';
import { DeterministicSignalAnalysisService } from '../services/deterministic-signal-analysis-service';
import { IntelligenceFindingsHypothesisService } from '../services/intelligence-findings-hypothesis-service';

const assistantIntentSchema = z.enum([
  'INVESTIGATION_SUMMARY',
  'EVIDENCE_INTERPRETATION',
  'TIMELINE_ANALYSIS',
  'NEXT_INVESTIGATION_STEP',
  'HYPOTHESIS_REVIEW',
]);

const summaryModeSchema = z.enum(['EXECUTIVE', 'INVESTIGATION', 'TIMELINE']);

const rcaModeSchema = z.enum(['PRIMARY', 'ALTERNATIVE']);

const modelSchema = z.string().trim().min(1).max(200);

export const intelligenceAssistantRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(20_000),
    intent: assistantIntentSchema,
    model: modelSchema,
  })
  .strict();

export const intelligenceSummaryRequestSchema = z
  .object({
    mode: summaryModeSchema,
    model: modelSchema,
  })
  .strict();

export const intelligenceRcaRequestSchema = z
  .object({
    mode: rcaModeSchema,
    model: modelSchema,
  })
  .strict();

export const intelligenceRecommendationsRequestSchema = z
  .object({
    model: modelSchema,
  })
  .strict();

export const intelligenceExplainRequestSchema = z
  .object({
    finding: z.unknown().optional(),
    hypothesis: z.unknown().optional(),
    recommendation: z.unknown().optional(),
  })
  .strict();

export interface IntelligenceApiDependencies {
  provider: AIProvider;
  contextBuilder?: AIContextBuilder;
  auditRecorder?: AIAuditRecorder;
}

class AuditedAIProvider implements AIProvider {
  readonly name: string;

  constructor(
    private readonly provider: AIProvider,
    private readonly auditability: AIAuditabilityService,
    private readonly execution: {
      incidentId: string;
      resourceId: string;
      correlationId: string;
      groundedContextId: string | null;
    },
  ) {
    this.name = provider.name;
  }

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    const result = await this.auditability.execute(this.provider, request, {
      incidentId: this.execution.incidentId,
      resourceId: this.execution.resourceId,
      correlationId: this.execution.correlationId,
      groundedContextId: this.execution.groundedContextId,
    });

    if (result.success) {
      return result.response;
    }

    throw new AIProviderError({
      code: result.error.code,
      provider: result.error.provider,
      message: result.error.message,
      retryable: result.error.retryable,
      requestId: result.error.requestId,
      statusCode: result.error.statusCode,
    });
  }
}

export class IntelligenceApiService {
  private readonly contextBuilder: AIContextBuilder;
  private readonly provider: AIProvider;
  private readonly auditability: AIAuditabilityService | null;
  private readonly explainability: IntelligenceExplainabilityService;

  private readonly correlationService: EventEvidenceCorrelationService;

  private readonly deterministicAnalysisService: DeterministicSignalAnalysisService;

  private readonly findingsHypothesisService: IntelligenceFindingsHypothesisService;

  constructor(dependencies: IntelligenceApiDependencies) {
    this.contextBuilder = dependencies.contextBuilder ?? new AIContextBuilder();

    this.auditability = dependencies.auditRecorder
      ? new AIAuditabilityService(dependencies.auditRecorder)
      : null;

    this.provider = dependencies.provider;

    this.explainability = new IntelligenceExplainabilityService();

    this.correlationService = new EventEvidenceCorrelationService();

    this.deterministicAnalysisService = new DeterministicSignalAnalysisService();

    this.findingsHypothesisService = new IntelligenceFindingsHypothesisService();
  }

  private createExecutionProvider(
    incidentId: string,
    operation: string,
    snapshot: IntelligenceContextSnapshot,
  ): AIProvider {
    if (!this.auditability) {
      return this.provider;
    }

    const correlationId = randomUUID();

    return new AuditedAIProvider(this.provider, this.auditability, {
      incidentId,
      resourceId: `${incidentId}:${operation}:${correlationId}`,
      correlationId,
      groundedContextId: snapshot.context.incident.id,
    });
  }

  private createAssistant(
    incidentId: string,
    snapshot: IntelligenceContextSnapshot,
  ): InvestigationAssistantService {
    return new InvestigationAssistantService(
      this.createExecutionProvider(incidentId, 'INVESTIGATION_ASSISTANT', snapshot),
      this.contextBuilder,
    );
  }

  private createSummarization(
    incidentId: string,
    snapshot: IntelligenceContextSnapshot,
  ): IncidentSummarizationService {
    return new IncidentSummarizationService(
      this.createExecutionProvider(incidentId, 'INCIDENT_SUMMARIZATION', snapshot),
      this.contextBuilder,
    );
  }

  private createRca(
    incidentId: string,
    snapshot: IntelligenceContextSnapshot,
  ): RootCauseAnalysisService {
    return new RootCauseAnalysisService(
      this.createExecutionProvider(incidentId, 'ROOT_CAUSE_ANALYSIS', snapshot),
      this.contextBuilder,
    );
  }

  private createRecommendations(
    incidentId: string,
    snapshot: IntelligenceContextSnapshot,
  ): AIRecommendationsService {
    return new AIRecommendationsService(
      this.createExecutionProvider(incidentId, 'RECOMMENDATIONS', snapshot),
      this.contextBuilder,
    );
  }

  private buildDeterministicAnalysis(snapshot: IntelligenceContextSnapshot): {
    correlations: ReturnType<EventEvidenceCorrelationService['correlate']>;
    findings: IntelligenceFinding[];
    hypotheses: IntelligenceHypothesis[];
  } {
    const correlations = this.correlationService.correlate(snapshot);

    const signalAnalysis = this.deterministicAnalysisService.analyze(snapshot, correlations);

    const intelligenceAnalysis = this.findingsHypothesisService.build(signalAnalysis.findings);

    return {
      correlations,
      findings: intelligenceAnalysis.findings,
      hypotheses: intelligenceAnalysis.hypotheses,
    };
  }

  buildContext(snapshot: IntelligenceContextSnapshot) {
    return this.contextBuilder.build(snapshot);
  }

  async answer(
    incidentId: string,
    input: z.infer<typeof intelligenceAssistantRequestSchema>,
    snapshot: IntelligenceContextSnapshot,
  ) {
    const deterministic = this.buildDeterministicAnalysis(snapshot);

    return this.createAssistant(incidentId, snapshot).answer(
      {
        incidentId,
        question: input.question,
        intent: input.intent,
        model: input.model,
      },
      snapshot,
      deterministic.findings,
    );
  }

  async summarize(
    incidentId: string,
    input: z.infer<typeof intelligenceSummaryRequestSchema>,
    snapshot: IntelligenceContextSnapshot,
  ) {
    const deterministic = this.buildDeterministicAnalysis(snapshot);

    return this.createSummarization(incidentId, snapshot).summarize(
      {
        incidentId,
        mode: input.mode,
        model: input.model,
      },
      snapshot,
      deterministic.findings,
    );
  }

  async rootCause(
    incidentId: string,
    input: z.infer<typeof intelligenceRcaRequestSchema>,
    snapshot: IntelligenceContextSnapshot,
  ) {
    const deterministic = this.buildDeterministicAnalysis(snapshot);

    return this.createRca(incidentId, snapshot).analyze(
      {
        incidentId,
        mode: input.mode,
        model: input.model,
      },
      snapshot,
      deterministic.findings,
    );
  }

  async recommendations(
    incidentId: string,
    input: z.infer<typeof intelligenceRecommendationsRequestSchema>,
    snapshot: IntelligenceContextSnapshot,
  ) {
    const deterministic = this.buildDeterministicAnalysis(snapshot);

    return this.createRecommendations(incidentId, snapshot).analyze(
      {
        snapshot,
        findings: deterministic.findings,
        hypotheses: deterministic.hypotheses,
      },
      {
        incidentId,
        model: input.model,
      },
    );
  }

  explain(input: {
    finding?: IntelligenceFinding;
    hypothesis?: IntelligenceHypothesis;
    recommendation?: IntelligenceRecommendation;
  }) {
    return this.explainability.explain(input);
  }
}
