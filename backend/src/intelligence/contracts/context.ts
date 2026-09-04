import type {
  EvidenceResponse,
  IncidentEventResponse,
  IncidentResponse,
  InvestigationResponse,
} from '../../contracts';

export interface IntelligenceContext {
  incident: IncidentResponse;
  events: IncidentEventResponse[];
  evidence: EvidenceResponse[];
  investigation: InvestigationResponse | null;
}

export interface IntelligenceContextMetadata {
  generatedAt: string;
  eventCount: number;
  evidenceCount: number;
  hasInvestigation: boolean;
}

export interface IntelligenceContextSnapshot {
  context: IntelligenceContext;
  metadata: IntelligenceContextMetadata;
}
