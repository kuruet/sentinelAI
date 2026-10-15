import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiRequestError,
  IncidentResponse,
  HistoricalIncidentIntelligenceResponse,
  downloadIncidentReport,
  getHistoricalIncidentIntelligence,
  getIncident,
  updateIncidentLifecycle,
} from '../lib/api';
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
  const [lifecycleUpdating, setLifecycleUpdating] = useState(false);
  const [lifecycleError, setLifecycleError] = useState('');
  const [reportDownloading, setReportDownloading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [historicalIntelligence, setHistoricalIntelligence] =
    useState<HistoricalIncidentIntelligenceResponse | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(true);
  const [historicalError, setHistoricalError] = useState('');

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

  useEffect(() => {
    let cancelled = false;

    async function loadHistoricalIntelligence() {
      if (!token || !id) {
        setHistoricalLoading(false);
        setHistoricalError('Unable to identify the current incident.');
        return;
      }

      setHistoricalLoading(true);
      setHistoricalError('');
      setHistoricalIntelligence(null);

      try {
        const result = await getHistoricalIncidentIntelligence(token, id, 5);

        if (!cancelled) {
          setHistoricalIntelligence(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          setHistoricalError(
            requestError instanceof ApiRequestError
              ? requestError.message
              : 'Unable to load historical incident matches.',
          );
        }
      } finally {
        if (!cancelled) {
          setHistoricalLoading(false);
        }
      }
    }

    void loadHistoricalIntelligence();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  async function handleLifecycleTransition(nextStatus: IncidentResponse['status']) {
    if (!token || !incident) {
      return;
    }

    setLifecycleUpdating(true);
    setLifecycleError('');

    try {
      const updated = await updateIncidentLifecycle(token, incident.id, nextStatus);

      setIncident(updated);
    } catch (requestError) {
      setLifecycleError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : 'Unable to update the incident lifecycle.',
      );
    } finally {
      setLifecycleUpdating(false);
    }
  }

  async function handleDownloadReport() {
    if (!token || !incident || reportDownloading) {
      return;
    }

    setReportDownloading(true);
    setReportError('');

    try {
      const pdf = await downloadIncidentReport(token, incident.id);
      const objectUrl = URL.createObjectURL(pdf);
      const anchor = document.createElement('a');

      anchor.href = objectUrl;
      anchor.download = `sentinelai-incident-${incident.id}-report.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (requestError) {
      setReportError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : 'Unable to download the incident report. Please try again.',
      );
    } finally {
      setReportDownloading(false);
    }
  }

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

          <Card className="incident-detail__historical">
            <div className="incident-detail__panel-header">
              <div>
                <p className="eyebrow">Historical intelligence</p>
                <h2>Similar Historical Incidents</h2>
              </div>
              {historicalIntelligence ? (
                <Badge>{historicalIntelligence.matches.length} matches</Badge>
              ) : null}
            </div>

            <p className="ui-muted">
              Compare previous incidents for investigative clues. Similarity does
              not establish the root cause of the current incident.
            </p>

            {historicalLoading ? (
              <p role="status">Searching accessible historical incidents…</p>
            ) : historicalError ? (
              <div role="alert">
                <p className="ui-error">{historicalError}</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setHistoricalError('');
                    setHistoricalLoading(true);
                    void getHistoricalIncidentIntelligence(token!, incident.id, 5)
                      .then(setHistoricalIntelligence)
                      .catch((error: unknown) => {
                        setHistoricalError(
                          error instanceof Error
                            ? error.message
                            : 'Unable to load historical matches.',
                        );
                      })
                      .finally(() => setHistoricalLoading(false));
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : !historicalIntelligence?.matches.length ? (
              <p>
                No similar incidents were found among the accessible historical
                records.
              </p>
            ) : (
              <>
                <p className="ui-muted">
                  Examined {historicalIntelligence.candidatesExamined} accessible
                  historical incident(s).
                </p>

                <div className="incident-detail__historical-list">
                  {historicalIntelligence.matches.map((match) => (
                    <article
                      className="incident-detail__historical-match"
                      key={match.incidentId}
                    >
                      <div className="incident-detail__historical-heading">
                        <h3>{match.title}</h3>
                        <strong>{match.similarityScore}/100</strong>
                      </div>

                      <div className="incident-detail__historical-badges">
                        <Badge variant={statusVariant(match.status)}>
                          {formatLabel(match.status)}
                        </Badge>
                        <Badge variant={severityVariant(match.severity)}>
                          {match.severity}
                        </Badge>
                      </div>

                      <p className="ui-muted">
                        Created {formatDate(match.createdAt)}
                      </p>

                      <h4>Why it matched</h4>
                      <ul>
                        {match.matchReasons.map((reason, index) => (
                          <li key={`${reason.signal}-${index}`}>
                            <strong>{formatLabel(reason.signal)}:</strong>{' '}
                            {reason.description}
                          </li>
                        ))}
                      </ul>

                      <Link
                        className="incident-detail__historical-link"
                        to={`/incidents/${encodeURIComponent(match.incidentId)}`}
                      >
                        Open historical incident
                      </Link>
                    </article>
                  ))}
                </div>

                <p className="ui-muted">
                  Similarity scores are heuristic rankings, not probabilities.
                  Historical incidents may still be under investigation, and
                  their findings must be independently verified.
                </p>
              </>
            )}
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

              <Link
                className="incident-detail__workspace-link"
                to={`/incidents/${encodeURIComponent(incident.id)}/audit`}
              >
                <strong>Audit Trail</strong>
                <span>Review incident activity and AI execution provenance.</span>
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

            <div className="incident-detail__lifecycle">
              <div>
                <p className="eyebrow">Incident lifecycle</p>
                <p className="ui-muted">Transitions are enforced by the backend.</p>
              </div>

              {lifecycleError ? (
                <p className="ui-error" role="alert">
                  {lifecycleError}
                </p>
              ) : null}

              <div className="button-row">
                {incident.status === 'IDENTIFIED' ? (
                  <Button
                    type="button"
                    disabled={lifecycleUpdating}
                    onClick={() => void handleLifecycleTransition('INVESTIGATING')}
                  >
                    {lifecycleUpdating ? 'Updating…' : 'Start investigation'}
                  </Button>
                ) : null}

                {incident.status === 'INVESTIGATING' ? (
                  <Button
                    type="button"
                    disabled={lifecycleUpdating}
                    onClick={() => void handleLifecycleTransition('RESOLVED')}
                  >
                    {lifecycleUpdating ? 'Updating…' : 'Mark resolved'}
                  </Button>
                ) : null}

                {incident.status === 'RESOLVED' ? (
                  <Button
                    type="button"
                    disabled={lifecycleUpdating}
                    onClick={() => void handleLifecycleTransition('CLOSED')}
                  >
                    {lifecycleUpdating ? 'Updating…' : 'Close incident'}
                  </Button>
                ) : null}

                {incident.status === 'CLOSED' ? (
                  <span className="ui-muted">Lifecycle complete.</span>
                ) : null}
              </div>
            </div>

            <div className="incident-detail__actions">
              <Button type="button" onClick={() => navigate('/incidents')}>
                All incidents
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={reportDownloading}
                onClick={() => void handleDownloadReport()}
              >
                {reportDownloading ? 'Generating PDF…' : 'Download PDF report'}
              </Button>

              <Button type="button" variant="secondary" onClick={() => navigate('/incidents/new')}>
                Create incident
              </Button>
            </div>

            {reportError ? (
              <p className="ui-error" role="alert">
                {reportError}
              </p>
            ) : null}
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
