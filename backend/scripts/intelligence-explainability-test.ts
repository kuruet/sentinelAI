import assert from 'node:assert/strict';

import { IntelligenceExplainabilityService } from '../src/intelligence';

const service = new IntelligenceExplainabilityService();

const finding = {
  id: 'finding-4-13',
  type: 'TEMPORAL' as const,
  title: 'Deployment preceded timeout alert',
  description: 'The checkout deployment occurred before the database timeout alert.',
  confidence: {
    level: 'MEDIUM' as const,
    score: 0.72,
    rationale: 'The temporal relationship is directly supported by supplied events.',
  },
  references: [
    {
      type: 'EVENT' as const,
      id: 'event-2',
      reason: 'Deployment event.',
    },
    {
      type: 'EVENT' as const,
      id: 'event-1',
      reason: 'Timeout alert.',
    },
    {
      type: 'EVENT' as const,
      id: 'event-2',
      reason: 'Duplicate reference.',
    },
  ],
};

const findingExplanation = service.explainFinding(finding);

assert.equal(findingExplanation.targetType, 'FINDING');
assert.equal(findingExplanation.targetId, 'finding-4-13');
assert.equal(findingExplanation.explanation, finding.description);
assert.deepEqual(
  findingExplanation.supportingReferences.map((reference) => `${reference.type}:${reference.id}`),
  ['EVENT:event-1', 'EVENT:event-2'],
);
assert.equal(findingExplanation.confidence.level, 'MEDIUM');
assert.equal(findingExplanation.confidence.score, 0.72);
assert.equal(findingExplanation.uncertainty.length, 2);

const hypothesis = {
  id: 'hypothesis-4-13',
  title: 'Deployment-related regression',
  description: 'The deployment is a candidate explanation for the observed timeout behavior.',
  confidence: {
    level: 'LOW' as const,
    score: 0.41,
    rationale: 'Temporal evidence exists, but causation is not established.',
  },
  supportingReferences: [
    {
      type: 'EVENT' as const,
      id: 'event-2',
      reason: 'Deployment preceded the alert.',
    },
  ],
  contradictingReferences: [
    {
      type: 'EVIDENCE' as const,
      id: 'evidence-2',
      reason: 'No corresponding deployment error was observed.',
    },
  ],
};

const hypothesisExplanation = service.explainHypothesis(hypothesis);

assert.equal(hypothesisExplanation.targetType, 'HYPOTHESIS');
assert.equal(hypothesisExplanation.targetId, 'hypothesis-4-13');
assert.equal(hypothesisExplanation.confidence.level, 'LOW');
assert.equal(hypothesisExplanation.supportingReferences[0].id, 'event-2');
assert.equal(
  hypothesisExplanation.uncertainty.some((item) => item.includes('not a confirmed root cause')),
  true,
);
assert.equal(
  hypothesisExplanation.uncertainty.some((item) => item.includes('contradicting reference')),
  true,
);

const recommendation = {
  id: 'recommendation-4-13',
  title: 'Review deployment changes',
  action: 'Compare the deployment with the previous known-good checkout version.',
  priority: 'HIGH' as const,
  confidence: {
    level: 'HIGH' as const,
    score: 0.88,
    rationale: 'The deployment and alert are directly represented in context.',
  },
  references: [
    {
      type: 'EVENT' as const,
      id: 'event-2',
      reason: 'Deployment event.',
    },
  ],
};

const recommendationExplanation = service.explainRecommendation(recommendation);

assert.equal(recommendationExplanation.targetType, 'RECOMMENDATION');
assert.equal(recommendationExplanation.explanation, recommendation.action);
assert.equal(recommendationExplanation.confidence.level, 'HIGH');
assert.equal(recommendationExplanation.uncertainty.length, 0);

const deterministicIdA = IntelligenceExplainabilityService.explanationId('FINDING', 'finding-4-13');

const deterministicIdB = IntelligenceExplainabilityService.explanationId('FINDING', 'finding-4-13');

assert.equal(deterministicIdA, deterministicIdB);
assert.match(deterministicIdA, /^explanation-[a-f0-9]{24}$/);

assert.throws(() => service.explain({}), /Exactly one intelligence target/);

assert.throws(
  () =>
    service.explain({
      finding,
      hypothesis,
    }),
  /Exactly one intelligence target/,
);

console.log('STEP 4.13 EXPLAINABILITY TEST: PASS');
