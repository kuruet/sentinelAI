import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  analyzeRootCause,
  ApiRequestError,
  getIncident,
  type IncidentResponse,
  type RootCauseAnalysisMode,
  type RootCauseAnalysisResponse,
} from '../lib/api';

const RCA_MODES: Array<{
  value: RootCauseAnalysisMode;
  label: string;
  description: string;
}> = [
  {
    value: 'PRIMARY',
    label: 'Primary analysis',
    description: 'Identify and rank the strongest candidate root-cause hypotheses.',
  },
  {
    value: 'ALTERNATIVE',
    label: 'Alternative analysis',
    description: 'Explore plausible alternative causes supported by the incident context.',
  },
];

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return 'Your session is no longer valid. Please sign in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to perform this investigation action.';
    }

    if (error.status === 404) {
      return 'The incident could not be found.';
    }

    return error.message;
  }

  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function confidenceVariant(level: 'HIGH' | 'MEDIUM' | 'LOW') {
  if (level === 'HIGH') {
    return 'success' as const;
  }

  if (level === 'MEDIUM') {
    return 'warning' as const;
  }

  return 'neutral' as const;
}

function formatConfidenceScore(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'Not scored';
  }

  return `${Math.round(score * 100)}%`;
}

function ReferenceList({
  title,
  references,
}: {
  title: string;
  references: RootCauseAnalysisResponse['hypotheses'][number]['supportingReferences'];
}) {
  if (references.length === 0) {
    return (
      <div className="rca-page__references-empty">
        <strong>{title}</strong>
        <span>No references supplied.</span>
      </div>
    );
  }

  return (
    <div className="rca-page__references">
      <h4>{title}</h4>
      <ul>
        {references.map((reference) => (
          <li key={`${reference.type}:${reference.id}`}>
            <div className="rca-page__reference-header">
              <span className="rca-page__reference-id">
                {reference.type}:{reference.id}
              </span>
            </div>
            <span>{reference.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RootCauseAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = id ?? '';
  const { token, status: authStatus } = useAuth();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [mode, setMode] = useState<RootCauseAnalysisMode>('PRIMARY');
  const [model, setModel] = useState('');
  const [response, setResponse] = useState<RootCauseAnalysisResponse | null>(null);
  const [loadingIncident, setLoadingIncident] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMode = useMemo(
    () => RCA_MODES.find((candidate) => candidate.value === mode) ?? RCA_MODES[0],
    [mode],
  );

  const loadIncident = useCallback(async () => {
    if (!token || !incidentId) {
      setLoadingIncident(false);
      return;
    }

    setLoadingIncident(true);
    setError(null);

    try {
      const result = await getIncident(token, incidentId);
      setIncident(result);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingIncident(false);
    }
  }, [incidentId, token]);

  useEffect(() => {
    void loadIncident();
  }, [loadIncident]);

  const handleAnalyze = async () => {
    if (!token || !incidentId || !model.trim()) {
      setError('Enter the configured AI model identifier before running RCA.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeRootCause(token, incidentId, mode, model.trim());

      setResponse(result);
    } catch (analysisError) {
      setError(getErrorMessage(analysisError));
    } finally {
      setAnalyzing(false);
    }
  };

  if (authStatus === 'loading' || loadingIncident) {
    return (
      <section className="rca-page">
        <Card>
          <div className="page-state" role="status">
            Loading root-cause analysis workspace…
          </div>
        </Card>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="rca-page">
        <Card>
          <div className="page-state page-state--error">
            Your session is not available. Please sign in again.
          </div>
        </Card>
      </section>
    );
  }

  if (!incident) {
    return (
      <section className="rca-page">
        <Card>
          <div className="page-state page-state--error">{error ?? 'Incident unavailable.'}</div>
          <div className="rca-page__state-actions">
            <Button type="button" onClick={() => void loadIncident()}>
              Retry
            </Button>
            <Link className="button button--secondary" to="/incidents">
              Back to incidents
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="rca-page">
      <header className="rca-page__header">
        <div>
          <span className="eyebrow">Root Cause Analysis</span>
          <h1>{incident.title}</h1>
          <p>
            Evaluate candidate causes against grounded incident evidence. RCA remains advisory and
            does not establish causation automatically.
          </p>
        </div>

        <div className="rca-page__header-actions">
          <Link className="button button--secondary" to={`/incidents/${incident.id}`}>
            Incident
          </Link>
          <Link className="button button--secondary" to={`/incidents/${incident.id}/intelligence`}>
            Intelligence
          </Link>
        </div>
      </header>

      <nav className="rca-page__workspace-nav" aria-label="Incident workspace">
        <Link to={`/incidents/${incident.id}`}>Overview</Link>
        <Link to={`/incidents/${incident.id}/timeline`}>Timeline</Link>
        <Link to={`/incidents/${incident.id}/evidence`}>Evidence</Link>
        <Link to={`/incidents/${incident.id}/investigation`}>Investigation</Link>
        <Link to={`/incidents/${incident.id}/intelligence`}>Intelligence</Link>
        <Link to={`/incidents/${incident.id}/intelligence/summary`}>AI Summary</Link>
        <Link to={`/incidents/${incident.id}/intelligence/assistant`}>AI Assistant</Link>
        <span aria-current="page">RCA</span>
      </nav>

      {error && (
        <Card>
          <div className="page-state page-state--error" role="alert">
            {error}
          </div>
        </Card>
      )}

      <div className="rca-page__layout">
        <div className="rca-page__main">
          <Card>
            <div className="rca-page__section-heading">
              <div>
                <span className="eyebrow">Analysis configuration</span>
                <h2>Choose an RCA mode</h2>
              </div>
              <Badge variant="info">AI-generated</Badge>
            </div>

            <div className="rca-page__mode-grid">
              {RCA_MODES.map((candidate) => (
                <button
                  className={`rca-page__mode ${
                    mode === candidate.value ? 'rca-page__mode--selected' : ''
                  }`}
                  key={candidate.value}
                  type="button"
                  onClick={() => setMode(candidate.value)}
                  aria-pressed={mode === candidate.value}
                >
                  <span>{candidate.label}</span>
                  <small>{candidate.description}</small>
                </button>
              ))}
            </div>

            <div className="rca-page__form">
              <label htmlFor="rca-model">
                AI model
                <input
                  id="rca-model"
                  type="text"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="Enter the configured model identifier"
                  maxLength={200}
                  autoComplete="off"
                />
              </label>

              <div className="rca-page__selected-mode">
                <span>Selected mode</span>
                <strong>{selectedMode.label}</strong>
                <p>{selectedMode.description}</p>
              </div>

              <Button
                type="button"
                onClick={() => void handleAnalyze()}
                disabled={analyzing || !model.trim()}
              >
                {analyzing ? 'Analyzing…' : 'Run root-cause analysis'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="rca-page__section-heading">
              <div>
                <span className="eyebrow">Incident context</span>
                <h2>Source-of-truth boundaries</h2>
              </div>
            </div>

            <div className="rca-page__context-grid">
              <div>
                <span>Severity</span>
                <strong>{incident.severity}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{incident.status}</strong>
              </div>
              <div>
                <span>Started</span>
                <strong>{formatDate(incident.startedAt)}</strong>
              </div>
              <div>
                <span>Updated</span>
                <strong>{formatDate(incident.updatedAt)}</strong>
              </div>
            </div>

            <div className="rca-page__boundary">
              <strong>Interpretation boundary</strong>
              <p>
                Deterministic correlations, temporal relationships, anomalies, and findings do not
                by themselves establish causation. A candidate hypothesis is not a confirmed root
                cause and requires human validation.
              </p>
            </div>
          </Card>

          {response && (
            <>
              <Card>
                <div className="rca-page__section-heading">
                  <div>
                    <span className="eyebrow">RCA assessment</span>
                    <h2>Analysis</h2>
                  </div>
                  <Badge variant={response.hypotheses.length > 0 ? 'warning' : 'neutral'}>
                    {response.hypotheses.length} hypothesis
                    {response.hypotheses.length === 1 ? '' : 'es'}
                  </Badge>
                </div>

                <div className="rca-page__analysis">{response.analysis}</div>
              </Card>

              <Card>
                <div className="rca-page__section-heading">
                  <div>
                    <span className="eyebrow">Candidate causes</span>
                    <h2>Hypotheses</h2>
                  </div>
                  <span className="rca-page__result-mode">
                    {response.mode === 'PRIMARY' ? 'Primary' : 'Alternative'}
                  </span>
                </div>

                {response.hypotheses.length === 0 ? (
                  <div className="page-state">
                    No credible root-cause hypothesis was supported by the supplied context.
                  </div>
                ) : (
                  <div className="rca-page__hypotheses">
                    {response.hypotheses.map((hypothesis, index) => (
                      <article className="rca-page__hypothesis" key={hypothesis.id}>
                        <div className="rca-page__hypothesis-header">
                          <div>
                            <span className="rca-page__rank">Candidate {index + 1}</span>
                            <h3>{hypothesis.title}</h3>
                          </div>

                          <Badge variant={confidenceVariant(hypothesis.confidence.level)}>
                            {hypothesis.confidence.level} ·{' '}
                            {formatConfidenceScore(hypothesis.confidence.score)}
                          </Badge>
                        </div>

                        <p>{hypothesis.description}</p>

                        <div className="rca-page__confidence">
                          <strong>Confidence rationale</strong>
                          <span>{hypothesis.confidence.rationale}</span>
                        </div>

                        <div className="rca-page__reference-grid">
                          <ReferenceList
                            title="Supporting references"
                            references={hypothesis.supportingReferences}
                          />
                          <ReferenceList
                            title="Contradicting references"
                            references={hypothesis.contradictingReferences}
                          />
                        </div>

                        <div className="rca-page__hypothesis-id">
                          Hypothesis ID: {hypothesis.id}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="rca-page__section-heading">
                  <div>
                    <span className="eyebrow">Limitations</span>
                    <h2>What this result does not establish</h2>
                  </div>
                </div>

                <ul className="rca-page__limitations">
                  {response.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </Card>

              <Card>
                <div className="rca-page__section-heading">
                  <div>
                    <span className="eyebrow">Provenance</span>
                    <h2>Generation metadata</h2>
                  </div>
                </div>

                <dl className="rca-page__metadata">
                  <div>
                    <dt>Provider</dt>
                    <dd>{response.provider}</dd>
                  </div>
                  <div>
                    <dt>Model</dt>
                    <dd>{response.model}</dd>
                  </div>
                  <div>
                    <dt>Latency</dt>
                    <dd>
                      {response.latencyMs !== undefined
                        ? `${response.latencyMs} ms`
                        : 'Not reported'}
                    </dd>
                  </div>
                  <div>
                    <dt>Request ID</dt>
                    <dd>{response.requestId ?? 'Not reported'}</dd>
                  </div>
                  <div>
                    <dt>Incident ID</dt>
                    <dd>{response.incidentId}</dd>
                  </div>
                </dl>
              </Card>
            </>
          )}
        </div>

        <aside className="rca-page__sidebar">
          <Card>
            <span className="eyebrow">Incident</span>
            <h2>Investigation workspace</h2>
            <p>
              RCA is grounded in the bounded intelligence context and the deterministic findings
              prepared by the backend.
            </p>

            <div className="rca-page__sidebar-links">
              <Link to={`/incidents/${incident.id}/investigation`}>Investigation record</Link>
              <Link to={`/incidents/${incident.id}/evidence`}>Evidence</Link>
              <Link to={`/incidents/${incident.id}/timeline`}>Timeline</Link>
              <Link to={`/incidents/${incident.id}/intelligence`}>Intelligence overview</Link>
            </div>
          </Card>

          <Card>
            <span className="eyebrow">Safety</span>
            <h2>Human validation required</h2>
            <p>
              AI-generated hypotheses are advisory. Do not treat correlation, confidence, or ranking
              as proof of causation.
            </p>
          </Card>
        </aside>
      </div>
    </section>
  );
}

export default RootCauseAnalysisPage;
