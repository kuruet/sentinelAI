import type { IntelligenceFinding } from './finding';
import type { IntelligenceHypothesis } from './hypothesis';
import type { IntelligenceRecommendation } from './recommendation';

export interface DeterministicAnalysisResult {
  findings: IntelligenceFinding[];
}

export interface IntelligenceAnalysisResult {
  findings: IntelligenceFinding[];
  hypotheses: IntelligenceHypothesis[];
  recommendations: IntelligenceRecommendation[];
}

export interface IntelligenceAnalysisMetadata {
  generatedAt: string;
  analysisVersion: string;
}

export interface IntelligenceAnalysisOutput {
  result: IntelligenceAnalysisResult;
  metadata: IntelligenceAnalysisMetadata;
}
