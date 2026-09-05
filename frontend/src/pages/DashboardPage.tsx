import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiRequestError,
  type IncidentResponse,
  type IncidentSeverity,
  type IncidentStatus,
  listIncidents,
} from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const SEVERITIES: IncidentSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const STATUSES: IncidentStatus[] = ['IDENTIFIED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

function formatStatus(status: IncidentStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatSeverity(severity: IncidentSeverity): string {
  return severity.charAt(0) + severity.slice(1).toLowerCase();
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function severityVariant(severity: IncidentSeverity): 'danger' | 'warning' | 'info' {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return 'danger';
    case 'MEDIUM':
      return 'warning';
    default:
      return 'info';
  }
}
function statusVariant(status: IncidentStatus): 'info' | 'warning' | 'success' {
  switch (status) {
    case 'IDENTIFIED':
      return 'info';
    case 'INVESTIGATING':
      return 'warning';
    case 'RESOLVED':
    case 'CLOSED':
      return 'success';
  }
}
function MetricCard({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: number;
  detail: string;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? 'dashboard-metric dashboard-metric--emphasis' : 'dashboard-metric'}>
      <div className="dashboard-metric__label">{label}</div>
      <div className="dashboard-metric__value">{value}</div>
      <div className="dashboard-metric__detail">{detail}</div>
    </Card>
  );
}

function DistributionRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="dashboard-distribution__row">
      <div className="dashboard-distribution__header">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div
        className="dashboard-distribution__track"
        aria-label={`${label}: ${value} incidents, ${percentage}%`}
      >
        <div
          className={`dashboard-distribution__bar dashboard-distribution__bar--${tone}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token } = useAuth();

  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setIncidents([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const firstPage = await listIncidents(token, {
        page: 1,
        limit: 100,
      });

      if (firstPage.totalPages <= 1) {
        setIncidents(firstPage.items);
        setTotal(firstPage.total);
      } else {
        const remainingPages = Array.from(
          { length: firstPage.totalPages - 1 },
          (_, index) => index + 2,
        );

        const remainingResponses = await Promise.all(
          remainingPages.map((page) =>
            listIncidents(token, {
              page,
              limit: firstPage.limit,
            }),
          ),
        );

        const allIncidents = [
          ...firstPage.items,
          ...remainingResponses.flatMap((response) => response.items),
        ];

        setIncidents(allIncidents);
        setTotal(firstPage.total);
      }
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        setError(requestError.message);
      } else {
        setError('Unable to load the incident overview.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const active = incidents.filter(
      (incident) => incident.status === 'IDENTIFIED' || incident.status === 'INVESTIGATING',
    ).length;

    const critical = incidents.filter((incident) => incident.severity === 'CRITICAL').length;

    const high = incidents.filter((incident) => incident.severity === 'HIGH').length;

    const resolved = incidents.filter(
      (incident) => incident.status === 'RESOLVED' || incident.status === 'CLOSED',
    ).length;

    return {
      active,
      critical,
      high,
      resolved,
    };
  }, [incidents]);

  const severityCounts = useMemo(
    () =>
      Object.fromEntries(
        SEVERITIES.map((severity) => [
          severity,
          incidents.filter((incident) => incident.severity === severity).length,
        ]),
      ) as Record<IncidentSeverity, number>,
    [incidents],
  );

  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((status) => [
          status,
          incidents.filter((incident) => incident.status === status).length,
        ]),
      ) as Record<IncidentStatus, number>,
    [incidents],
  );

  const recentIncidents = useMemo(
    () =>
      [...incidents]
        .sort(
          (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )
        .slice(0, 6),
    [incidents],
  );

  if (loading) {
    return (
      <section className="dashboard-page" aria-labelledby="dashboard-title">
        <div className="page-header">
          <div>
            <p className="eyebrow">Operations</p>
            <h1 id="dashboard-title">Dashboard</h1>
            <p className="page-header__description">
              Operational overview of incidents currently accessible to you.
            </p>
          </div>
        </div>

        <Card className="dashboard-state" aria-live="polite">
          <div className="dashboard-state__spinner" aria-hidden="true" />
          <div>
            <strong>Loading operational data</strong>
            <p>Retrieving the latest accessible incidents from SentinelAI.</p>
          </div>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page" aria-labelledby="dashboard-title">
        <div className="page-header">
          <div>
            <p className="eyebrow">Operations</p>
            <h1 id="dashboard-title">Dashboard</h1>
            <p className="page-header__description">
              Operational overview of incidents currently accessible to you.
            </p>
          </div>
        </div>

        <Card className="dashboard-state dashboard-state--error" role="alert">
          <div className="dashboard-state__icon" aria-hidden="true">
            !
          </div>
          <div>
            <strong>Unable to load the dashboard</strong>
            <p>{error}</p>
            <Button type="button" variant="secondary" onClick={() => void loadDashboard()}>
              Retry
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="page-header dashboard-page__header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 id="dashboard-title">Dashboard</h1>
          <p className="page-header__description">
            Operational overview of incidents currently accessible to you.
          </p>
        </div>

        <div className="dashboard-page__actions">
          <Button type="button" variant="secondary" onClick={() => void loadDashboard()}>
            Refresh
          </Button>
          <Link className="button button--primary" to="/incidents">
            View incidents
          </Link>
        </div>
      </div>

      <div className="dashboard-metrics" aria-label="Incident metrics">
        <MetricCard label="Total incidents" value={total} detail="Accessible incident records" />
        <MetricCard
          label="Active incidents"
          value={metrics.active}
          detail="Identified or investigating"
          emphasis={metrics.active > 0}
        />
        <MetricCard
          label="Critical incidents"
          value={metrics.critical}
          detail={`${metrics.high} high severity`}
          emphasis={metrics.critical > 0}
        />
        <MetricCard
          label="Resolved / closed"
          value={metrics.resolved}
          detail="Completed lifecycle states"
        />
      </div>

      {total === 0 ? (
        <Card className="dashboard-state dashboard-state--empty">
          <div className="dashboard-state__icon" aria-hidden="true">
            ✓
          </div>
          <div>
            <strong>No incidents are currently available</strong>
            <p>There are no accessible incident records to display in the operational dashboard.</p>
            <Link className="button button--secondary" to="/incidents">
              Open incident management
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="dashboard-grid dashboard-grid--overview">
            <Card className="dashboard-panel">
              <div className="dashboard-panel__header">
                <div>
                  <p className="eyebrow">Severity</p>
                  <h2>Incident severity</h2>
                </div>
                <span className="dashboard-panel__count">{total}</span>
              </div>

              <div className="dashboard-distribution">
                {SEVERITIES.map((severity) => (
                  <DistributionRow
                    key={severity}
                    label={formatSeverity(severity)}
                    value={severityCounts[severity]}
                    total={total}
                    tone={severity.toLowerCase()}
                  />
                ))}
              </div>
            </Card>

            <Card className="dashboard-panel">
              <div className="dashboard-panel__header">
                <div>
                  <p className="eyebrow">Lifecycle</p>
                  <h2>Incident status</h2>
                </div>
                <span className="dashboard-panel__count">{total}</span>
              </div>

              <div className="dashboard-distribution">
                {STATUSES.map((status) => (
                  <DistributionRow
                    key={status}
                    label={formatStatus(status)}
                    value={statusCounts[status]}
                    total={total}
                    tone={status.toLowerCase()}
                  />
                ))}
              </div>
            </Card>
          </div>

          <Card className="dashboard-panel dashboard-panel--recent">
            <div className="dashboard-panel__header">
              <div>
                <p className="eyebrow">Attention</p>
                <h2>Recently updated incidents</h2>
              </div>
              <Link className="dashboard-panel__link" to="/incidents">
                View all
              </Link>
            </div>

            <div className="dashboard-incidents">
              {recentIncidents.map((incident) => (
                <Link className="dashboard-incident" key={incident.id} to="/incidents">
                  <div className="dashboard-incident__main">
                    <div className="dashboard-incident__badges">
                      <Badge variant={severityVariant(incident.severity)}>
                        {formatSeverity(incident.severity)}
                      </Badge>
                      <Badge variant={statusVariant(incident.status)}>
                        {formatStatus(incident.status)}
                      </Badge>
                    </div>

                    <h3>{incident.title}</h3>

                    <p>Updated {formatDate(incident.updatedAt)}</p>
                  </div>

                  <div className="dashboard-incident__meta">
                    <span>Priority</span>
                    <strong>{incident.priority}</strong>
                    <span className="dashboard-incident__arrow" aria-hidden="true">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
