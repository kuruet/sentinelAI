export const INCIDENT_SUMMARY_MODES = [
  'EXECUTIVE',
  'INVESTIGATION',
  'TIMELINE',
] as const;

export type IncidentSummaryMode =
  (typeof INCIDENT_SUMMARY_MODES)[number];

export interface IncidentSummaryRequest {
  incidentId: string;
  mode: IncidentSummaryMode;
  model: string;
}

export interface IncidentSummaryReference {
  type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION' | 'FINDING';
  id: string;
  reason: string;
}

export interface IncidentSummaryResponse {
  incidentId: string;
  mode: IncidentSummaryMode;
  summary: string;
  references: IncidentSummaryReference[];
  limitations: string[];
  provider: string;
  model: string;
  requestId?: string | null;
  latencyMs: number;
}
