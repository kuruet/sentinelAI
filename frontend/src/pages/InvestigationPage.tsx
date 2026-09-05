import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  ApiRequestError,
  createIncidentInvestigation,
  deleteIncidentInvestigation,
  getIncident,
  getIncidentInvestigation,
  updateIncidentInvestigation,
  type IncidentResponse,
  type InvestigationResponse,
} from '../lib/api';

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function toApiDateTime(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to complete the investigation request.';
}

function getInvestigationState(investigation: InvestigationResponse | null): {
  label: string;
  variant: 'neutral' | 'info' | 'success';
} {
  if (!investigation) {
    return {
      label: 'Not started',
      variant: 'neutral',
    };
  }

  if (investigation.completedAt) {
    return {
      label: 'Completed',
      variant: 'success',
    };
  }

  if (investigation.startedAt) {
    return {
      label: 'In progress',
      variant: 'info',
    };
  }

  return {
    label: 'Created',
    variant: 'neutral',
  };
}

interface InvestigationEditorProps {
  incidentId: string;
  token: string;
  investigation: InvestigationResponse | null;
  onSaved: (investigation: InvestigationResponse) => void;
  onCreated: (investigation: InvestigationResponse) => void;
}

function InvestigationEditor({
  incidentId,
  token,
  investigation,
  onSaved,
  onCreated,
}: InvestigationEditorProps) {
  const [summary, setSummary] = useState(investigation?.summary ?? '');
  const [startedAt, setStartedAt] = useState(
    toDateTimeLocalValue(investigation?.startedAt ?? null),
  );
  const [completedAt, setCompletedAt] = useState(
    toDateTimeLocalValue(investigation?.completedAt ?? null),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSummary(investigation?.summary ?? '');
    setStartedAt(toDateTimeLocalValue(investigation?.startedAt ?? null));
    setCompletedAt(toDateTimeLocalValue(investigation?.completedAt ?? null));
    setError('');
  }, [investigation]);

  const isUpdate = investigation !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (summary.length > 10_000) {
      setError('Summary must be at most 10,000 characters.');
      return;
    }

    const startedAtValue = toApiDateTime(startedAt);
    const completedAtValue = toApiDateTime(completedAt);

    if (startedAt && !startedAtValue) {
      setError('Start time is invalid.');
      return;
    }

    if (completedAt && !completedAtValue) {
      setError('Completion time is invalid.');
      return;
    }

    setSaving(true);

    try {
      if (isUpdate) {
        const updated = await updateIncidentInvestigation(token, incidentId, {
          summary,
          startedAt: startedAtValue,
          completedAt: completedAtValue,
        });

        onSaved(updated);
      } else {
        const created = await createIncidentInvestigation(token, incidentId, {
          summary,
          startedAt: startedAtValue,
          completedAt: completedAtValue,
        });

        onCreated(created);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="investigation-page__editor" onSubmit={handleSubmit}>
      <div className="investigation-page__section-header">
        <div>
          <p className="eyebrow">Investigation record</p>
          <h2>{isUpdate ? 'Investigation details' : 'Start an investigation'}</h2>
        </div>
        <span className="investigation-page__counter">
          {summary.length.toLocaleString()} / 10,000
        </span>
      </div>

      <label className="form-field">
        <span>Investigation summary</span>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          maxLength={10_000}
          rows={9}
          placeholder="Record the current investigative context, observations, and working conclusions."
        />
      </label>

      <div className="investigation-page__time-grid">
        <label className="form-field">
          <span>Started at</span>
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
          />
          <small>Stored as an offset-aware ISO timestamp.</small>
        </label>

        <label className="form-field">
          <span>Completed at</span>
          <input
            type="datetime-local"
            value={completedAt}
            onChange={(event) => setCompletedAt(event.target.value)}
          />
          <small>Leave empty while the investigation remains active.</small>
        </label>
      </div>

      {error ? (
        <div className="page-alert page-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="investigation-page__editor-actions">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isUpdate ? 'Save investigation' : 'Create investigation'}
        </Button>
      </div>
    </form>
  );
}

function InvestigationPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = id ?? '';
  const { token, status } = useAuth();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [investigationMissing, setInvestigationMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const state = useMemo(() => getInvestigationState(investigation), [investigation]);

  useEffect(() => {
    if (!id || !token) {
      return;
    }

    let cancelled = false;

    async function loadWorkspace() {
      setLoading(true);
      setError('');

      try {
        const incidentResult = await getIncident(token!, incidentId);

        let investigationResult: InvestigationResponse | null = null;

        try {
          investigationResult = await getIncidentInvestigation(token!, incidentId);
        } catch (investigationError) {
          if (investigationError instanceof ApiRequestError && investigationError.status === 404) {
            investigationResult = null;
          } else {
            throw investigationError;
          }
        }

        if (cancelled) {
          return;
        }

        setIncident(incidentResult);
        setInvestigation(investigationResult);
        setInvestigationMissing(investigationResult === null);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setError(getErrorMessage(requestError));
        setIncident(null);
        setInvestigation(null);
        setInvestigationMissing(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  if (status === 'loading' || loading) {
    return (
      <div className="page-state" role="status">
        Loading investigation workspace…
      </div>
    );
  }

  if (!token) {
    return (
      <div className="page-state page-state--error" role="alert">
        Authentication is required to view this investigation.
      </div>
    );
  }

  if (!id) {
    return (
      <div className="page-state page-state--error" role="alert">
        No incident was specified.
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-state page-state--error" role="alert">
        <strong>Unable to load investigation.</strong>
        <span>{error}</span>
        <Link className="ui-button ui-button--secondary ui-button--md" to="/incidents">
          Back to incidents
        </Link>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="page-state page-state--error" role="alert">
        Incident not found.
      </div>
    );
  }

  async function handleDelete() {
    if (!investigation) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this investigation record? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteIncidentInvestigation(token!, incidentId);
      setInvestigation(null);
      setInvestigationMissing(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-stack investigation-page">
      <header className="page-header investigation-page__header">
        <div>
          <p className="eyebrow">INVESTIGATION WORKSPACE</p>
          <h1>{incident.title}</h1>
          <p>
            Work through the structured investigation record for incident <code>{incident.id}</code>
            .
          </p>
        </div>

        <div className="investigation-page__header-meta">
          <Badge>{incident.severity}</Badge>
          <Badge>{incident.status}</Badge>
          <Badge variant={state.variant}>{state.label}</Badge>
        </div>
      </header>

      <nav className="investigation-page__workspace-nav" aria-label="Incident workspace">
        <Link to={`/incidents/${encodeURIComponent(id)}`}>Overview</Link>
        <Link to={`/incidents/${encodeURIComponent(id)}/timeline`}>Timeline</Link>
        <Link to={`/incidents/${encodeURIComponent(id)}/evidence`}>Evidence</Link>
        <Link
          className="investigation-page__workspace-nav-active"
          to={`/incidents/${encodeURIComponent(id)}/investigation`}
        >
          Investigation
        </Link>
        <Link to={`/incidents/${encodeURIComponent(id)}/intelligence`}>Intelligence</Link>
      </nav>

      <div className="investigation-page__layout">
        <main className="investigation-page__main">
          <Card elevated>
            {investigationMissing ? (
              <div className="investigation-page__empty">
                <p className="eyebrow">No investigation record</p>
                <h2>This incident has not been formally investigated yet.</h2>
                <p>
                  Create the structured investigation record to capture the investigative summary
                  and lifecycle timestamps.
                </p>
              </div>
            ) : null}

            <InvestigationEditor
              incidentId={incidentId}
              token={token}
              investigation={investigation}
              onSaved={setInvestigation}
              onCreated={(created) => {
                setInvestigation(created);
                setInvestigationMissing(false);
              }}
            />
          </Card>

          {investigation ? (
            <Card>
              <div className="investigation-page__section-header">
                <div>
                  <p className="eyebrow">Record metadata</p>
                  <h2>Audit context</h2>
                </div>
              </div>

              <dl className="investigation-page__metadata">
                <div>
                  <dt>Investigation ID</dt>
                  <dd>
                    <code>{investigation.id}</code>
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(investigation.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDate(investigation.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Started</dt>
                  <dd>{formatDate(investigation.startedAt)}</dd>
                </div>
                <div>
                  <dt>Completed</dt>
                  <dd>{formatDate(investigation.completedAt)}</dd>
                </div>
              </dl>

              <div className="investigation-page__danger-zone">
                <div>
                  <p className="eyebrow">Administrative action</p>
                  <strong>Remove investigation record</strong>
                  <span>
                    Deletion requires manager authorization and is enforced by the backend.
                  </span>
                </div>

                <Button
                  type="button"
                  variant="danger"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                >
                  {deleting ? 'Deleting…' : 'Delete investigation'}
                </Button>
              </div>
            </Card>
          ) : null}
        </main>

        <aside className="investigation-page__sidebar">
          <Card>
            <p className="eyebrow">Incident context</p>
            <h2>{incident.title}</h2>
            <dl className="investigation-page__context">
              <div>
                <dt>Severity</dt>
                <dd>{incident.severity}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{incident.status}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{incident.priority}</dd>
              </div>
              <div>
                <dt>Incident started</dt>
                <dd>{formatDate(incident.startedAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <p className="eyebrow">Investigation workflow</p>
            <h2>Continue analysis</h2>
            <div className="investigation-page__links">
              <Link to={`/incidents/${encodeURIComponent(id)}/timeline`}>
                Review incident timeline
              </Link>
              <Link to={`/incidents/${encodeURIComponent(id)}/evidence`}>
                Review collected evidence
              </Link>
              <Link to={`/incidents/${encodeURIComponent(id)}/intelligence`}>
                Open grounded intelligence
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default InvestigationPage;
