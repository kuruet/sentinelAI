import type {
  DeterministicAnalysisResult,
  IntelligenceCorrelation,
  IntelligenceContextSnapshot,
} from '../intelligence';
import { DeterministicSignalAnalysisService } from './deterministic-signal-analysis-service';
import { EventEvidenceCorrelationService } from './event-evidence-correlation-service';
import type { IntelligenceContextService } from './intelligence-context-service';

export interface AutomaticIncidentCorrelationResult {
  incidentId: string;
  correlations: IntelligenceCorrelation[];
  analysis: DeterministicAnalysisResult;
  context: {
    eventCount: number;
    evidenceCount: number;
    hasInvestigation: boolean;
    generatedAt: string;
  };
}

export class AutomaticIncidentCorrelationService {
  constructor(
    private readonly intelligenceContextService: IntelligenceContextService,
    private readonly correlationService = new EventEvidenceCorrelationService(),
    private readonly signalAnalysisService = new DeterministicSignalAnalysisService(),
  ) {}

  async analyze(incidentId: string): Promise<AutomaticIncidentCorrelationResult | null> {
    const snapshot: IntelligenceContextSnapshot | null =
      await this.intelligenceContextService.buildContext(incidentId);

    if (!snapshot) {
      return null;
    }

    const correlations = this.correlationService.correlate(snapshot);
    const analysis = this.signalAnalysisService.analyze(snapshot, correlations);

    return {
      incidentId,
      correlations,
      analysis,
      context: {
        eventCount: snapshot.metadata.eventCount,
        evidenceCount: snapshot.metadata.evidenceCount,
        hasInvestigation: snapshot.metadata.hasInvestigation,
        generatedAt: snapshot.metadata.generatedAt,
      },
    };
  }
}
