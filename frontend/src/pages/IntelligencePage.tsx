import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import {
  ApiRequestError,
  getIncidentIntelligenceContext,
  type IntelligenceContextSnapshot,
} from '../lib/api';
import { useAuth } from '../auth/AuthProvider';

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function severityTone(severity: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  switch (severity) {
    case 'CRITICAL':
      return 'danger';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'info';
    case 'LOW':
      return 'success';
    default:
      return 'neutral';
  }
}

function statusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'CLOSED':
    case 'RESOLVED':
      return 'success';
    case 'INVESTIGATING':
      return 'warning';
    case 'IDENTIFIED':
      return 'info';
    default:
      return 'neutral';
  }
}

function IntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = id ?? '';
  const { token } = useAuth();

  const [snapshot, setSnapshot] = useState<IntelligenceContextSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    if (!token || !incidentId) {
      setError('An authenticated incident context is required.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getIncidentIntelligenceContext(token, incidentId);
      setSnapshot(result);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 401) {
          setError('Your session is no longer valid. Please sign in again.');
        } else if (requestError.status === 403) {
          setError('You do not have permission to view intelligence for this incident.');
        } else if (requestError.status === 404) {
          setError('The requested incident could not be found.');
        } else {
          setError(requestError.message);
        }
      } else {
        setError('Unable to load incident intelligence.');
      }
    } finally {
      setLoading(false);
    }
  }, [incidentId, token]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const latestEvent = useMemo(
    () => snapshot?.context.events[snapshot.context.events.length - 1] ?? null,
    [snapshot],
  );

  if (!incidentId) {
    return (
      <div className="intelligence-page">
        <Card elevated>
          <span className="ui-mono ui-text-xs ui-muted">INTELLIGENCE</span>
          <h1 className="ui-heading-2">Incident context required</h1>
          <p className="ui-secondary">
            Open Intelligence from a specific incident workspace to review grounded context.
          </p>
          <Link className="ui-button ui-button--secondary" to="/incidents">
            Back to incidents
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="intelligence-page" aria-busy="true">
        <div className="intelligence-page__header">
          <span className="page-frame__eyebrow">INTELLIGENCE</span>
          <h1 className="ui-heading-1">Intelligence Overview</h1>
          <p>Loading grounded incident context…</p>
        </div>

        <Card elevated className="intelligence-page__loading">
          <div className="auth-loading__indicator" aria-hidden="true" />
          <span className="ui-secondary">Preparing incident intelligence context.</span>
        </Card>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="intelligence-page">
        <Card elevated className="intelligence-page__error" role="alert">
          <span className="ui-mono ui-text-xs ui-muted">INTELLIGENCE ERROR</span>
          <h1 className="ui-heading-2">Unable to load intelligence</h1>
          <p className="ui-secondary">{error ?? 'No intelligence context is available.'}</p>
          <div className="intelligence-page__actions">
            <button
              className="ui-button ui-button--primary"
              type="button"
              onClick={() => void loadContext()}
            >
              Retry
            </button>
            <Link
              className="ui-button ui-button--secondary"
              to={`/incidents/${encodeURIComponent(incidentId)}`}
            >
              Incident overview
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { incident, evidence, investigation } = snapshot.context;
  const { metadata } = snapshot;

  return (
    <div className="intelligence-page">
      <header className="intelligence-page__header">
        <div>
          <span className="page-frame__eyebrow">INCIDENT INTELLIGENCE</span>
          <h1 className="ui-heading-1">Intelligence Overview</h1>
          <p>Review the bounded, grounded context currently available for this incident.</p>
        </div>

        <div className="intelligence-page__header-status">
          <Badge variant={severityTone(incident.severity)}>{incident.severity}</Badge>
          <Badge variant={statusTone(incident.status)}>{incident.status}</Badge>
        </div>
      </header>

      <nav className="intelligence-page__workspace" aria-label="Incident workspace">
        <Link to={`/incidents/${encodeURIComponent(incidentId)}`}>Overview</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>Timeline</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>Evidence</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>Investigation</Link>
        <span aria-current="page">Intelligence</span>
      </nav>

      <Card elevated className="intelligence-page__incident">
        <div className="intelligence-page__incident-heading">
          <div>
            <span className="ui-mono ui-text-xs ui-muted">INCIDENT</span>
            <h2 className="ui-heading-2">{incident.title}</h2>
          </div>
          <span className="ui-mono ui-text-xs ui-muted">Priority {incident.priority}</span>
        </div>

        {incident.description ? (
          <p className="ui-secondary">{incident.description}</p>
        ) : (
          <p className="ui-muted">No incident description has been recorded.</p>
        )}

        <dl className="intelligence-page__metadata">
          <div>
            <dt>Started</dt>
            <dd>{formatDate(incident.startedAt)}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(incident.createdAt)}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(incident.updatedAt)}</dd>
          </div>
          <div>
            <dt>Context generated</dt>
            <dd>{formatDate(metadata.generatedAt)}</dd>
          </div>
        </dl>
      </Card>

      <section className="intelligence-page__metrics" aria-label="Grounded context metrics">
        <Card className="intelligence-page__metric">
          <span className="ui-mono ui-text-xs ui-muted">EVENTS</span>
          <strong>{metadata.eventCount}</strong>
          <span className="ui-secondary">Ordered incident events</span>
        </Card>

        <Card className="intelligence-page__metric">
          <span className="ui-mono ui-text-xs ui-muted">EVIDENCE</span>
          <strong>{metadata.evidenceCount}</strong>
          <span className="ui-secondary">Available evidence records</span>
        </Card>

        <Card className="intelligence-page__metric">
          <span className="ui-mono ui-text-xs ui-muted">INVESTIGATION</span>
          <strong>{metadata.hasInvestigation ? 'READY' : 'NOT STARTED'}</strong>
          <span className="ui-secondary">Current investigation context</span>
        </Card>

        <Card className="intelligence-page__metric">
          <span className="ui-mono ui-text-xs ui-muted">GROUNDING</span>
          <strong>BOUNDED</strong>
          <span className="ui-secondary">Source context only</span>
        </Card>
      </section>

      <section className="intelligence-page__grid">
        <Card elevated>
          <div className="intelligence-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">SIGNAL CONTEXT</span>
              <h2 className="ui-heading-3">Timeline signal</h2>
            </div>
            <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>Open timeline</Link>
          </div>

          {latestEvent ? (
            <div className="intelligence-page__signal">
              <div className="intelligence-page__signal-marker" aria-hidden="true" />
              <div>
                <strong>{latestEvent.title}</strong>
                <p className="ui-secondary">
                  {latestEvent.eventType} · sequence {latestEvent.sequence}
                </p>
                <p className="ui-muted">{formatDate(latestEvent.occurredAt)}</p>
              </div>
            </div>
          ) : (
            <div className="intelligence-page__empty">
              <strong>No events available</strong>
              <p className="ui-secondary">
                Deterministic signal analysis has no timeline events to consume yet.
              </p>
              <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>
                Add or review timeline events
              </Link>
            </div>
          )}
        </Card>

        <Card elevated>
          <div className="intelligence-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">EVIDENCE CONTEXT</span>
              <h2 className="ui-heading-3">Evidence coverage</h2>
            </div>
            <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>Open evidence</Link>
          </div>

          {evidence.length > 0 ? (
            <div className="intelligence-page__list">
              {evidence.slice(0, 5).map((item) => (
                <div className="intelligence-page__list-item" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span className="ui-secondary">
                      {item.evidenceType} · {item.source}
                    </span>
                  </div>
                  <span className="ui-mono ui-text-xs ui-muted">
                    {formatDate(item.occurredAt ?? item.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="intelligence-page__empty">
              <strong>No evidence available</strong>
              <p className="ui-secondary">
                No evidence records are currently included in the grounded incident context.
              </p>
              <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>
                Review evidence workspace
              </Link>
            </div>
          )}
        </Card>

        <Card elevated>
          <div className="intelligence-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">INVESTIGATION CONTEXT</span>
              <h2 className="ui-heading-3">Investigation state</h2>
            </div>
            <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>
              Open investigation
            </Link>
          </div>

          {investigation ? (
            <div className="intelligence-page__investigation">
              <Badge variant={investigation.completedAt ? 'success' : 'warning'}>
                {investigation.completedAt ? 'COMPLETED' : 'IN PROGRESS'}
              </Badge>
              <p className="ui-secondary">
                {investigation.summary ?? 'No investigation summary has been recorded.'}
              </p>
              <dl className="intelligence-page__compact-metadata">
                <div>
                  <dt>Started</dt>
                  <dd>{formatDate(investigation.startedAt)}</dd>
                </div>
                <div>
                  <dt>Completed</dt>
                  <dd>{formatDate(investigation.completedAt)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="intelligence-page__empty">
              <strong>Investigation not started</strong>
              <p className="ui-secondary">
                No investigation record is currently available to the intelligence context.
              </p>
              <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>
                Start investigation
              </Link>
            </div>
          )}
        </Card>

        <Card elevated>
          <div className="intelligence-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">AI READINESS</span>
              <h2 className="ui-heading-3">Grounded analysis</h2>
            </div>
          </div>

          <div className="intelligence-page__readiness">
            <div className="intelligence-page__readiness-status">
              <span className="intelligence-page__readiness-dot" aria-hidden="true" />
              <strong>Context available</strong>
            </div>

            <p className="ui-secondary">
              The intelligence layer has access to the incident, ordered events, evidence, and
              investigation record returned by the backend context service.
            </p>

            <ul>
              <li>Source data remains authoritative.</li>
              <li>Context is incident-scoped and access-controlled.</li>
              <li>
                AI analysis is not presented as completed until a dedicated analysis operation
                returns a result.
              </li>
            </ul>
            <Link
              to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/assistant`}
              className="ui-button ui-button--secondary"
            >
              Open investigation assistant
            </Link>
          </div>
        </Card>
      </section>

      <footer className="intelligence-page__footer">
        <span className="ui-mono ui-text-xs ui-muted">
          GROUNDED CONTEXT · {metadata.eventCount} EVENTS · {metadata.evidenceCount} EVIDENCE
        </span>
        <span className="ui-muted">Generated {formatDate(metadata.generatedAt)}</span>
      </footer>
    </div>
  );
}

export default IntelligencePage;
