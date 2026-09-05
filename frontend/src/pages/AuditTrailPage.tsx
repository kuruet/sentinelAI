import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ApiRequestError, getAuditLogs, getIncident } from '../lib/api';
import type { AuditLogResponse, IncidentResponse } from '../lib/api';
import { useAuth } from '../auth/AuthProvider';

type AuditFilter = 'ALL' | 'AI' | 'OPERATIONAL';

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getActionVariant(action: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (action.endsWith('_FAILED')) {
    return 'danger';
  }

  if (action.endsWith('_COMPLETED')) {
    return 'success';
  }

  if (action.endsWith('_REQUESTED')) {
    return 'info';
  }

  if (action.includes('DELETED') || action.includes('REMOVED')) {
    return 'warning';
  }

  return 'neutral';
}

function isAiAuditEntry(entry: AuditLogResponse): boolean {
  return entry.resourceType === 'AI_ANALYSIS' || entry.action.startsWith('AI_ANALYSIS_');
}

function formatMetadata(metadata: unknown): string {
  if (metadata === null || metadata === undefined) {
    return 'No additional metadata recorded.';
  }

  if (typeof metadata === 'string') {
    return metadata;
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return 'Metadata could not be rendered.';
  }
}

function getMetadataRecord(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  return metadata as Record<string, unknown>;
}

function AuditEntry({ entry }: { entry: AuditLogResponse }) {
  const aiEntry = isAiAuditEntry(entry);
  const metadata = getMetadataRecord(entry.metadata);

  const outcome = typeof metadata?.outcome === 'string' ? metadata.outcome : null;
  const provider = typeof metadata?.provider === 'string' ? metadata.provider : null;
  const model = typeof metadata?.model === 'string' ? metadata.model : null;
  const requestId = typeof metadata?.requestId === 'string' ? metadata.requestId : null;
  const correlationId = typeof metadata?.correlationId === 'string' ? metadata.correlationId : null;
  const groundedContextId =
    typeof metadata?.groundedContextId === 'string' ? metadata.groundedContextId : null;
  const latencyMs = typeof metadata?.latencyMs === 'number' ? metadata.latencyMs : null;
  const safetyDecision =
    typeof metadata?.safetyDecision === 'string' ? metadata.safetyDecision : null;
  const retryable = typeof metadata?.retryable === 'boolean' ? metadata.retryable : null;
  const errorCode = typeof metadata?.errorCode === 'string' ? metadata.errorCode : null;
  const statusCode = typeof metadata?.statusCode === 'number' ? metadata.statusCode : null;

  return (
    <article className="audit-page__entry">
      <div className="audit-page__entry-marker" aria-hidden="true" />

      <div className="audit-page__entry-content">
        <div className="audit-page__entry-header">
          <div>
            <div className="audit-page__entry-labels">
              <Badge variant={getActionVariant(entry.action)}>{entry.action}</Badge>
              {aiEntry ? <Badge variant="info">AI ACTIVITY</Badge> : null}
              {outcome ? <Badge variant={getActionVariant(entry.action)}>{outcome}</Badge> : null}
            </div>

            <h2>{entry.resourceType}</h2>
          </div>

          <time className="ui-mono ui-text-xs ui-muted" dateTime={entry.createdAt}>
            {formatDate(entry.createdAt)}
          </time>
        </div>

        <dl className="audit-page__metadata">
          <div>
            <dt>Actor</dt>
            <dd className="ui-mono">{entry.actorUserId}</dd>
          </div>
          <div>
            <dt>Resource ID</dt>
            <dd className="ui-mono">{entry.resourceId}</dd>
          </div>
          <div>
            <dt>Incident ID</dt>
            <dd className="ui-mono">{entry.incidentId ?? '—'}</dd>
          </div>
        </dl>

        {aiEntry ? (
          <section className="audit-page__ai-details">
            <div className="audit-page__section-heading">
              <div>
                <span className="audit-page__eyebrow">AI EXECUTION PROVENANCE</span>
                <h3>Operational AI metadata</h3>
              </div>
            </div>

            <dl className="audit-page__metadata audit-page__metadata--ai">
              <div>
                <dt>Provider</dt>
                <dd>{provider ?? '—'}</dd>
              </div>
              <div>
                <dt>Model</dt>
                <dd>{model ?? '—'}</dd>
              </div>
              <div>
                <dt>Request ID</dt>
                <dd className="ui-mono">{requestId ?? '—'}</dd>
              </div>
              <div>
                <dt>Correlation ID</dt>
                <dd className="ui-mono">{correlationId ?? '—'}</dd>
              </div>
              <div>
                <dt>Latency</dt>
                <dd>{latencyMs !== null ? `${latencyMs} ms` : '—'}</dd>
              </div>
              <div>
                <dt>Safety decision</dt>
                <dd>{safetyDecision ?? '—'}</dd>
              </div>
              <div>
                <dt>Retryable</dt>
                <dd>{retryable === null ? '—' : retryable ? 'YES' : 'NO'}</dd>
              </div>
              <div>
                <dt>Provider status</dt>
                <dd>{statusCode !== null ? statusCode : '—'}</dd>
              </div>
              <div>
                <dt>Error code</dt>
                <dd>{errorCode ?? '—'}</dd>
              </div>
              <div>
                <dt>Grounded context</dt>
                <dd className="ui-mono">{groundedContextId ?? '—'}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        <details className="audit-page__raw">
          <summary>View recorded metadata</summary>
          <pre>{formatMetadata(entry.metadata)}</pre>
        </details>
      </div>
    </article>
  );
}

export default function AuditTrailPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = id ?? '';
  const { token, status: authStatus } = useAuth();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [entries, setEntries] = useState<AuditLogResponse[]>([]);
  const [filter, setFilter] = useState<AuditFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditTrail = useCallback(async () => {
    if (!token || !incidentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [incidentResponse, auditResponse] = await Promise.all([
        getIncident(token, incidentId),
        getAuditLogs(token, incidentId),
      ]);

      setIncident(incidentResponse);
      setEntries(auditResponse.items);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        setError(requestError.message);
      } else {
        setError('Unable to load the incident audit trail.');
      }
    } finally {
      setLoading(false);
    }
  }, [incidentId, token]);

  useEffect(() => {
    void loadAuditTrail();
  }, [loadAuditTrail]);

  const filteredEntries = useMemo(() => {
    if (filter === 'AI') {
      return entries.filter(isAiAuditEntry);
    }

    if (filter === 'OPERATIONAL') {
      return entries.filter((entry) => !isAiAuditEntry(entry));
    }

    return entries;
  }, [entries, filter]);

  const aiCount = useMemo(() => entries.filter(isAiAuditEntry).length, [entries]);

  const operationalCount = entries.length - aiCount;

  if (authStatus === 'loading' || loading) {
    return (
      <div className="audit-page">
        <Card>
          <div className="audit-page__loading" role="status">
            <span className="auth-loading__indicator" aria-hidden="true" />
            <span>Loading audit trail…</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="audit-page">
        <Card>
          <h1>Authentication required</h1>
          <p className="ui-secondary">Sign in to view incident audit history.</p>
          <Link to="/login" className="ui-button ui-button--primary">
            Open sign in
          </Link>
        </Card>
      </div>
    );
  }

  if (!incidentId) {
    return (
      <div className="audit-page">
        <Card>
          <h1>Invalid incident</h1>
          <p className="ui-secondary">An incident identifier is required.</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audit-page">
        <Card>
          <div className="audit-page__error">
            <span className="audit-page__eyebrow">AUDIT TRAIL ERROR</span>
            <h1>Unable to load audit history</h1>
            <p className="ui-secondary">{error}</p>
            <div className="audit-page__actions">
              <Button variant="primary" onClick={() => void loadAuditTrail()}>
                Retry
              </Button>
              <Link
                to={`/incidents/${encodeURIComponent(incidentId)}`}
                className="ui-button ui-button--secondary"
              >
                Back to incident
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="audit-page">
      <header className="audit-page__header">
        <div>
          <span className="audit-page__eyebrow">INCIDENT AUDITABILITY</span>
          <h1>Audit Trail</h1>
          <p>
            A chronological operational record of incident activity and AI execution provenance.
            This view records what occurred; it does not expose hidden model reasoning.
          </p>
        </div>

        <div className="audit-page__header-meta">
          <Badge variant="info">READ ONLY</Badge>
          <Badge variant="neutral">{entries.length} EVENTS</Badge>
        </div>
      </header>

      <nav className="audit-page__workspace-nav" aria-label="Incident workspace">
        <Link to={`/incidents/${encodeURIComponent(incidentId)}`}>Incident</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>Timeline</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>Evidence</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>Investigation</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence`}>Intelligence</Link>
        <span className="audit-page__workspace-nav-active">Audit Trail</span>
      </nav>

      <Card>
        <div className="audit-page__incident">
          <div>
            <span className="audit-page__eyebrow">INCIDENT</span>
            <h2>{incident?.title ?? incidentId}</h2>
          </div>

          <dl className="audit-page__incident-meta">
            <div>
              <dt>ID</dt>
              <dd className="ui-mono">{incidentId}</dd>
            </div>
            <div>
              <dt>Audit records</dt>
              <dd>{entries.length}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <section className="audit-page__metrics" aria-label="Audit trail metrics">
        <Card className="audit-page__metric">
          <span className="audit-page__eyebrow">TOTAL</span>
          <strong>{entries.length}</strong>
          <span className="ui-secondary">Recorded events</span>
        </Card>
        <Card className="audit-page__metric">
          <span className="audit-page__eyebrow">AI</span>
          <strong>{aiCount}</strong>
          <span className="ui-secondary">AI execution records</span>
        </Card>
        <Card className="audit-page__metric">
          <span className="audit-page__eyebrow">OPERATIONAL</span>
          <strong>{operationalCount}</strong>
          <span className="ui-secondary">Incident activity records</span>
        </Card>
      </section>

      <Card>
        <div className="audit-page__section-heading">
          <div>
            <span className="audit-page__eyebrow">FILTER</span>
            <h2>Recorded activity</h2>
          </div>

          <div className="audit-page__filters" role="group" aria-label="Audit record filter">
            {(['ALL', 'AI', 'OPERATIONAL'] as AuditFilter[]).map((option) => (
              <button
                key={option}
                type="button"
                className={
                  filter === option
                    ? 'audit-page__filter audit-page__filter--active'
                    : 'audit-page__filter'
                }
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length > 0 ? (
          <div className="audit-page__entries">
            {filteredEntries.map((entry) => (
              <AuditEntry key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="audit-page__empty">
            <h3>No audit records in this view</h3>
            <p className="ui-secondary">
              {entries.length === 0
                ? 'No audit events have been recorded for this incident yet.'
                : 'Change the filter to view the available audit records.'}
            </p>
          </div>
        )}
      </Card>

      <footer className="audit-page__footer">
        <span className="ui-mono ui-text-xs ui-muted">
          INCIDENT-SCOPED · READ-ONLY · {entries.length} RECORDS
        </span>
        <span className="ui-muted">Ordered by recorded creation time</span>
      </footer>
    </div>
  );
}
