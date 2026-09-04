export const INTELLIGENCE_REFERENCE_TYPES = [
  'INCIDENT',
  'EVENT',
  'EVIDENCE',
  'INVESTIGATION',
] as const;

export type IntelligenceReferenceType =
  (typeof INTELLIGENCE_REFERENCE_TYPES)[number];

export interface IntelligenceReference {
  type: IntelligenceReferenceType;
  id: string;
  reason: string;
}
