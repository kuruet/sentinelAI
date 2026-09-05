import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { ApiRequestError, IncidentResponse, getIncident } from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function severityVariant(severity: IncidentResponse['severity']) {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return 'danger' as const;
    case 'MEDIUM':
      return 'warning' as const;
    default:
      return 'info' as const;
  }
}

function statusVariant(status: IncidentResponse['status']) {
  switch (status) {
    case 'RESOLVED':
    case 'CLOSED':
      return 'success' as const;
    case 'INVESTIGATING':
      return 'warning' as const;
    default:
      return 'info' as const;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="incident-detail__field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadIncident() {
      if (!token || !id) {
        setLoading(false);
        setError('The incident could not be identified.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await getIncident(token, id);

        if (!cancelled) {
          setIncident(result);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        if (requestError instanceof ApiRequestError) {
          if (requestError.status === 404) {
            setError('Incident not found.');
          } else if (requestError.status === 401 || requestError.status === 403) {
            setError('You are not authorized to view this incident.');
          } else {
            setError(requestError.message);
          }
        } else {
          setError('Unable to load the incident. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadIncident();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  if (loading) {
    return (
      <div className="incident-detail__state" role="status">
        <div className="incident-detail__spinner" aria-hidden="true" />
        <div>
          <strong>Loading incident</strong>
          <p>Retrieving the incident record from SentinelAI.</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="incident-detail__state incident-detail__state--error" role="alert">
        <div className="incident-detail__state-icon" aria-hidden="true">
          !
        </div>
        <div>
          <strong>{error || 'Incident unavailable.'}</strong>
          <p>The incident workspace could not be loaded.</p>
          <div className="button-row">
            <Button type="button" onClick={() => navigate('/incidents')}>
              Back to incidents
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="incident-detail">
      <nav className="incident-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/incidents">Incidents</Link>
        <span aria-hidden="true">/</span>
        <span>{incident.id}</span>
      </nav>

      <section className="incident-detail__header">
        <div className="incident-detail__heading">
          <p className="eyebrow">Incident workspace</p>
          <h1>{incident.title}</h1>
          <p className="incident-detail__id">{incident.id}</p>
        </div>

        <div className="incident-detail__badges">
          <Badge variant={severityVariant(incident.severity)}>{incident.severity}</Badge>
          <Badge variant={statusVariant(incident.status)}>{formatLabel(incident.status)}</Badge>
        </div>
      </section>

      <div className="incident-detail__grid">
        <main className="incident-detail__main">
          <Card>
            <div className="incident-detail__panel-header">
              <div>
                <p className="eyebrow">Incident record</p>
                <h2>Overview</h2>
              </div>
              <span className="incident-detail__priority">Priority {incident.priority}</span>
            </div>

            <div className="incident-detail__description">
              <h3>Description</h3>
              <p>{incident.description || 'No description has been recorded.'}</p>
            </div>

            <dl className="incident-detail__fields">
              <DetailField label="Severity" value={incident.severity} />
              <DetailField label="Status" value={formatLabel(incident.status)} />
              <DetailField label="Priority" value={String(incident.priority)} />
              <DetailField label="Started" value={formatDate(incident.startedAt)} />
              <DetailField label="Resolved" value={formatDate(incident.resolvedAt)} />
              <DetailField label="Closed" value={formatDate(incident.closedAt)} />
              <DetailField label="Created" value={formatDate(incident.createdAt)} />
              <DetailField label="Last updated" value={formatDate(incident.updatedAt)} />
            </dl>
          </Card>

          <Card>
            <div className="incident-detail__panel-header">
              <div>
                <p className="eyebrow">Operational workflow</p>
                <h2>Workspace areas</h2>
              </div>
            </div>

            <div className="incident-detail__workspace-links">
              <Link
                className="incident-detail__workspace-link"
                to={`/incidents/${encodeURIComponent(incident.id)}/timeline`}
              >
                <strong>Timeline</strong>
                <span>Review the chronological incident event stream.</span>
              </Link>

              <Link
                className="incident-detail__workspace-link"
                to={`/incidents/${encodeURIComponent(incident.id)}/evidence`}
              >
                <strong>Evidence</strong>
                <span>Review evidence associated with this incident.</span>
              </Link>

              <Link
                className="incident-detail__workspace-link"
                to={`/incidents/${encodeURIComponent(incident.id)}/investigation`}
              >
                <strong>Investigation</strong>
                <span>Work through the structured investigation record.</span>
              </Link>

              <Link
                className="incident-detail__workspace-link"
                to={`/incidents/${encodeURIComponent(incident.id)}/intelligence`}
              >
                <strong>Intelligence</strong>
                <span>Access grounded intelligence for this incident.</span>
              </Link>
            </div>
          </Card>
        </main>

        <aside className="incident-detail__sidebar">
          <Card>
            <div className="incident-detail__panel-header">
              <div>
                <p className="eyebrow">Incident navigation</p>
                <h2>Actions</h2>
              </div>
            </div>

            <div className="incident-detail__actions">
              <Button type="button" onClick={() => navigate('/incidents')}>
                All incidents
              </Button>

              <Button type="button" variant="secondary" onClick={() => navigate('/incidents/new')}>
                Create incident
              </Button>
            </div>
          </Card>

          <Card>
            <div className="incident-detail__panel-header">
              <div>
                <p className="eyebrow">Record identity</p>
                <h2>Reference</h2>
              </div>
            </div>

            <div className="incident-detail__reference">
              <span>Incident ID</span>
              <code>{incident.id}</code>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
