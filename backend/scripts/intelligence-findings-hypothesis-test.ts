import assert from 'node:assert/strict';

import { IntelligenceFindingsHypothesisService } from '../src/services/intelligence-findings-hypothesis-service';

import type { IntelligenceFinding } from '../src/intelligence';

const service = new IntelligenceFindingsHypothesisService();

const findings: IntelligenceFinding[] = [
  {
    id: 'finding-b',
    type: 'ANOMALY',
    title: 'Event burst detected',
    description: 'A high-density temporal window was observed.',
    confidence: {
      level: 'HIGH',
      rationale: 'Deterministic temporal signal.',
    },
    references: [
      {
        type: 'EVENT',
        id: 'event-2',
        reason: 'Event participates in burst.',
      },
      {
        type: 'EVENT',
        id: 'event-1',
        reason: 'Event participates in burst.',
      },
      {
        type: 'EVENT',
        id: 'event-1',
        reason: 'Duplicate reference for normalization test.',
      },
    ],
  },
  {
    id: 'finding-a',
    type: 'CORRELATION',
    title: 'Events are correlated',
    description: 'Events occur within a deterministic temporal relationship.',
    confidence: {
      level: 'MEDIUM',
      rationale: 'Temporal correlation.',
    },
    references: [
      {
        type: 'EVENT',
        id: 'event-3',
        reason: 'First correlated event.',
      },
      {
        type: 'EVIDENCE',
        id: 'evidence-1',
        reason: 'Supporting evidence.',
      },
    ],
  },
  {
    id: 'finding-c',
    type: 'PATTERN',
    title: 'Low-confidence pattern',
    description: 'A weak recurring pattern was observed.',
    confidence: {
      level: 'LOW',
      rationale: 'Limited deterministic support.',
    },
    references: [
      {
        type: 'EVIDENCE',
        id: 'evidence-2',
        reason: 'Observed pattern.',
      },
    ],
  },
];

const original = structuredClone(findings);

const first = service.build(findings);
const second = service.build(findings);

// Deterministic repeatability
assert.deepEqual(first, second);

// Source immutability
assert.deepEqual(findings, original);

// Findings preserved
assert.equal(first.findings.length, 3);

// Findings sorted deterministically
assert.deepEqual(
  first.findings.map((finding) => finding.id),
  ['finding-a', 'finding-b', 'finding-c'],
);

// Duplicate references removed
const normalizedBurst = first.findings.find((finding) => finding.id === 'finding-b');

assert.ok(normalizedBurst);
assert.equal(normalizedBurst.references.length, 2);

// Reference ordering deterministic
assert.deepEqual(
  normalizedBurst.references.map((reference) => `${reference.type}:${reference.id}`),
  ['EVENT:event-1', 'EVENT:event-2'],
);

// One hypothesis per finding
assert.equal(first.hypotheses.length, first.findings.length);

// Hypothesis IDs deterministic
for (const hypothesis of first.hypotheses) {
  assert.match(hypothesis.id, /^hypothesis-[a-f0-9]{24}$/);

  assert.ok(hypothesis.title.startsWith('Possible explanation:'));
  assert.ok(hypothesis.description.includes('not a confirmed root cause'));

  assert.ok(hypothesis.supportingReferences.length > 0);

  assert.deepEqual(hypothesis.contradictingReferences, []);
}

// Confidence propagation
const highHypothesis = first.hypotheses.find(
  (hypothesis) => hypothesis.title === 'Possible explanation: Event burst detected',
);

assert.ok(highHypothesis);
assert.equal(highHypothesis.confidence.level, 'HIGH');

const mediumHypothesis = first.hypotheses.find(
  (hypothesis) => hypothesis.title === 'Possible explanation: Events are correlated',
);

assert.ok(mediumHypothesis);
assert.equal(mediumHypothesis.confidence.level, 'MEDIUM');

const lowHypothesis = first.hypotheses.find(
  (hypothesis) => hypothesis.title === 'Possible explanation: Low-confidence pattern',
);

assert.ok(lowHypothesis);
assert.equal(lowHypothesis.confidence.level, 'LOW');

// Empty input
assert.deepEqual(service.build([]), {
  findings: [],
  hypotheses: [],
});

// No mutation through returned finding references
first.findings[0].references.push({
  type: 'INCIDENT',
  id: 'incident-1',
  reason: 'Mutation test.',
});

assert.equal(
  findings.some((finding) => finding.references.some((reference) => reference.id === 'incident-1')),
  false,
);

console.log('STEP 4.6 FINDINGS & HYPOTHESIS MODEL TEST: PASS');
