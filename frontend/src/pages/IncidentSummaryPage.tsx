import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiRequestError,
  generateIncidentSummary,
  getIncident,
  type IncidentResponse,
  type IncidentSummaryMode,
  type IncidentSummaryResponse,
} from '../lib/api';

const SUMMARY_MODES: Array<{
  value: IncidentSummaryMode;
  label: string;
  description: string;
}> = [
  {
    value: 'EXECUTIVE',
    label: 'Executive',
    description: 'Concise status, impact, timeline facts, and uncertainty.',
  },
  {
    value: 'INVESTIGATION',
    label: 'Investigation',
    description: 'Observed facts, evidence, findings, investigation state, and open questions.',
  },
  {
    value: 'TIMELINE',
    label: 'Timeline',
    description:
      'Sequence of observed events and evidence, without confusing correlation with causation.',
  },
];

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

function IncidentSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = id ?? '';
  const { token } = useAuth();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [mode, setMode] = useState<IncidentSummaryMode>('EXECUTIVE');
  const [model, setModel] = useState('');
  const [result, setResult] = useState<IncidentSummaryResponse | null>(null);
  const [loadingIncident, setLoadingIncident] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    if (!token || !incidentId) {
      setIncidentError('An authenticated incident context is required.');
      setLoadingIncident(false);
      return;
    }

    setLoadingIncident(true);
    setIncidentError(null);

    try {
      const response = await getIncident(token, incidentId);
      setIncident(response);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 401) {
          setIncidentError('Your session is no longer valid. Please sign in again.');
        } else if (requestError.status === 403) {
          setIncidentError('You do not have permission to view this incident.');
        } else if (requestError.status === 404) {
          setIncidentError('The requested incident could not be found.');
        } else {
          setIncidentError(requestError.message);
        }
      } else {
        setIncidentError('Unable to load the incident.');
      }
    } finally {
      setLoadingIncident(false);
    }
  }, [incidentId, token]);

  useEffect(() => {
    void loadIncident();
  }, [loadIncident]);

  const generateSummary = async () => {
    if (!token || !incidentId) {
      setError('An authenticated incident context is required.');
      return;
    }

    const trimmedModel = model.trim();

    if (!trimmedModel) {
      setError('Enter the AI model identifier before generating a summary.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateIncidentSummary(token, incidentId, mode, trimmedModel);
      setResult(response);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 401) {
          setError('Your session is no longer valid. Please sign in again.');
        } else if (requestError.status === 403) {
          setError('You do not have permission to generate intelligence for this incident.');
        } else if (requestError.status === 404) {
          setError('The requested incident could not be found.');
        } else {
          setError(requestError.message);
        }
      } else {
        setError('Unable to generate the incident summary.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (!incidentId) {
    return (
      <div className="incident-summary-page">
        <Card elevated>
          <span className="ui-mono ui-text-xs ui-muted">AI SUMMARY</span>
          <h1 className="ui-heading-2">Incident context required</h1>
          <p className="ui-secondary">Open the AI summary from a specific incident workspace.</p>
          <Link className="ui-button ui-button--secondary" to="/incidents">
            Back to incidents
          </Link>
        </Card>
      </div>
    );
  }

  if (loadingIncident) {
    return (
      <div className="incident-summary-page" aria-busy="true">
        <div className="incident-summary-page__header">
          <span className="page-frame__eyebrow">AI INCIDENT SUMMARY</span>
          <h1 className="ui-heading-1">AI Incident Summary</h1>
          <p>Loading incident context…</p>
        </div>

        <Card elevated className="incident-summary-page__loading">
          <div className="auth-loading__indicator" aria-hidden="true" />
          <span className="ui-secondary">Preparing the summary workspace.</span>
        </Card>
      </div>
    );
  }

  if (incidentError || !incident) {
    return (
      <div className="incident-summary-page">
        <Card elevated className="incident-summary-page__error" role="alert">
          <span className="ui-mono ui-text-xs ui-muted">AI SUMMARY ERROR</span>
          <h1 className="ui-heading-2">Unable to load incident</h1>
          <p className="ui-secondary">{incidentError ?? 'No incident context is available.'}</p>
          <div className="incident-summary-page__actions">
            <button
              className="ui-button ui-button--primary"
              type="button"
              onClick={() => void loadIncident()}
            >
              Retry
            </button>
            <Link className="ui-button ui-button--secondary" to="/incidents">
              Back to incidents
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="incident-summary-page">
      <header className="incident-summary-page__header">
        <div>
          <span className="page-frame__eyebrow">AI INCIDENT SUMMARY</span>
          <h1 className="ui-heading-1">AI Incident Summary</h1>
          <p>
            Generate a grounded summary from the incident context. AI output is advisory and does
            not replace source-of-truth incident data.
          </p>
        </div>

        <div className="incident-summary-page__header-status">
          <Badge variant={severityTone(incident.severity)}>{incident.severity}</Badge>
          <span className="ui-mono ui-text-xs ui-muted">{incident.status}</span>
        </div>
      </header>

      <nav
        className="incident-summary-page__workspace"
        aria-label="Incident intelligence workspace"
      >
        <Link to={`/incidents/${encodeURIComponent(incidentId)}`}>Overview</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>Timeline</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>Evidence</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>Investigation</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence`}>Intelligence</Link>
        <span aria-current="page">AI Summary</span>
      </nav>

      <Card elevated className="incident-summary-page__incident">
        <div>
          <span className="ui-mono ui-text-xs ui-muted">INCIDENT</span>
          <h2 className="ui-heading-2">{incident.title}</h2>
        </div>
        <p className="ui-secondary">
          {incident.description ?? 'No incident description has been recorded.'}
        </p>
      </Card>

      <section className="incident-summary-page__grid">
        <Card elevated>
          <div className="incident-summary-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">GENERATION</span>
              <h2 className="ui-heading-3">Summary configuration</h2>
            </div>
          </div>

          <div className="incident-summary-page__form">
            <label>
              <span>Summary mode</span>
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as IncidentSummaryMode);
                  setResult(null);
                  setError(null);
                }}
                disabled={generating}
              >
                {SUMMARY_MODES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="incident-summary-page__mode-description">
              <strong>{SUMMARY_MODES.find((item) => item.value === mode)?.label}</strong>
              <span className="ui-secondary">
                {SUMMARY_MODES.find((item) => item.value === mode)?.description}
              </span>
            </div>

            <label>
              <span>AI model</span>
              <input
                type="text"
                value={model}
                onChange={(event) => {
                  setModel(event.target.value);
                  setError(null);
                }}
                placeholder="Enter the configured model identifier"
                maxLength={200}
                autoComplete="off"
                disabled={generating}
              />
            </label>

            <p className="ui-muted">
              The model identifier is sent to the backend provider. SentinelAI does not assume or
              invent a model configuration.
            </p>

            <button
              className="ui-button ui-button--primary"
              type="button"
              onClick={() => void generateSummary()}
              disabled={generating || !model.trim()}
            >
              {generating ? 'Generating summary…' : 'Generate AI summary'}
            </button>

            {error ? (
              <div className="incident-summary-page__inline-error" role="alert">
                {error}
              </div>
            ) : null}
          </div>
        </Card>

        <Card elevated>
          <div className="incident-summary-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">GROUNDING</span>
              <h2 className="ui-heading-3">Safety boundary</h2>
            </div>
            <Badge variant="info">GROUNDED</Badge>
          </div>

          <ul className="incident-summary-page__guardrails">
            <li>Observed facts are prioritized before interpretations.</li>
            <li>Supplied incident context is the source boundary.</li>
            <li>Temporal correlation is not treated as proof of causation.</li>
            <li>Missing or unverified information remains uncertain.</li>
            <li>The operation does not modify incident state.</li>
          </ul>
        </Card>
      </section>

      {generating ? (
        <Card elevated className="incident-summary-page__loading">
          <div className="auth-loading__indicator" aria-hidden="true" />
          <div>
            <strong>Generating grounded summary</strong>
            <p className="ui-secondary">
              The backend is assembling bounded context and requesting an AI response.
            </p>
          </div>
        </Card>
      ) : null}

      {result ? (
        <>
          <Card elevated className="incident-summary-page__result">
            <div className="incident-summary-page__result-header">
              <div>
                <span className="ui-mono ui-text-xs ui-muted">AI OUTPUT</span>
                <h2 className="ui-heading-2">
                  {SUMMARY_MODES.find((item) => item.value === result.mode)?.label} summary
                </h2>
              </div>

              <Badge variant="success">GENERATED</Badge>
            </div>

            <div className="incident-summary-page__summary">
              {result.summary
                .split(/\n+/)
                .map((paragraph, index) =>
                  paragraph.trim() ? <p key={`${index}-${paragraph}`}>{paragraph}</p> : null,
                )}
            </div>

            <div className="incident-summary-page__provenance">
              <div>
                <span>Provider</span>
                <strong>{result.provider}</strong>
              </div>
              <div>
                <span>Model</span>
                <strong>{result.model}</strong>
              </div>
              <div>
                <span>Latency</span>
                <strong>{result.latencyMs} ms</strong>
              </div>
              <div>
                <span>Request ID</span>
                <strong>{result.requestId ?? 'Not supplied'}</strong>
              </div>
            </div>
          </Card>

          <section className="incident-summary-page__details">
            <Card elevated>
              <div className="incident-summary-page__section-heading">
                <div>
                  <span className="ui-mono ui-text-xs ui-muted">REFERENCES</span>
                  <h2 className="ui-heading-3">Grounding references</h2>
                </div>
                <span className="ui-mono ui-text-xs ui-muted">
                  {result.references.length} SOURCES
                </span>
              </div>

              {result.references.length > 0 ? (
                <div className="incident-summary-page__references">
                  {result.references.map((reference) => (
                    <div
                      className="incident-summary-page__reference"
                      key={`${reference.type}-${reference.id}`}
                    >
                      <div>
                        <Badge variant="neutral">{reference.type}</Badge>
                        <strong>{reference.id}</strong>
                      </div>
                      <p className="ui-secondary">{reference.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ui-muted">No references were returned.</p>
              )}
            </Card>

            <Card elevated>
              <div className="incident-summary-page__section-heading">
                <div>
                  <span className="ui-mono ui-text-xs ui-muted">LIMITATIONS</span>
                  <h2 className="ui-heading-3">Interpretation boundary</h2>
                </div>
              </div>

              <ul className="incident-summary-page__limitations">
                {result.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </Card>
          </section>

          <footer className="incident-summary-page__footer">
            <span className="ui-mono ui-text-xs ui-muted">
              AI-GENERATED · {result.mode} · {result.provider}
            </span>
          </footer>
        </>
      ) : null}
    </div>
  );
}

export default IncidentSummaryPage;
