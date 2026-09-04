import { createHash } from 'node:crypto';

import type { IntelligenceReference } from '../contracts/evidence-reference';
import type { IntelligenceFinding } from '../contracts/finding';
import type { IntelligenceHypothesis } from '../contracts/hypothesis';
import type { IntelligenceRecommendation } from '../contracts/recommendation';
import type { ExplainabilityInput, IntelligenceExplanation } from './explainability';

function stableId(targetType: IntelligenceExplanation['targetType'], targetId: string): string {
  const digest = createHash('sha256')
    .update(`${targetType}:${targetId}`)
    .digest('hex')
    .slice(0, 24);

  return `explanation-${digest}`;
}

function normalizeReferences(references: IntelligenceReference[]): IntelligenceReference[] {
  const unique = new Map<string, IntelligenceReference>();

  for (const reference of references) {
    unique.set(`${reference.type}:${reference.id}`, {
      type: reference.type,
      id: reference.id,
      reason: reference.reason.trim(),
    });
  }

  return [...unique.values()].sort((a, b) => {
    const left = `${a.type}:${a.id}`;
    const right = `${b.type}:${b.id}`;
    return left.localeCompare(right);
  });
}

function confidenceUncertainty(confidence: IntelligenceExplanation['confidence']): string[] {
  const uncertainty: string[] = [];

  if (confidence.level === 'LOW') {
    uncertainty.push('Confidence is low; additional investigation or evidence is required.');
  } else if (confidence.level === 'MEDIUM') {
    uncertainty.push(
      'Confidence is moderate; the available evidence does not eliminate uncertainty.',
    );
  }

  if (confidence.score !== undefined && confidence.score !== null && confidence.score < 0.8) {
    uncertainty.push(
      'The confidence score indicates that the conclusion should not be treated as definitive.',
    );
  }

  return uncertainty;
}

function explainFinding(finding: IntelligenceFinding): IntelligenceExplanation {
  const references = normalizeReferences(finding.references);

  return {
    targetType: 'FINDING',
    targetId: finding.id,
    explanation: finding.description.trim(),
    confidence: {
      level: finding.confidence.level,
      score: finding.confidence.score ?? null,
      rationale: finding.confidence.rationale.trim(),
    },
    supportingReferences: references,
    uncertainty: confidenceUncertainty(finding.confidence),
  };
}

function explainHypothesis(hypothesis: IntelligenceHypothesis): IntelligenceExplanation {
  const supporting = normalizeReferences(hypothesis.supportingReferences);
  const contradicting = normalizeReferences(hypothesis.contradictingReferences);

  const uncertainty = confidenceUncertainty(hypothesis.confidence);

  if (contradicting.length > 0) {
    uncertainty.push(
      `${contradicting.length} contradicting reference(s) are associated with this hypothesis.`,
    );
  }

  uncertainty.push('This hypothesis is a candidate explanation and is not a confirmed root cause.');

  return {
    targetType: 'HYPOTHESIS',
    targetId: hypothesis.id,
    explanation: hypothesis.description.trim(),
    confidence: {
      level: hypothesis.confidence.level,
      score: hypothesis.confidence.score ?? null,
      rationale: hypothesis.confidence.rationale.trim(),
    },
    supportingReferences: supporting,
    uncertainty,
  };
}

function explainRecommendation(
  recommendation: IntelligenceRecommendation,
): IntelligenceExplanation {
  const references = normalizeReferences(recommendation.references);

  return {
    targetType: 'RECOMMENDATION',
    targetId: recommendation.id,
    explanation: recommendation.action.trim(),
    confidence: {
      level: recommendation.confidence.level,
      score: recommendation.confidence.score ?? null,
      rationale: recommendation.confidence.rationale.trim(),
    },
    supportingReferences: references,
    uncertainty: confidenceUncertainty(recommendation.confidence),
  };
}

export class IntelligenceExplainabilityService {
  explain(input: ExplainabilityInput): IntelligenceExplanation {
    const targets = [
      input.finding ? explainFinding(input.finding) : undefined,
      input.hypothesis ? explainHypothesis(input.hypothesis) : undefined,
      input.recommendation ? explainRecommendation(input.recommendation) : undefined,
    ].filter((value): value is IntelligenceExplanation => value !== undefined);

    if (targets.length !== 1) {
      throw new Error('Exactly one intelligence target must be supplied for explanation.');
    }

    const explanation = targets[0];

    return {
      ...explanation,
      targetId: explanation.targetId,
      explanation: explanation.explanation.trim(),
      supportingReferences: normalizeReferences(explanation.supportingReferences),
      uncertainty: [...new Set(explanation.uncertainty.map((item) => item.trim()))],
    };
  }

  explainFinding(finding: IntelligenceFinding): IntelligenceExplanation {
    return explainFinding(finding);
  }

  explainHypothesis(hypothesis: IntelligenceHypothesis): IntelligenceExplanation {
    return explainHypothesis(hypothesis);
  }

  explainRecommendation(recommendation: IntelligenceRecommendation): IntelligenceExplanation {
    return explainRecommendation(recommendation);
  }

  static explanationId(
    targetType: IntelligenceExplanation['targetType'],
    targetId: string,
  ): string {
    return stableId(targetType, targetId);
  }
}
