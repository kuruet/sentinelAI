export const INVESTIGATION_ASSISTANT_INTENTS = [
  'INVESTIGATION_SUMMARY',
  'EVIDENCE_INTERPRETATION',
  'TIMELINE_ANALYSIS',
  'NEXT_INVESTIGATION_STEP',
  'HYPOTHESIS_REVIEW',
] as const;

export type InvestigationAssistantIntent = (typeof INVESTIGATION_ASSISTANT_INTENTS)[number];

export interface InvestigationAssistantRequest {
  incidentId: string;
  question: string;
  intent: InvestigationAssistantIntent;
  model: string;
}

export interface InvestigationAssistantReference {
  type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION' | 'FINDING';
  id: string;
  reason: string;
}

export interface InvestigationAssistantResponse {
  incidentId: string;
  answer: string;
  references: InvestigationAssistantReference[];
  limitations: string[];
  provider: string;
  model: string;
  requestId?: string | null;
  latencyMs: number;
}
