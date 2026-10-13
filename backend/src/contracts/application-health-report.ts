export type ReportIncidentStatus =
  | 'IDENTIFIED'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'CLOSED';

export type ReportIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReportEventType =
  | 'ALERT'
  | 'LOG'
  | 'METRIC'
  | 'DEPLOYMENT'
  | 'CONFIGURATION_CHANGE'
  | 'MANUAL'
  | 'SYSTEM';

export type ReportEvidenceType =
  | 'LOG'
  | 'METRIC'
  | 'TRACE'
  | 'ALERT'
  | 'DEPLOYMENT'
  | 'CONFIGURATION'
  | 'DOCUMENT'
  | 'MANUAL'
  | 'OTHER';

export interface ApplicationHealthReportPeriod {
  /** Inclusive UTC boundary, as an ISO-8601 timestamp. */
  startAt: string;
  /** Exclusive UTC boundary, as an ISO-8601 timestamp. */
  endAt: string;
}

export interface ReportIncidentRecord {
  id: string;
  createdAt: string;
  startedAt: string | null;
  resolvedAt: string | null;
  status: ReportIncidentStatus;
  severity: ReportIncidentSeverity;
}

export interface ReportEventRecord {
  id: string;
  incidentId: string;
  occurredAt: string;
  eventType: ReportEventType;
}

export interface ReportEvidenceRecord {
  id: string;
  incidentId: string;
  /** Missing/invalid occurrence times are counted separately, not assigned to a period. */
  occurredAt: string | null;
  evidenceType: ReportEvidenceType;
}

export interface ReportCountComparison {
  current: number;
  previous: number;
  /** Null when the previous count is zero, because a percentage change is undefined. */
  changePercent: number | null;
  changeAbsolute: number;
}

export interface ApplicationHealthReport {
  generatedAt: string;
  period: {
    startAt: string;
    endAt: string;
    previousStartAt: string;
    previousEndAt: string;
  };
  incidentSummary: {
    created: ReportCountComparison;
    bySeverity: Record<ReportIncidentSeverity, number>;
    byCurrentStatus: Record<ReportIncidentStatus, number>;
    resolvedDuration: {
      sampleCount: number;
      averageMinutes: number | null;
      medianMinutes: number | null;
      excludedCount: number;
    };
  };
  activitySummary: {
    events: ReportCountComparison;
    evidence: ReportCountComparison;
    eventsByType: Record<ReportEventType, number>;
    evidenceByType: Record<ReportEvidenceType, number>;
    eventsByDay: Array<{ date: string; count: number }>;
    evidenceByDay: Array<{ date: string; count: number }>;
    evidenceWithoutValidOccurrenceTime: number;
  };
}
