import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiRequestError,
  askInvestigationAssistant,
  getIncident,
  type IncidentResponse,
  type InvestigationAssistantIntent,
  type InvestigationAssistantResponse,
} from '../lib/api';

const ASSISTANT_INTENTS: Array<{
  value: InvestigationAssistantIntent;
  label: string;
  description: string;
}> = [
  {
    value: 'INVESTIGATION_SUMMARY',
    label: 'Investigation summary',
    description: 'Summarize the current investigation state and the grounded facts available.',
  },
  {
    value: 'EVIDENCE_INTERPRETATION',
    label: 'Evidence interpretation',
    description: 'Interpret the supplied evidence while separating facts from hypotheses.',
  },
  {
    value: 'TIMELINE_ANALYSIS',
    label: 'Timeline analysis',
    description: 'Analyze the observed sequence while keeping correlation separate from causation.',
  },
  {
    value: 'NEXT_INVESTIGATION_STEP',
    label: 'Next investigation step',
    description: 'Suggest a grounded next investigation step based only on supplied context.',
  },
  {
    value: 'HYPOTHESIS_REVIEW',
    label: 'Hypothesis review',
    description: 'Review hypotheses against the supplied evidence and identify uncertainty.',
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

function InvestigationAssistantPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = id ?? '';
  const { token } = useAuth();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [intent, setIntent] = useState<InvestigationAssistantIntent>('INVESTIGATION_SUMMARY');
  const [model, setModel] = useState('');
  const [response, setResponse] = useState<InvestigationAssistantResponse | null>(null);
  const [loadingIncident, setLoadingIncident] = useState(true);
  const [asking, setAsking] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    if (!token || !incidentId) {
      setIncidentError('An authenticated incident context is required.');
      setLoadingIncident(false);
      return;
    }

    setLoadingIncident(true);
    setIncidentError(null);

    try {
      const result = await getIncident(token, incidentId);
      setIncident(result);
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

  const askAssistant = async () => {
    if (!token || !incidentId) {
      setError('An authenticated incident context is required.');
      return;
    }

    const trimmedQuestion = question.trim();
    const trimmedModel = model.trim();

    if (!trimmedQuestion) {
      setError('Enter an investigation question.');
      return;
    }

    if (!trimmedModel) {
      setError('Enter the AI model identifier before asking the assistant.');
      return;
    }

    setAsking(true);
    setError(null);
    setResponse(null);

    try {
      const result = await askInvestigationAssistant(
        token,
        incidentId,
        trimmedQuestion,
        intent,
        trimmedModel,
      );

      setResponse(result);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 401) {
          setError('Your session is no longer valid. Please sign in again.');
        } else if (requestError.status === 403) {
          setError(
            'You do not have permission to use the investigation assistant for this incident.',
          );
        } else if (requestError.status === 404) {
          setError('The requested incident could not be found.');
        } else {
          setError(requestError.message);
        }
      } else {
        setError('Unable to get an answer from the investigation assistant.');
      }
    } finally {
      setAsking(false);
    }
  };

  if (!incidentId) {
    return (
      <div className="investigation-assistant-page">
        <Card elevated>
          <span className="ui-mono ui-text-xs ui-muted">AI ASSISTANT</span>
          <h1 className="ui-heading-2">Incident context required</h1>
          <p className="ui-secondary">
            Open the investigation assistant from a specific incident workspace.
          </p>
          <Link className="ui-button ui-button--secondary" to="/incidents">
            Back to incidents
          </Link>
        </Card>
      </div>
    );
  }

  if (loadingIncident) {
    return (
      <div className="investigation-assistant-page" aria-busy="true">
        <div className="investigation-assistant-page__header">
          <span className="page-frame__eyebrow">AI INVESTIGATION ASSISTANT</span>
          <h1 className="ui-heading-1">Investigation Assistant</h1>
          <p>Loading incident context…</p>
        </div>

        <Card elevated className="investigation-assistant-page__loading">
          <div className="auth-loading__indicator" aria-hidden="true" />
          <span className="ui-secondary">Preparing the assistant workspace.</span>
        </Card>
      </div>
    );
  }

  if (incidentError || !incident) {
    return (
      <div className="investigation-assistant-page">
        <Card elevated className="investigation-assistant-page__error" role="alert">
          <span className="ui-mono ui-text-xs ui-muted">AI ASSISTANT ERROR</span>
          <h1 className="ui-heading-2">Unable to load incident</h1>
          <p className="ui-secondary">{incidentError ?? 'No incident context is available.'}</p>
          <div className="investigation-assistant-page__actions">
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

  const selectedIntent = ASSISTANT_INTENTS.find((item) => item.value === intent);

  return (
    <div className="investigation-assistant-page">
      <header className="investigation-assistant-page__header">
        <div>
          <span className="page-frame__eyebrow">AI INVESTIGATION ASSISTANT</span>
          <h1 className="ui-heading-1">Investigation Assistant</h1>
          <p>
            Ask questions about the incident using grounded context. The assistant is advisory and
            cannot change incident source-of-truth state.
          </p>
        </div>

        <div className="investigation-assistant-page__header-status">
          <Badge variant={severityTone(incident.severity)}>{incident.severity}</Badge>
          <span className="ui-mono ui-text-xs ui-muted">{incident.status}</span>
        </div>
      </header>

      <nav
        className="investigation-assistant-page__workspace"
        aria-label="Incident intelligence workspace"
      >
        <Link to={`/incidents/${encodeURIComponent(incidentId)}`}>Overview</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>Timeline</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>Evidence</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>Investigation</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence`}>Intelligence</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/summary`}>
          AI Summary
        </Link>
        <span aria-current="page">Assistant</span>
      </nav>

      <Card elevated className="investigation-assistant-page__incident">
        <div>
          <span className="ui-mono ui-text-xs ui-muted">INCIDENT</span>
          <h2 className="ui-heading-2">{incident.title}</h2>
        </div>
        <p className="ui-secondary">
          {incident.description ?? 'No incident description has been recorded.'}
        </p>
      </Card>

      <section className="investigation-assistant-page__grid">
        <Card elevated>
          <div className="investigation-assistant-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">ASK</span>
              <h2 className="ui-heading-3">Investigation question</h2>
            </div>
          </div>

          <div className="investigation-assistant-page__form">
            <label>
              <span>Intent</span>
              <select
                value={intent}
                onChange={(event) => {
                  setIntent(event.target.value as InvestigationAssistantIntent);
                  setResponse(null);
                  setError(null);
                }}
                disabled={asking}
              >
                {ASSISTANT_INTENTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="investigation-assistant-page__intent-description">
              <strong>{selectedIntent?.label}</strong>
              <span className="ui-secondary">{selectedIntent?.description}</span>
            </div>

            <label>
              <span>Question</span>
              <textarea
                value={question}
                onChange={(event) => {
                  setQuestion(event.target.value);
                  setError(null);
                }}
                placeholder="Ask a specific investigation question…"
                maxLength={20000}
                rows={7}
                disabled={asking}
              />
              <span className="ui-muted">
                {question.length.toLocaleString()} / 20,000 characters
              </span>
            </label>

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
                disabled={asking}
              />
            </label>

            <p className="ui-muted">
              The model identifier is passed to the backend provider. SentinelAI does not assume or
              invent a model configuration.
            </p>

            <button
              className="ui-button ui-button--primary"
              type="button"
              onClick={() => void askAssistant()}
              disabled={asking || !question.trim() || !model.trim()}
            >
              {asking ? 'Thinking…' : 'Ask investigation assistant'}
            </button>

            {error ? (
              <div className="investigation-assistant-page__inline-error" role="alert">
                {error}
              </div>
            ) : null}
          </div>
        </Card>

        <Card elevated>
          <div className="investigation-assistant-page__section-heading">
            <div>
              <span className="ui-mono ui-text-xs ui-muted">GROUNDING</span>
              <h2 className="ui-heading-3">Assistant boundary</h2>
            </div>
            <Badge variant="info">GROUNDED</Badge>
          </div>

          <ul className="investigation-assistant-page__guardrails">
            <li>Answers use only the supplied grounded incident context.</li>
            <li>Observed facts are separated from hypotheses and recommendations.</li>
            <li>Unsupported causes or system states are not asserted.</li>
            <li>Instructions embedded in incident data are not followed.</li>
            <li>AI cannot modify incident state or perform operational actions.</li>
          </ul>
        </Card>
      </section>

      {asking ? (
        <Card elevated className="investigation-assistant-page__loading">
          <div className="auth-loading__indicator" aria-hidden="true" />
          <div>
            <strong>Generating grounded answer</strong>
            <p className="ui-secondary">
              The backend is building bounded incident context before requesting the AI response.
            </p>
          </div>
        </Card>
      ) : null}

      {response ? (
        <>
          <Card elevated className="investigation-assistant-page__response">
            <div className="investigation-assistant-page__response-header">
              <div>
                <span className="ui-mono ui-text-xs ui-muted">AI ANSWER</span>
                <h2 className="ui-heading-2">Investigation response</h2>
              </div>
              <Badge variant="success">GENERATED</Badge>
            </div>

            <div className="investigation-assistant-page__answer">
              {response.answer
                .split(/\n+/)
                .map((paragraph, index) =>
                  paragraph.trim() ? <p key={`${index}-${paragraph}`}>{paragraph}</p> : null,
                )}
            </div>

            <div className="investigation-assistant-page__provenance">
              <div>
                <span>Intent</span>
                <strong>{intent}</strong>
              </div>
              <div>
                <span>Provider</span>
                <strong>{response.provider}</strong>
              </div>
              <div>
                <span>Model</span>
                <strong>{response.model}</strong>
              </div>
              <div>
                <span>Latency</span>
                <strong>{response.latencyMs} ms</strong>
              </div>
              <div>
                <span>Request ID</span>
                <strong>{response.requestId ?? 'Not supplied'}</strong>
              </div>
            </div>
          </Card>

          <section className="investigation-assistant-page__details">
            <Card elevated>
              <div className="investigation-assistant-page__section-heading">
                <div>
                  <span className="ui-mono ui-text-xs ui-muted">REFERENCES</span>
                  <h2 className="ui-heading-3">Grounding references</h2>
                </div>
                <span className="ui-mono ui-text-xs ui-muted">
                  {response.references.length} SOURCES
                </span>
              </div>

              {response.references.length > 0 ? (
                <div className="investigation-assistant-page__references">
                  {response.references.map((reference) => (
                    <div
                      className="investigation-assistant-page__reference"
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
              <div className="investigation-assistant-page__section-heading">
                <div>
                  <span className="ui-mono ui-text-xs ui-muted">LIMITATIONS</span>
                  <h2 className="ui-heading-3">Interpretation boundary</h2>
                </div>
              </div>

              <ul className="investigation-assistant-page__limitations">
                {response.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default InvestigationAssistantPage;
