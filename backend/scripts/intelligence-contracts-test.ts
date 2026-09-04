import assert from 'node:assert/strict';

import {
  CONFIDENCE_LEVELS,
  INTELLIGENCE_FINDING_TYPES,
  INTELLIGENCE_REFERENCE_TYPES,
  RECOMMENDATION_PRIORITIES,
  type ConfidenceAssessment,
  type IntelligenceAnalysisOutput,
  type IntelligenceContextSnapshot,
  type IntelligenceFinding,
  type IntelligenceHypothesis,
  type IntelligenceRecommendation,
} from '../src/intelligence';

assert.deepEqual(CONFIDENCE_LEVELS, ['HIGH', 'MEDIUM', 'LOW']);

assert.deepEqual(INTELLIGENCE_REFERENCE_TYPES, [
  'INCIDENT',
  'EVENT',
  'EVIDENCE',
  'INVESTIGATION',
]);

assert.deepEqual(INTELLIGENCE_FINDING_TYPES, [
  'TEMPORAL',
  'CORRELATION',
  'ANOMALY',
  'EVIDENCE',
  'IMPACT',
  'PATTERN',
]);

assert.deepEqual(RECOMMENDATION_PRIORITIES, [
  'IMMEDIATE',
  'HIGH',
  'NORMAL',
  'LOW',
]);

const confidence: ConfidenceAssessment = {
  level: 'HIGH',
  score: 0.92,
  rationale: 'Multiple independent signals support the finding.',
};

const finding: IntelligenceFinding = {
  id: 'finding-1',
  type: 'CORRELATION',
  title: 'Deployment and error spike correlate',
  description: 'A deployment occurred immediately before the error increase.',
  confidence,
  references: [
    {
      type: 'EVENT',
      id: 'event-1',
      reason: 'Deployment event precedes the observed error spike.',
    },
  ],
};

const hypothesis: IntelligenceHypothesis = {
  id: 'hypothesis-1',
  title: 'Recent deployment caused the incident',
  description: 'The timing and related evidence make the deployment a plausible cause.',
  confidence,
  supportingReferences: [
    {
      type: 'EVENT',
      id: 'event-1',
      reason: 'Deployment occurred before the failure pattern.',
    },
  ],
  contradictingReferences: [],
};

const recommendation: IntelligenceRecommendation = {
  id: 'recommendation-1',
  title: 'Review the recent deployment',
  action: 'Inspect the deployment changes and compare them with the first failing signals.',
  priority: 'HIGH',
  confidence,
  references: [
    {
      type: 'EVENT',
      id: 'event-1',
      reason: 'The deployment is temporally related to the incident.',
    },
  ],
};

const contextSnapshot = null as unknown as IntelligenceContextSnapshot;

const analysisOutput: IntelligenceAnalysisOutput = {
  result: {
    findings: [finding],
    hypotheses: [hypothesis],
    recommendations: [recommendation],
  },
  metadata: {
    generatedAt: new Date().toISOString(),
    analysisVersion: '4.2.0',
  },
};

assert.ok(contextSnapshot === null);
assert.equal(analysisOutput.result.findings.length, 1);
assert.equal(analysisOutput.result.hypotheses.length, 1);
assert.equal(analysisOutput.result.recommendations.length, 1);

console.log('STEP 4.2 CONTRACT TEST: PASS');
