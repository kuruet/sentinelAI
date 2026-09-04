import type { ConfidenceAssessment } from '../contracts/confidence';
import type { IntelligenceReference } from '../contracts/evidence-reference';
import type { IntelligenceFinding } from '../contracts/finding';
import type { IntelligenceHypothesis } from '../contracts/hypothesis';
import type { IntelligenceRecommendation } from '../contracts/recommendation';

export const EXPLAINABILITY_TARGET_TYPES = [
  'FINDING',
  'HYPOTHESIS',
  'RECOMMENDATION',
] as const;

export type ExplainabilityTargetType =
  (typeof EXPLAINABILITY_TARGET_TYPES)[number];

export interface IntelligenceExplanation {
  targetType: ExplainabilityTargetType;
  targetId: string;
  explanation: string;
  confidence: ConfidenceAssessment;
  supportingReferences: IntelligenceReference[];
  uncertainty: string[];
}

export interface ExplainabilityInput {
  finding?: IntelligenceFinding;
  hypothesis?: IntelligenceHypothesis;
  recommendation?: IntelligenceRecommendation;
}
