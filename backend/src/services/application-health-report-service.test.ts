import test from 'node:test';
import assert from 'node:assert/strict';

import { generateApplicationHealthReport } from './application-health-report-service';

const period = {
  startAt: '2026-10-10T00:00:00.000Z',
  endAt: '2026-10-13T00:00:00.000Z',
};

test('aggregates only records in the selected period and compares equal prior period', () => {
  const report = generateApplicationHealthReport({
    period,
    generatedAt: '2026-10-13T08:00:00.000Z',
    incidents: [
      {
        id: 'current-1',
        createdAt: '2026-10-10T01:00:00.000Z',
        startedAt: '2026-10-10T01:00:00.000Z',
        resolvedAt: '2026-10-10T03:00:00.000Z',
        status: 'RESOLVED',
        severity: 'HIGH',
      },
      {
        id: 'previous-1',
        createdAt: '2026-10-08T12:00:00.000Z',
        startedAt: null,
        resolvedAt: null,
        status: 'INVESTIGATING',
        severity: 'CRITICAL',
      },
    ],
    events: [
      { id: 'event-current', incidentId: 'current-1', occurredAt: '2026-10-11T12:00:00.000Z', eventType: 'ALERT' },
      { id: 'event-previous', incidentId: 'previous-1', occurredAt: '2026-10-09T12:00:00.000Z', eventType: 'LOG' },
    ],
    evidence: [
      { id: 'evidence-current', incidentId: 'current-1', occurredAt: '2026-10-12T12:00:00.000Z', evidenceType: 'METRIC' },
      { id: 'evidence-missing-time', incidentId: 'current-1', occurredAt: null, evidenceType: 'OTHER' },
    ],
  });

  assert.equal(report.incidentSummary.created.current, 1);
  assert.equal(report.incidentSummary.created.previous, 1);
  assert.equal(report.incidentSummary.created.changeAbsolute, 0);
  assert.equal(report.incidentSummary.created.changePercent, 0);
  assert.equal(report.incidentSummary.bySeverity.HIGH, 1);
  assert.equal(report.incidentSummary.byCurrentStatus.RESOLVED, 1);
  assert.equal(report.incidentSummary.resolvedDuration.sampleCount, 1);
  assert.equal(report.incidentSummary.resolvedDuration.averageMinutes, 120);
  assert.equal(report.activitySummary.events.current, 1);
  assert.equal(report.activitySummary.events.previous, 1);
  assert.equal(report.activitySummary.eventsByType.ALERT, 1);
  assert.equal(report.activitySummary.evidence.current, 1);
  assert.equal(report.activitySummary.evidenceWithoutValidOccurrenceTime, 1);
  assert.deepEqual(report.activitySummary.eventsByDay.map((day) => day.date), [
    '2026-10-10',
    '2026-10-11',
    '2026-10-12',
  ]);
  assert.equal(report.activitySummary.eventsByDay[1].count, 1);
});

test('returns explicit empty metrics and null percentages for zero baselines', () => {
  const report = generateApplicationHealthReport({
    period,
    generatedAt: '2026-10-13T08:00:00.000Z',
    incidents: [],
    events: [],
    evidence: [],
  });

  assert.equal(report.incidentSummary.created.current, 0);
  assert.equal(report.incidentSummary.created.previous, 0);
  assert.equal(report.incidentSummary.created.changePercent, null);
  assert.equal(report.incidentSummary.resolvedDuration.averageMinutes, null);
  assert.equal(report.incidentSummary.resolvedDuration.medianMinutes, null);
  assert.equal(report.activitySummary.events.changePercent, null);
  assert.equal(report.activitySummary.evidence.changePercent, null);
  assert.deepEqual(report.activitySummary.eventsByDay.map((day) => day.count), [0, 0, 0]);
});

test('excludes invalid or negative resolution durations from duration statistics', () => {
  const report = generateApplicationHealthReport({
    period,
    generatedAt: '2026-10-13T08:00:00.000Z',
    incidents: [
      {
        id: 'invalid-duration',
        createdAt: '2026-10-10T01:00:00.000Z',
        startedAt: '2026-10-10T05:00:00.000Z',
        resolvedAt: '2026-10-10T03:00:00.000Z',
        status: 'RESOLVED',
        severity: 'MEDIUM',
      },
      {
        id: 'missing-duration',
        createdAt: '2026-10-11T01:00:00.000Z',
        startedAt: null,
        resolvedAt: null,
        status: 'INVESTIGATING',
        severity: 'LOW',
      },
    ],
    events: [],
    evidence: [],
  });

  assert.equal(report.incidentSummary.resolvedDuration.sampleCount, 0);
  assert.equal(report.incidentSummary.resolvedDuration.excludedCount, 2);
});

test('rejects invalid reporting periods', () => {
  assert.throws(
    () => generateApplicationHealthReport({
      period: { startAt: 'not-a-date', endAt: '2026-10-13T00:00:00.000Z' },
      incidents: [],
      events: [],
      evidence: [],
    }),
    /period.startAt must be a valid ISO-8601 timestamp/,
  );

  assert.throws(
    () => generateApplicationHealthReport({
      period: { startAt: '2026-10-13T00:00:00.000Z', endAt: '2026-10-13T00:00:00.000Z' },
      incidents: [],
      events: [],
      evidence: [],
    }),
    /period.endAt must be later/,
  );
});
