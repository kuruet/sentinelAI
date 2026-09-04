export const AI_CONTEXT_ITEM_TYPES = [
  'INCIDENT',
  'EVENT',
  'EVIDENCE',
  'INVESTIGATION',
  'FINDING',
] as const;

export type AIContextItemType =
  (typeof AI_CONTEXT_ITEM_TYPES)[number];

export interface AIContextReference {
  type: AIContextItemType;
  id: string;
  reason: string;
}

export interface AIContextItem {
  type: AIContextItemType;
  id: string;
  content: string;
  occurredAt?: string | null;
  source?: string | null;
  reference: AIContextReference;
}

export interface GroundedAIContext {
  incidentId: string;
  items: AIContextItem[];
  references: AIContextReference[];
  generatedAt: string;
  itemCount: number;
  truncated: boolean;
}

export interface AIContextBuilderOptions {
  maxEvents?: number;
  maxEvidence?: number;
  maxFindings?: number;
  maxContentLength?: number;
}
