import type { ConfidenceAssessment } from './confidence';
import type { IntelligenceReference } from './evidence-reference';

export const RECOMMENDATION_PRIORITIES = [
  'IMMEDIATE',
  'HIGH',
  'NORMAL',
  'LOW',
] as const;

export type RecommendationPriority =
  (typeof RECOMMENDATION_PRIORITIES)[number];

export interface IntelligenceRecommendation {
  id: string;
  title: string;
  action: string;
  priority: RecommendationPriority;
  confidence: ConfidenceAssessment;
  references: IntelligenceReference[];
}
