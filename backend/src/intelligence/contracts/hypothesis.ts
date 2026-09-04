import type { ConfidenceAssessment } from './confidence';
import type { IntelligenceReference } from './evidence-reference';

export interface IntelligenceHypothesis {
  id: string;
  title: string;
  description: string;
  confidence: ConfidenceAssessment;
  supportingReferences: IntelligenceReference[];
  contradictingReferences: IntelligenceReference[];
}
