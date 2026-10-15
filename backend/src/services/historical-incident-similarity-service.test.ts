import test from 'node:test';
import assert from 'node:assert/strict';

import type { IntelligenceContextSnapshot } from '../intelligence';
import { HistoricalIncidentSimilarityService } from './historical-incident-similarity-service';

const service = new HistoricalIncidentSimilarityService();

function makeSnapshot(options: {
  id: string;
  title: string;
  description?: string | null;
  status?: 'IDENTIFIED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt?: string;
  resolvedAt?: string | null;
  eventTitles?: string[];
  evidenceTitles?: string[];
  contentHashes?: string[];
  investigationSummary?: string | null;
}): IntelligenceContextSnapshot {
  const createdAt = options.createdAt ?? '2026-10-01T10:00:00.000Z';

  return {
    context: {
      incident: {
        id: options.id,
        title: options.title,
        description: options.description ?? null,
        status: options.status ?? 'INVESTIGATING',
        severity: options.severity ?? 'HIGH',
        priority: 2,
        startedAt: createdAt,
        resolvedAt: options.resolvedAt ?? null,
        closedAt: null,
        createdAt,
        updatedAt: createdAt,
      },
      events: (options.eventTitles ?? []).map((title, index) => ({
        id: `${options.id}-event-${index}`,
        incidentId: options.id,
        eventType: 'ALERT' as const,
        occurredAt: createdAt,
        sequence: index + 1,
        title,
        description: null,
        source: 'test-monitor',
        metadata: null,
        createdAt,
      })),
      evidence: (options.evidenceTitles ?? []).map((title, index) => ({
        id: `${options.id}-evidence-${index}`,
        incidentId: options.id,
        evidenceType: 'LOG' as const,
        title,
        description: null,
        source: 'test-collector',
        sourceRef: null,
        collectedAt: createdAt,
        occurredAt: createdAt,
        contentHash: options.contentHashes?.[index] ?? null,
        trustLevel: null,
        metadata: null,
        createdAt,
        updatedAt: createdAt,
      })),
      investigation: options.investigationSummary
        ? {
            id: `${options.id}-investigation`,
            incidentId: options.id,
            summary: options.investigationSummary,
            startedAt: createdAt,
            completedAt: options.resolvedAt ?? null,
            createdAt,
            updatedAt: createdAt,
          }
        : null,
    },
    metadata: {
      generatedAt: createdAt,
      eventCount: (options.eventTitles ?? []).length,
      evidenceCount: (options.evidenceTitles ?? []).length,
      hasInvestigation: Boolean(options.investigationSummary),
    },
  };
}

test('excludes the current incident from its own historical results', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Checkout database timeout',
    eventTitles: ['Database connection timeout'],
  });

  const results = service.findSimilar(current, [current]);

  assert.deepEqual(results, []);
});

test('ranks a stronger historical match above a weaker match', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Checkout database connection timeout',
    description: 'Checkout requests fail during database connection timeout',
    eventTitles: ['Database connection timeout', 'Checkout request failed'],
    evidenceTitles: ['PostgreSQL connection pool exhausted'],
    contentHashes: ['hash-checkout-1'],
  });

  const strong = makeSnapshot({
    id: 'strong',
    title: 'Checkout database connection timeout',
    description: 'Checkout requests fail during database connection timeout',
    status: 'RESOLVED',
    resolvedAt: '2026-10-02T11:00:00.000Z',
    eventTitles: ['Database connection timeout', 'Checkout request failed'],
    evidenceTitles: ['PostgreSQL connection pool exhausted'],
    contentHashes: ['hash-checkout-1'],
    investigationSummary: 'Database connection pool exhaustion caused checkout failures',
  });

  const weak = makeSnapshot({
    id: 'weak',
    title: 'Checkout latency increased',
    description: 'Checkout latency increased',
    eventTitles: ['Checkout latency increased'],
  });

  const results = service.findSimilar(current, [weak, strong]);

  assert.equal(results.length, 2);
  assert.equal(results[0].incidentId, 'strong');
  assert.ok(results[0].similarityScore > results[1].similarityScore);
});

test('does not match incidents with no overlapping signals', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Checkout database timeout',
    description: 'PostgreSQL connection timeout',
    eventTitles: ['Database connection timeout'],
    evidenceTitles: ['PostgreSQL pool exhausted'],
    contentHashes: ['hash-current'],
  });

  const unrelated = makeSnapshot({
    id: 'unrelated',
    title: 'Image rendering pipeline corruption',
    description: 'Thumbnail rendering produced malformed image artifacts',
    eventTitles: ['Image renderer checksum mismatch'],
    evidenceTitles: ['Image decoder invalid pixel buffer'],
    contentHashes: ['hash-unrelated'],
  });

  assert.deepEqual(service.findSimilar(current, [unrelated]), []);
});

test('handles missing evidence and investigation data without throwing', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Payment gateway timeout',
  });

  const candidate = makeSnapshot({
    id: 'candidate',
    title: 'Payment gateway timeout',
  });

  assert.doesNotThrow(() => service.findSimilar(current, [candidate]));
  assert.equal(service.findSimilar(current, [candidate]).length, 1);
});

test('enforces the requested result limit', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Checkout database timeout',
  });

  const candidates = Array.from({ length: 4 }, (_, index) =>
    makeSnapshot({
      id: `candidate-${index}`,
      title: 'Checkout database timeout',
      createdAt: `2026-10-0${index + 1}T10:00:00.000Z`,
    }),
  );

  assert.equal(service.findSimilar(current, candidates, 2).length, 2);
});

test('reports actual incident status and does not infer resolution', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Payment gateway timeout',
  });

  const candidate = makeSnapshot({
    id: 'candidate',
    title: 'Payment gateway timeout',
    status: 'RESOLVED',
    resolvedAt: '2026-10-02T11:00:00.000Z',
  });

  const [match] = service.findSimilar(current, [candidate]);

  assert.equal(match.status, 'RESOLVED');
  assert.equal(match.resolvedAt, '2026-10-02T11:00:00.000Z');
  assert.ok(match.similarityScore >= 0 && match.similarityScore <= 100);
});
test('rejects generic telemetry overlap between different failure modes', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Checkout PostgreSQL connection failures',
    description: 'Checkout requests fail because database connections are refused',
    eventTitles: [
      'Service alert triggered',
      'Error rate elevated',
      'PostgreSQL connection refused',
    ],
    evidenceTitles: [
      'Application logs collected',
      'Service metrics collected',
      'PostgreSQL connection refused',
    ],
    investigationSummary:
      'PostgreSQL database unavailable caused checkout requests to fail',
  });

  const differentFailure = makeSnapshot({
    id: 'different-failure',
    title: 'Payment provider credential rejection',
    description: 'Payment requests fail because provider credentials are invalid',
    eventTitles: [
      'Service alert triggered',
      'Error rate elevated',
      'Provider credential rejected',
    ],
    evidenceTitles: [
      'Application logs collected',
      'Service metrics collected',
      'Provider authentication rejected',
    ],
    investigationSummary:
      'Payment provider rejected configured authentication credentials',
  });

  const results = service.findSimilar(current, [differentFailure]);

  assert.deepEqual(results, []);
});

test('preserves exact evidence fingerprint matches across different incident titles', () => {
  const current = makeSnapshot({
    id: 'current',
    title: 'Checkout database connection failure',
    contentHashes: ['sha256-identical-evidence'],
  });

  const candidate = makeSnapshot({
    id: 'candidate',
    title: 'Database connection pool exhaustion',
    contentHashes: ['sha256-identical-evidence'],
  });

  const results = service.findSimilar(current, [candidate]);

  assert.equal(results.length, 1);
  assert.equal(results[0].incidentId, 'candidate');
  assert.ok(
    results[0].matchReasons.some((reason) => reason.signal === 'CONTENT_HASH'),
  );
});



