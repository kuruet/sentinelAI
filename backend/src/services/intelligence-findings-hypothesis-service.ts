import { createHash } from 'node:crypto';

import type {
  IntelligenceFinding,
  IntelligenceHypothesis,
  IntelligenceReference,
} from '../intelligence';

function stableId(prefix: string, type: string, referenceIds: string[]): string {
  const normalized = [...referenceIds].sort().join('|');

  return `${prefix}-${createHash('sha256')
    .update(`${type}:${normalized}`)
    .digest('hex')
    .slice(0, 24)}`;
}

function uniqueReferences(references: IntelligenceReference[]): IntelligenceReference[] {
  const seen = new Set<string>();
  const result: IntelligenceReference[] = [];

  for (const reference of references) {
    const key = `${reference.type}:${reference.id}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(reference);
  }

  return result.sort((a, b) => {
    const typeComparison = a.type.localeCompare(b.type);

    if (typeComparison !== 0) {
      return typeComparison;
    }

    return a.id.localeCompare(b.id);
  });
}

function hypothesisConfidence(finding: IntelligenceFinding): IntelligenceFinding['confidence'] {
  if (finding.confidence.level === 'HIGH') {
    return {
      level: 'HIGH',
      rationale:
        'The hypothesis is derived from a high-confidence deterministic finding with explicit supporting references.',
    };
  }

  if (finding.confidence.level === 'MEDIUM') {
    return {
      level: 'MEDIUM',
      rationale:
        'The hypothesis is derived from a medium-confidence deterministic finding and remains a possible explanation rather than an established cause.',
    };
  }

  return {
    level: 'LOW',
    rationale:
      'The hypothesis is derived from a low-confidence deterministic finding and requires additional evidence before stronger conclusions can be made.',
  };
}

function buildHypothesis(finding: IntelligenceFinding): IntelligenceHypothesis {
  const supportingReferences = uniqueReferences(finding.references);

  return {
    id: stableId('hypothesis', finding.type, [
      finding.id,
      ...supportingReferences.map((reference) => reference.id),
    ]),
    title: `Possible explanation: ${finding.title}`,
    description:
      `The observed finding "${finding.title}" may indicate a contributing ` +
      'condition relevant to the incident. This is a hypothesis based on the ' +
      'available deterministic evidence and is not a confirmed root cause.',
    confidence: hypothesisConfidence(finding),
    supportingReferences,
    contradictingReferences: [],
  };
}

export class IntelligenceFindingsHypothesisService {
  buildFindings(findings: IntelligenceFinding[]): IntelligenceFinding[] {
    return [...findings]
      .map((finding) => ({
        ...finding,
        references: uniqueReferences(finding.references),
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  buildHypotheses(findings: IntelligenceFinding[]): IntelligenceHypothesis[] {
    const hypotheses = findings.map(buildHypothesis);

    return hypotheses.sort((a, b) => a.id.localeCompare(b.id));
  }

  build(findings: IntelligenceFinding[]): {
    findings: IntelligenceFinding[];
    hypotheses: IntelligenceHypothesis[];
  } {
    const normalizedFindings = this.buildFindings(findings);

    return {
      findings: normalizedFindings,
      hypotheses: this.buildHypotheses(normalizedFindings),
    };
  }
}
