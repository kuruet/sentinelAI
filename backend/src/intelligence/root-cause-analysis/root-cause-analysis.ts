import type { IntelligenceHypothesis } from '../contracts/hypothesis';

export const ROOT_CAUSE_ANALYSIS_MODES = [
  'PRIMARY',
  'ALTERNATIVE',
] as const;

export type RootCauseAnalysisMode =
  (typeof ROOT_CAUSE_ANALYSIS_MODES)[number];

export interface RootCauseAnalysisRequest {
  incidentId: string;
  mode: RootCauseAnalysisMode;
  model: string;
}

export interface RootCauseAnalysisResponse {
  incidentId: string;
  mode: RootCauseAnalysisMode;
  hypotheses: IntelligenceHypothesis[];
  analysis: string;
  limitations: string[];
  provider: string;
  model: string;
  requestId?: string;
  latencyMs?: number;
}
