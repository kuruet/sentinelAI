import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiRequestError,
  EVIDENCE_TYPES,
  createIncidentEvidence,
  deleteIncidentEvidence,
  getIncident,
  listIncidentEvidence,
  type EvidenceResponse,
  type EvidenceType,
  type IncidentResponse,
} from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

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

function humanizeType(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return 'Your session is no longer valid. Please sign in again.';
    }

    if (error.status === 403) {
      return 'You are not authorized to perform this evidence operation.';
    }

    if (error.status === 404) {
      return 'The incident or evidence could not be found.';
    }

    if (error.status === 0) {
      return 'The SentinelAI API could not be reached. Check that the backend is running.';
    }

    return error.message;
  }

  return error instanceof Error ? error.message : 'The evidence request failed.';
}

function toApiDateTime(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

interface CreateEvidenceFormProps {
  token: string;
  incidentId: string;
  onCreated: (evidence: EvidenceResponse) => void;
}

function CreateEvidenceForm({ token, incidentId, onCreated }: CreateEvidenceFormProps) {
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('LOG');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [sourceRef, setSourceRef] = useState('');
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [collectedAt, setCollectedAt] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [trustLevel, setTrustLevel] = useState('');
  const [metadata, setMetadata] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!title.trim()) {
      return 'Evidence title is required.';
    }

    if (title.trim().length > 200) {
      return 'Evidence title must be at most 200 characters.';
    }

    if (!source.trim()) {
      return 'Evidence source is required.';
    }

    if (source.trim().length > 500) {
      return 'Evidence source must be at most 500 characters.';
    }

    if (description.trim().length > 5000) {
      return 'Evidence description must be at most 5000 characters.';
    }

    if (sourceRef.trim().length > 1000) {
      return 'Source reference must be at most 1000 characters.';
    }

    if (contentHash.trim().length > 500) {
      return 'Content hash must be at most 500 characters.';
    }

    if (trustLevel.trim().length > 100) {
      return 'Trust level must be at most 100 characters.';
    }

    if (occurredAt && !toApiDateTime(occurredAt)) {
      return 'Occurred at must be a valid date and time.';
    }

    if (collectedAt && !toApiDateTime(collectedAt)) {
      return 'Collected at must be a valid date and time.';
    }

    if (metadata.trim()) {
      try {
        const parsed: unknown = JSON.parse(metadata);

        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return 'Metadata must be a JSON object.';
        }
      } catch {
        return 'Metadata must contain valid JSON.';
      }
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const created = await createIncidentEvidence(token, incidentId, {
        evidenceType,
        title: title.trim(),
        description: description.trim() || null,
        source: source.trim(),
        sourceRef: sourceRef.trim() || null,
        collectedAt: toApiDateTime(collectedAt),
        occurredAt: toApiDateTime(occurredAt),
        contentHash: contentHash.trim() || null,
        trustLevel: trustLevel.trim() || null,
        metadata: metadata.trim() ? JSON.parse(metadata) : null,
      });

      setTitle('');
      setSource('');
      setSourceRef('');
      setDescription('');
      setOccurredAt('');
      setCollectedAt('');
      setContentHash('');
      setTrustLevel('');
      setMetadata('');
      onCreated(created);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="evidence-panel-header">
        <div>
          <span className="page-eyebrow">Evidence intake</span>
          <h2>Add evidence</h2>
          <p>Record a traceable evidence item against this incident.</p>
        </div>
      </div>

      <form className="evidence-form" onSubmit={handleSubmit}>
        <div className="evidence-form-grid">
          <label>
            <span>Evidence type</span>
            <select
              value={evidenceType}
              onChange={(event) => setEvidenceType(event.target.value as EvidenceType)}
            >
              {EVIDENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanizeType(type)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              placeholder="Evidence title"
              required
            />
          </label>

          <label>
            <span>Source</span>
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              maxLength={500}
              placeholder="Evidence source"
              required
            />
          </label>

          <label>
            <span>Source reference</span>
            <input
              value={sourceRef}
              onChange={(event) => setSourceRef(event.target.value)}
              maxLength={1000}
              placeholder="URI, ticket, trace ID, or reference"
            />
          </label>

          <label>
            <span>Occurred at</span>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </label>

          <label>
            <span>Collected at</span>
            <input
              type="datetime-local"
              value={collectedAt}
              onChange={(event) => setCollectedAt(event.target.value)}
            />
          </label>

          <label>
            <span>Content hash</span>
            <input
              value={contentHash}
              onChange={(event) => setContentHash(event.target.value)}
              maxLength={500}
              placeholder="Optional integrity hash"
            />
          </label>

          <label>
            <span>Trust level</span>
            <input
              value={trustLevel}
              onChange={(event) => setTrustLevel(event.target.value)}
              maxLength={100}
              placeholder="Optional trust classification"
            />
          </label>

          <label className="evidence-form-grid__wide">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
              placeholder="Describe what this evidence represents."
            />
          </label>

          <label className="evidence-form-grid__wide">
            <span>Metadata JSON</span>
            <textarea
              value={metadata}
              onChange={(event) => setMetadata(event.target.value)}
              placeholder={'{"key":"value"}'}
            />
          </label>
        </div>

        {error ? <div className="evidence-form-error">{error}</div> : null}

        <div className="evidence-form-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding evidence…' : 'Add evidence'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EvidencePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [evidence, setEvidence] = useState<EvidenceResponse[]>([]);
  const [filter, setFilter] = useState<'ALL' | EvidenceType>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEvidence = useMemo(
    () => (filter === 'ALL' ? evidence : evidence.filter((item) => item.evidenceType === filter)),
    [evidence, filter],
  );

  async function loadEvidence() {
    if (!id || !token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [incidentResponse, evidenceResponse] = await Promise.all([
        getIncident(token, id),
        listIncidentEvidence(token, id),
      ]);

      setIncident(incidentResponse);
      setEvidence(evidenceResponse.items);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvidence();
  }, [id, token]);

  function handleCreated(item: EvidenceResponse) {
    setEvidence((current) => [...current, item]);
    setExpandedId(item.id);
  }

  async function handleDelete(item: EvidenceResponse) {
    if (!id || !token) {
      return;
    }

    const confirmed = window.confirm(
      `Delete evidence "${item.title}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError(null);

    try {
      await deleteIncidentEvidence(token, id, item.id);

      setEvidence((current) => current.filter((candidate) => candidate.id !== item.id));

      if (expandedId === item.id) {
        setExpandedId(null);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  }

  if (!token) {
    return (
      <div className="evidence-state evidence-state--error">
        <div className="evidence-state__icon">!</div>
        <div>
          <strong>Authentication required</strong>
          <p>Sign in again to access incident evidence.</p>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="evidence-state evidence-state--error">
        <div className="evidence-state__icon">!</div>
        <div>
          <strong>Invalid incident</strong>
          <p>The evidence workspace requires an incident ID.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="evidence-state" role="status">
        <span className="evidence-spinner" aria-hidden="true" />
        <div>
          <strong>Loading evidence</strong>
          <p>Retrieving incident evidence from SentinelAI.</p>
        </div>
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="evidence-state evidence-state--error">
        <div className="evidence-state__icon">!</div>
        <div>
          <strong>Evidence unavailable</strong>
          <p>{error}</p>
          <Button type="button" onClick={() => void loadEvidence()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!incident) {
    return null;
  }

  return (
    <div className="evidence-page">
      <div className="evidence-breadcrumb">
        <Link to="/incidents">Incidents</Link>
        <span>/</span>
        <Link to={`/incidents/${encodeURIComponent(incident.id)}`}>{incident.title}</Link>
        <span>/</span>
        <span>Evidence</span>
      </div>

      <header className="evidence-header">
        <div>
          <span className="page-eyebrow">Incident evidence</span>
          <h1>Evidence workspace</h1>
          <p className="evidence-header__id">{incident.id}</p>
        </div>

        <div className="evidence-header__badges">
          <Badge>{incident.severity}</Badge>
          <Badge>{incident.status}</Badge>
        </div>
      </header>

      <div className="evidence-summary">
        <div>
          <span>Total evidence</span>
          <strong>{evidence.length}</strong>
        </div>
        <div>
          <span>Visible</span>
          <strong>{filteredEvidence.length}</strong>
        </div>
        <div>
          <span>Sources</span>
          <strong>{new Set(evidence.map((item) => item.source)).size}</strong>
        </div>
      </div>

      <Card>
        <div className="evidence-panel-header">
          <div>
            <span className="page-eyebrow">Evidence inventory</span>
            <h2>Associated evidence</h2>
            <p>Evidence is retrieved directly from the incident evidence API.</p>
          </div>
        </div>

        <div className="evidence-filters" aria-label="Evidence type filters">
          <button
            type="button"
            className={`evidence-filter${filter === 'ALL' ? ' evidence-filter--active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All
          </button>

          {EVIDENCE_TYPES.map((type) => (
            <button
              type="button"
              className={`evidence-filter${filter === type ? ' evidence-filter--active' : ''}`}
              onClick={() => setFilter(type)}
              key={type}
            >
              {humanizeType(type)}
            </button>
          ))}
        </div>

        {error ? <div className="evidence-inline-error">{error}</div> : null}

        {filteredEvidence.length === 0 ? (
          <div className="evidence-empty">
            <strong>
              {evidence.length === 0
                ? 'No evidence has been recorded.'
                : 'No evidence matches this filter.'}
            </strong>
            <p>
              {evidence.length === 0
                ? 'Use the evidence intake below to record the first item.'
                : 'Select another evidence type to view additional items.'}
            </p>
          </div>
        ) : (
          <div className="evidence-list">
            {filteredEvidence.map((item) => {
              const expanded = expandedId === item.id;

              return (
                <article className="evidence-item" key={item.id}>
                  <div className="evidence-item__marker" aria-hidden="true">
                    <span />
                  </div>

                  <div className="evidence-item__content">
                    <div className="evidence-item__header">
                      <div className="evidence-item__heading">
                        <div className="evidence-item__type">
                          <Badge>{humanizeType(item.evidenceType)}</Badge>
                          {item.trustLevel ? (
                            <span className="evidence-item__trust">Trust: {item.trustLevel}</span>
                          ) : null}
                        </div>

                        <h3>{item.title}</h3>
                      </div>

                      <time dateTime={item.occurredAt ?? item.createdAt}>
                        {formatDate(item.occurredAt ?? item.createdAt)}
                      </time>
                    </div>

                    <div className="evidence-item__meta">
                      <span>
                        <strong>Source</strong>
                        {item.source}
                      </span>

                      {item.sourceRef ? (
                        <span>
                          <strong>Reference</strong>
                          {item.sourceRef}
                        </span>
                      ) : null}
                    </div>

                    {item.description ? (
                      <p className="evidence-item__description">{item.description}</p>
                    ) : null}

                    <div className="evidence-item__actions">
                      <button
                        type="button"
                        className="evidence-item__toggle"
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        aria-expanded={expanded}
                      >
                        {expanded ? 'Hide details' : 'View details'}
                      </button>

                      <button
                        type="button"
                        className="evidence-item__delete"
                        onClick={() => void handleDelete(item)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>

                    {expanded ? (
                      <div className="evidence-item__details">
                        <div>
                          <span>Evidence ID</span>
                          <code>{item.id}</code>
                        </div>

                        <div>
                          <span>Collected at</span>
                          <p>{formatDate(item.collectedAt)}</p>
                        </div>

                        <div>
                          <span>Created at</span>
                          <p>{formatDate(item.createdAt)}</p>
                        </div>

                        <div>
                          <span>Updated at</span>
                          <p>{formatDate(item.updatedAt)}</p>
                        </div>

                        {item.contentHash ? (
                          <div>
                            <span>Content hash</span>
                            <code>{item.contentHash}</code>
                          </div>
                        ) : null}

                        {item.metadata ? (
                          <div>
                            <span>Metadata</span>
                            <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <CreateEvidenceForm token={token} incidentId={incident.id} onCreated={handleCreated} />
    </div>
  );
}

export default EvidencePage;
