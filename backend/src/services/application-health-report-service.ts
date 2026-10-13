import type {
  ApplicationHealthReport,
  ApplicationHealthReportPeriod,
  ReportEventRecord,
  ReportEventType,
  ReportEvidenceRecord,
  ReportEvidenceType,
  ReportIncidentRecord,
  ReportIncidentSeverity,
  ReportIncidentStatus,
} from '../contracts/application-health-report';

export interface GenerateApplicationHealthReportInput {
  period: ApplicationHealthReportPeriod;
  /** Must contain only incidents the caller has already authorized the user to access. */
  incidents: readonly ReportIncidentRecord[];
  /** Must already be filtered by the caller to incidents the user can access and to the comparison window. */
  events: readonly ReportEventRecord[];
  /** Must already be filtered by the caller to incidents the user can access and to the comparison window. */
  evidence: readonly ReportEvidenceRecord[];
  /** Count of all evidence rows without a valid occurrence timestamp for incidents the user can access. */
  evidenceWithoutValidOccurrenceTimeCount?: number;
  /** Injectable for deterministic tests; defaults to the current time. */
  generatedAt?: string;
}

const INCIDENT_SEVERITIES: readonly ReportIncidentSeverity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

const INCIDENT_STATUSES: readonly ReportIncidentStatus[] = [
  'IDENTIFIED',
  'INVESTIGATING',
  'RESOLVED',
  'CLOSED',
];

const EVENT_TYPES: readonly ReportEventType[] = [
  'ALERT',
  'LOG',
  'METRIC',
  'DEPLOYMENT',
  'CONFIGURATION_CHANGE',
  'MANUAL',
  'SYSTEM',
];

const EVIDENCE_TYPES: readonly ReportEvidenceType[] = [
  'LOG',
  'METRIC',
  'TRACE',
  'ALERT',
  'DEPLOYMENT',
  'CONFIGURATION',
  'DOCUMENT',
  'MANUAL',
  'OTHER',
];

function parseTimestamp(value: string | null | undefined, fieldName: string): number {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid ISO-8601 timestamp.`);
  }

  return parsed;
}

function isInPeriod(timestamp: number, start: number, end: number): boolean {
  return timestamp >= start && timestamp < end;
}

function countBy<T extends string>(
  values: readonly T[],
  knownValues: readonly T[],
): Record<T, number> {
  const result = {} as Record<T, number>;
  for (const value of knownValues) result[value] = 0;
  for (const value of values) {
    if (Object.prototype.hasOwnProperty.call(result, value)) result[value]++;
  }
  return result;
}

function countComparison(current: number, previous: number) {
  return {
    current,
    previous,
    changeAbsolute: current - previous,
    changePercent: previous === 0 ? null : ((current - previous) / previous) * 100,
  };
}

function createDailyBuckets(start: number, end: number): Array<{ date: string; count: number }> {
  const buckets: Array<{ date: string; count: number }> = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor.getTime() < end) {
    buckets.push({ date: cursor.toISOString().slice(0, 10), count: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return buckets;
}

function buildDailyTrend(
  timestamps: readonly number[],
  start: number,
  end: number,
): Array<{ date: string; count: number }> {
  const buckets = createDailyBuckets(start, end);
  const byDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  for (const timestamp of timestamps) {
    if (!isInPeriod(timestamp, start, end)) continue;
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const bucket = byDate.get(date);
    if (bucket) bucket.count++;
  }

  return buckets;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Aggregates records already filtered by an authorization-aware caller. It
 * performs no I/O and does not grant access to records. Incident rows should
 * cover the two creation-count windows; event/evidence rows should cover the
 * current and previous activity windows. The current period uses [startAt,
 * endAt), and the previous period has the same duration immediately before it.
 */
export function generateApplicationHealthReport(
  input: GenerateApplicationHealthReportInput,
): ApplicationHealthReport {
  const start = parseTimestamp(input.period.startAt, 'period.startAt');
  const end = parseTimestamp(input.period.endAt, 'period.endAt');
  if (end <= start) throw new Error('period.endAt must be later than period.startAt.');

  const generatedAt = input.generatedAt ?? new Date().toISOString();
  parseTimestamp(generatedAt, 'generatedAt');

  const duration = end - start;
  const previousStart = start - duration;
  const previousEnd = start;

  const incidentCreatedAt = input.incidents.map((incident) => ({
    incident,
    timestamp: Date.parse(incident.createdAt),
  })).filter((item) => Number.isFinite(item.timestamp));

  const currentIncidents = incidentCreatedAt.filter((item) =>
    isInPeriod(item.timestamp, start, end),
  );
  const previousIncidents = incidentCreatedAt.filter((item) =>
    isInPeriod(item.timestamp, previousStart, previousEnd),
  );

  const currentIncidentRecords = currentIncidents.map((item) => item.incident);
  const resolutionDurations: number[] = [];
  let excludedResolutionCount = 0;

  for (const incident of currentIncidentRecords) {
    if (!incident.startedAt || !incident.resolvedAt) {
      excludedResolutionCount++;
      continue;
    }
    const started = Date.parse(incident.startedAt);
    const resolved = Date.parse(incident.resolvedAt);
    if (!Number.isFinite(started) || !Number.isFinite(resolved) || resolved < started) {
      excludedResolutionCount++;
      continue;
    }
    resolutionDurations.push((resolved - started) / 60_000);
  }

  const currentEvents = input.events.filter((event) => {
    const timestamp = Date.parse(event.occurredAt);
    return Number.isFinite(timestamp) && isInPeriod(timestamp, start, end);
  });
  const previousEvents = input.events.filter((event) => {
    const timestamp = Date.parse(event.occurredAt);
    return Number.isFinite(timestamp) && isInPeriod(timestamp, previousStart, previousEnd);
  });

  let evidenceWithoutValidOccurrenceTime = input.evidenceWithoutValidOccurrenceTimeCount ?? 0;
  const currentEvidence: ReportEvidenceRecord[] = [];
  const previousEvidence: ReportEvidenceRecord[] = [];
  const currentEvidenceTimes: number[] = [];

  for (const item of input.evidence) {
    if (!item.occurredAt || !Number.isFinite(Date.parse(item.occurredAt))) {
      evidenceWithoutValidOccurrenceTime++;
      continue;
    }
    const timestamp = Date.parse(item.occurredAt);
    if (isInPeriod(timestamp, start, end)) {
      currentEvidence.push(item);
      currentEvidenceTimes.push(timestamp);
    } else if (isInPeriod(timestamp, previousStart, previousEnd)) {
      previousEvidence.push(item);
    }
  }

  const currentEventTimes = currentEvents.map((event) => Date.parse(event.occurredAt));
  const averageMinutes = resolutionDurations.length
    ? resolutionDurations.reduce((sum, value) => sum + value, 0) / resolutionDurations.length
    : null;

  return {
    generatedAt: new Date(generatedAt).toISOString(),
    period: {
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      previousStartAt: new Date(previousStart).toISOString(),
      previousEndAt: new Date(previousEnd).toISOString(),
    },
    incidentSummary: {
      created: countComparison(currentIncidents.length, previousIncidents.length),
      bySeverity: countBy(
        currentIncidentRecords.map((incident) => incident.severity),
        INCIDENT_SEVERITIES,
      ),
      byCurrentStatus: countBy(
        currentIncidentRecords.map((incident) => incident.status),
        INCIDENT_STATUSES,
      ),
      resolvedDuration: {
        sampleCount: resolutionDurations.length,
        averageMinutes,
        medianMinutes: median(resolutionDurations),
        excludedCount: excludedResolutionCount,
      },
    },
    activitySummary: {
      events: countComparison(currentEvents.length, previousEvents.length),
      evidence: countComparison(currentEvidence.length, previousEvidence.length),
      eventsByType: countBy(
        currentEvents.map((event) => event.eventType),
        EVENT_TYPES,
      ),
      evidenceByType: countBy(
        currentEvidence.map((item) => item.evidenceType),
        EVIDENCE_TYPES,
      ),
      eventsByDay: buildDailyTrend(currentEventTimes, start, end),
      evidenceByDay: buildDailyTrend(currentEvidenceTimes, start, end),
      evidenceWithoutValidOccurrenceTime,
    },
  };
}
