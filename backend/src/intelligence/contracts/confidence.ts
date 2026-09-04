export const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'] as const;

export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score?: number | null;
  rationale: string;
}
