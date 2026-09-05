import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  type IncidentResponse,
  type IncidentSeverity,
  type IncidentStatus,
  listIncidents,
} from '../lib/api';

const SEVERITIES: Array<'ALL' | IncidentSeverity> = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const STATUSES: Array<'ALL' | IncidentStatus> = [
  'ALL',
  'IDENTIFIED',
  'INVESTIGATING',
  'RESOLVED',
  'CLOSED',
];

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
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    return 'danger';
  }

  if (severity === 'MEDIUM') {
    return 'warning';
  }

  return 'info';
}

function statusVariant(status: IncidentStatus): 'info' | 'warning' | 'success' {
  if (status === 'IDENTIFIED') {
    return 'info';
  }

  if (status === 'INVESTIGATING') {
    return 'warning';
  }

  return 'success';
}

function IncidentRow({ incident }: { incident: IncidentResponse }) {
  return (
    <Link
      className="incident-list__row"
      to={'/incidents/' + encodeURIComponent(incident.id)}
      aria-label={'Open incident ' + incident.title}
    >
      <div className="incident-list__primary">
        <span className="incident-list__title">{incident.title}</span>
        <span className="incident-list__id">{incident.id}</span>
      </div>

      <div className="incident-list__cell">
        <Badge variant={severityVariant(incident.severity)}>{incident.severity}</Badge>
      </div>

      <div className="incident-list__cell">
        <Badge variant={statusVariant(incident.status)}>{incident.status}</Badge>
      </div>

      <div className="incident-list__priority">P{incident.priority}</div>

      <div className="incident-list__updated">{formatDate(incident.updatedAt)}</div>
    </Link>
  );
}

function IncidentsPage() {
  const { token } = useAuth();

  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [severity, setSeverity] = useState<'ALL' | IncidentSeverity>('ALL');
  const [status, setStatus] = useState<'ALL' | IncidentStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await listIncidents(token, {
        page,
        limit: 20,
        severity: severity === 'ALL' ? undefined : severity,
        status: status === 'ALL' ? undefined : status,
      });

      setIncidents(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to load incidents.';

      setError(message);
      setIncidents([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, severity, status, token]);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const pageLabel = useMemo(() => {
    if (total === 0) {
      return 'No incidents';
    }

    const first = (page - 1) * 20 + 1;
    const last = Math.min(page * 20, total);

    return 'Showing ' + first + '–' + last + ' of ' + total;
  }, [page, total]);

  function handleSeverityChange(value: string) {
    setSeverity(value as 'ALL' | IncidentSeverity);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value as 'ALL' | IncidentStatus);
    setPage(1);
  }

  return (
    <main className="page incidents-page">
      <header className="incidents-page__header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Incidents</h1>
          <p className="incidents-page__subtitle">
            Monitor and triage incidents accessible to your operator account.
          </p>
        </div>

        <div className="incidents-page__actions">
          <Link to="/">
            <Button variant="secondary" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <Card className="incidents-page__filters">
        <div className="incidents-page__filter-group">
          <label htmlFor="incident-severity">Severity</label>
          <select
            id="incident-severity"
            value={severity}
            onChange={(event) => handleSeverityChange(event.target.value)}
          >
            {SEVERITIES.map((value) => (
              <option key={value} value={value}>
                {value === 'ALL' ? 'All severities' : value}
              </option>
            ))}
          </select>
        </div>

        <div className="incidents-page__filter-group">
          <label htmlFor="incident-status">Status</label>
          <select
            id="incident-status"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value === 'ALL' ? 'All statuses' : value}
              </option>
            ))}
          </select>
        </div>

        <div className="incidents-page__filter-summary">
          <span>{pageLabel}</span>
          {(severity !== 'ALL' || status !== 'ALL') && (
            <button
              type="button"
              className="incidents-page__clear"
              onClick={() => {
                setSeverity('ALL');
                setStatus('ALL');
                setPage(1);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <Card className="incidents-page__table-card">
        <div className="incident-list">
          <div className="incident-list__header" aria-hidden="true">
            <span>Incident</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Last updated</span>
          </div>

          {loading && (
            <div className="incident-list__state">
              <strong>Loading incidents</strong>
              <span>Retrieving the latest accessible incident records…</span>
            </div>
          )}

          {!loading && error && (
            <div className="incident-list__state incident-list__state--error">
              <strong>Unable to load incidents</strong>
              <span>{error}</span>
              <Button variant="secondary" size="sm" onClick={() => void loadIncidents()}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && incidents.length === 0 && (
            <div className="incident-list__state">
              <strong>No incidents found</strong>
              <span>No accessible incidents match the selected filters.</span>
            </div>
          )}

          {!loading &&
            !error &&
            incidents.map((incident) => <IncidentRow key={incident.id} incident={incident} />)}
        </div>
      </Card>

      {!loading && !error && totalPages > 1 && (
        <nav className="incidents-page__pagination" aria-label="Incident pages">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>

          <span>
            Page {page} of {totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </Button>
        </nav>
      )}
    </main>
  );
}

export default IncidentsPage;
