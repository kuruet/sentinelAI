import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  ApiRequestError,
  getApplicationHealthReport,
  type ApplicationHealthReport,
  type ReportIncidentSeverity,
  type ReportIncidentStatus,
} from '../lib/api';
import '../styles/application-health-report.css';

const SEVERITIES: ReportIncidentSeverity[] = [
  'CRITICAL', 'HIGH', 'MEDIUM', 'LOW',
];

const STATUSES: ReportIncidentStatus[] = [
  'IDENTIFIED', 'INVESTIGATING', 'RESOLVED', 'CLOSED',
];

function dateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initialRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);

  return {
    start: dateInputValue(start),
    end: dateInputValue(end),
  };
}

function toUtcStart(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString();
}

function toUtcExclusiveEnd(value: string): string {
  const end = new Date(`${value}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return end.toISOString();
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatDuration(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hr`;
  return `${(minutes / 1440).toFixed(1)} days`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function comparisonText(changePercent: number | null, changeAbsolute: number): string {
  if (changePercent === null) {
    return changeAbsolute > 0
      ? 'No previous-period baseline'
      : 'No previous-period activity';
  }

  const direction = changeAbsolute > 0
    ? 'increase'
    : changeAbsolute < 0
      ? 'decrease'
      : 'no change';

  return `${Math.abs(changePercent).toFixed(1)}% ${direction} vs previous period`;
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="health-report__metric">
      <div className="health-report__metric-label">{label}</div>
      <div className="health-report__metric-value">{value}</div>
      <div className="health-report__metric-detail">{detail}</div>
    </Card>
  );
}

function Distribution({
  title,
  values,
  order,
}: {
  title: string;
  values: Record<string, number>;
  order: string[];
}) {
  const total = order.reduce((sum, key) => sum + (values[key] ?? 0), 0);

  return (
    <Card className="health-report__panel">
      <h2>{title}</h2>
      {total === 0 ? (
        <p className="health-report__muted">No records in this period.</p>
      ) : (
        <div className="health-report__distribution">
          {order.map((key) => {
            const count = values[key] ?? 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div className="health-report__distribution-row" key={key}>
                <div className="health-report__distribution-label">
                  <span>{formatLabel(key)}</span>
                  <span>{formatNumber(count)}</span>
                </div>
                <div
                  className="health-report__bar-track"
                  role="img"
                  aria-label={`${formatLabel(key)}: ${count} of ${total}`}
                >
                  <div
                    className="health-report__bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function DailyTrend({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ date: string; count: number }>;
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.count));
  const hasRecords = rows.some((row) => row.count > 0);
  const interval = Math.max(1, Math.ceil(rows.length / 7));

  return (
    <Card className="health-report__panel">
      <h2>{title}</h2>
      {!hasRecords ? (
        <p className="health-report__muted">No activity recorded in this period.</p>
      ) : (
        <>
          <div
            className="health-report__trend"
            role="img"
            aria-label={`${title} daily counts`}
          >
            {rows.map((row, index) => (
              <div className="health-report__trend-column" key={row.date}>
                <span className="health-report__trend-count">
                  {row.count > 0 ? row.count : ''}
                </span>
                <div className="health-report__trend-track">
                  <div
                    className="health-report__trend-bar"
                    style={{
                      height: `${Math.max(row.count > 0 ? 5 : 0, (row.count / maximum) * 100)}%`,
                    }}
                  />
                </div>
                <span className="health-report__trend-date">
                  {index % interval === 0 || index === rows.length - 1
                    ? row.date.slice(5)
                    : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="health-report__muted">
            Daily counts are grouped by UTC date.
          </p>
        </>
      )}
    </Card>
  );
}

function ActivityTypes({
  title,
  values,
}: {
  title: string;
  values: Record<string, number>;
}) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="health-report__panel">
      <h2>{title}</h2>
      {total === 0 ? (
        <p className="health-report__muted">No records in this period.</p>
      ) : (
        <div className="health-report__type-list">
          {entries.map(([type, count]) => (
            <div className="health-report__type-row" key={type}>
              <span>{formatLabel(type)}</span>
              <strong>{formatNumber(count)}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function validateRange(start: string, end: string): string | null {
  if (!start || !end) return 'Choose both a start date and an end date.';
  if (start > end) return 'The start date must not be after the end date.';

  const startDate = new Date(`${start}T00:00:00Z`);
  const exclusiveEnd = new Date(`${end}T00:00:00Z`);
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);

  const duration = exclusiveEnd.getTime() - startDate.getTime();

  if (duration > 90 * 24 * 60 * 60 * 1000) {
    return 'Choose a reporting period of 90 days or less.';
  }

  return null;
}

export default function ApplicationHealthReportPage() {
  const { token } = useAuth();
  const [range, setRange] = useState(initialRange);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [report, setReport] = useState<ApplicationHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadReport = useCallback(async () => {
    if (!token) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    const validation = validateRange(appliedRange.start, appliedRange.end);
    if (validation) {
      setRangeError(validation);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getApplicationHealthReport(
        token,
        toUtcStart(appliedRange.start),
        toUtcExclusiveEnd(appliedRange.end),
      );
      setReport(data);
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError
          ? cause.message
          : 'Unable to load the application health report.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, appliedRange]);

  useEffect(() => {
    void loadReport();
  }, [loadReport, refreshKey]);

  function applyRange() {
    const validation = validateRange(range.start, range.end);
    setRangeError(validation);

    if (validation) return;

    setAppliedRange({ ...range });
    setReport(null);
  }

  const currentReport = report;

  return (
    <main className="health-report page-enter">
      <header className="health-report__header">
        <div>
          <p className="health-report__eyebrow">OPERATIONS ANALYTICS</p>
          <h1>Application Health &amp; Trend Reports</h1>
          <p className="health-report__subtitle">
            Incident volume, operational activity, and resolution performance.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh report'}
        </Button>
      </header>

      <Card className="health-report__filters">
        <div className="health-report__date-field">
          <label htmlFor="health-report-start">Start date</label>
          <input
            id="health-report-start"
            type="date"
            value={range.start}
            max={range.end || undefined}
            onChange={(event) =>
              setRange((current) => ({ ...current, start: event.target.value }))
            }
          />
        </div>
        <div className="health-report__date-field">
          <label htmlFor="health-report-end">End date</label>
          <input
            id="health-report-end"
            type="date"
            value={range.end}
            min={range.start || undefined}
            max={dateInputValue(new Date())}
            onChange={(event) =>
              setRange((current) => ({ ...current, end: event.target.value }))
            }
          />
        </div>
        <Button type="button" onClick={applyRange} disabled={loading}>
          Apply date range
        </Button>
        {rangeError && (
          <p className="health-report__range-error" role="alert">{rangeError}</p>
        )}
      </Card>

      {error && (
        <Card className="health-report__error" role="alert">
          <div>
            <strong>Report unavailable</strong>
            <p>{error}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Try again
          </Button>
        </Card>
      )}

      {loading && !currentReport && (
        <Card className="health-report__loading" role="status">
          <span className="health-report__spinner" aria-hidden="true" />
          Loading application health data…
        </Card>
      )}

      {currentReport && (
        <>
          <div className="health-report__period">
            <span>
              Reporting period: <strong>{formatDate(currentReport.period.startAt)}</strong>
              {' – '}
              <strong>
                {formatDate(new Date(new Date(currentReport.period.endAt).getTime() - 1).toISOString())}
              </strong>
            </span>
            <span>Generated {formatDateTime(currentReport.generatedAt)}</span>
          </div>

          <section className="health-report__metrics" aria-label="Report summary">
            <Metric
              label="Incidents created"
              value={formatNumber(currentReport.incidentSummary.created.current)}
              detail={comparisonText(
                currentReport.incidentSummary.created.changePercent,
                currentReport.incidentSummary.created.changeAbsolute,
              )}
            />
            <Metric
              label="Events recorded"
              value={formatNumber(currentReport.activitySummary.events.current)}
              detail={comparisonText(
                currentReport.activitySummary.events.changePercent,
                currentReport.activitySummary.events.changeAbsolute,
              )}
            />
            <Metric
              label="Evidence collected"
              value={formatNumber(currentReport.activitySummary.evidence.current)}
              detail={comparisonText(
                currentReport.activitySummary.evidence.changePercent,
                currentReport.activitySummary.evidence.changeAbsolute,
              )}
            />
            <Metric
              label="Average resolution time"
              value={formatDuration(
                currentReport.incidentSummary.resolvedDuration.averageMinutes,
              )}
              detail={`${currentReport.incidentSummary.resolvedDuration.sampleCount} valid resolved samples`}
            />
          </section>

          <section className="health-report__grid">
            <Distribution
              title="Incidents by severity"
              values={currentReport.incidentSummary.bySeverity}
              order={SEVERITIES}
            />
            <Distribution
              title="Incidents by current status"
              values={currentReport.incidentSummary.byCurrentStatus}
              order={STATUSES}
            />
          </section>

          <section className="health-report__grid">
            <DailyTrend
              title="Daily event activity"
              rows={currentReport.activitySummary.eventsByDay}
            />
            <DailyTrend
              title="Daily evidence activity"
              rows={currentReport.activitySummary.evidenceByDay}
            />
          </section>

          <section className="health-report__grid">
            <ActivityTypes
              title="Events by type"
              values={currentReport.activitySummary.eventsByType}
            />
            <ActivityTypes
              title="Evidence by type"
              values={currentReport.activitySummary.evidenceByType}
            />
          </section>

          <section className="health-report__grid health-report__grid--details">
            <Card className="health-report__panel">
              <h2>Resolution performance</h2>
              <div className="health-report__detail-row">
                <span>Median resolution time</span>
                <strong>
                  {formatDuration(
                    currentReport.incidentSummary.resolvedDuration.medianMinutes,
                  )}
                </strong>
              </div>
              <div className="health-report__detail-row">
                <span>Valid resolution samples</span>
                <strong>
                  {formatNumber(currentReport.incidentSummary.resolvedDuration.sampleCount)}
                </strong>
              </div>
              <div className="health-report__detail-row">
                <span>Excluded resolution records</span>
                <strong>
                  {formatNumber(currentReport.incidentSummary.resolvedDuration.excludedCount)}
                </strong>
              </div>
            </Card>
            <Card className="health-report__panel">
              <h2>Data quality</h2>
              <div className="health-report__detail-row">
                <span>Evidence missing valid occurrence time</span>
                <strong>
                  {formatNumber(
                    currentReport.activitySummary.evidenceWithoutValidOccurrenceTime,
                  )}
                </strong>
              </div>
              <p className="health-report__muted">
                Evidence without a valid occurrence timestamp is reported separately
                and is not assigned to a reporting period.
              </p>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}
