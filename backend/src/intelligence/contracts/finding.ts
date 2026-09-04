import type { ConfidenceAssessment } from './confidence';
import type { IntelligenceReference } from './evidence-reference';

export const INTELLIGENCE_FINDING_TYPES = [
  'TEMPORAL',
  'CORRELATION',
  'ANOMALY',
  'EVIDENCE',
  'IMPACT',
  'PATTERN',
] as const;

export type IntelligenceFindingType =
  (typeof INTELLIGENCE_FINDING_TYPES)[number];

export interface IntelligenceFinding {
  id: string;
  type: IntelligenceFindingType;
  title: string;
  description: string;
  confidence: ConfidenceAssessment;
  references: IntelligenceReference[];
}
