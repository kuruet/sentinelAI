import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  ApiRequestError,
  getIncident,
  getRecommendations,
  type IncidentResponse,
  type IntelligenceRecommendation,
  type RecommendationPriority,
  type RecommendationsResponse,
} from '../lib/api';

const PRIORITIES: RecommendationPriority[] = ['IMMEDIATE', 'HIGH', 'NORMAL', 'LOW'];

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
      return 'Your session has expired. Please sign in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to view recommendations for this incident.';
    }

    if (error.status === 404) {
      return 'The incident could not be found.';
    }

    return error.message;
  }

  return 'Recommendations could not be loaded. Please try again.';
}

function priorityVariant(
  priority: RecommendationPriority,
): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  switch (priority) {
    case 'IMMEDIATE':
      return 'danger';
    case 'HIGH':
      return 'warning';
    case 'NORMAL':
      return 'info';
    case 'LOW':
      return 'neutral';
  }
}

function confidenceVariant(
  level: IntelligenceRecommendation['confidence']['level'],
): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  switch (level) {
    case 'HIGH':
      return 'success';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'neutral';
  }
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'Not provided';
  }

  return `${Math.round(score * 100)}%`;
}

function ReferenceList({ references }: { references: IntelligenceRecommendation['references'] }) {
  if (references.length === 0) {
    return <p className="recommendations-page__muted">No supporting references were supplied.</p>;
  }

  return (
    <ul className="recommendations-page__references">
      {references.map((reference) => (
        <li key={`${reference.type}:${reference.id}`} className="recommendations-page__reference">
          <div>
            <Badge variant="info">{reference.type}</Badge>
            <code>{reference.id}</code>
          </div>
          <span>{reference.reason}</span>
        </li>
      ))}
    </ul>
  );
}

function RecommendationCard({
  recommendation,
  index,
  onExplain,
}: {
  recommendation: IntelligenceRecommendation;
  index: number;
  onExplain: (recommendation: IntelligenceRecommendation) => void;
}) {
  return (
    <Card
      elevated
      className={`recommendations-page__recommendation recommendations-page__recommendation--${recommendation.priority.toLowerCase()}`}
    >
      <div className="recommendations-page__recommendation-header">
        <div className="recommendations-page__recommendation-rank">
          <span>{index + 1}</span>
        </div>

        <div className="recommendations-page__recommendation-title">
          <div className="recommendations-page__recommendation-labels">
            <Badge variant={priorityVariant(recommendation.priority)}>
              {recommendation.priority}
            </Badge>
            <Badge variant="info">AI-GENERATED</Badge>
          </div>

          <h3>{recommendation.title}</h3>
        </div>
      </div>
      <div className="recommendations-page__action">
        <span className="recommendations-page__eyebrow">Recommended action</span>
        <p>{recommendation.action}</p>
      </div>
      <div className="recommendations-page__confidence">
        <div>
          <span className="recommendations-page__eyebrow">Confidence</span>
          <div className="recommendations-page__confidence-value">
            <Badge variant={confidenceVariant(recommendation.confidence.level)}>
              {recommendation.confidence.level}
            </Badge>
            <span>{formatScore(recommendation.confidence.score)}</span>
          </div>
        </div>

        <div className="recommendations-page__confidence-rationale">
          <span className="recommendations-page__eyebrow">Confidence rationale</span>
          <p>{recommendation.confidence.rationale}</p>
        </div>
      </div>
      <details className="recommendations-page__references-panel">
        <summary>Supporting references ({recommendation.references.length})</summary>
        <ReferenceList references={recommendation.references} />
      </details>
      <div className="recommendations-page__recommendation-id">
        Recommendation ID: <code>{recommendation.id}</code>
      </div>
      <div className="recommendations-page__explain-action">
        <Button variant="secondary" onClick={() => onExplain(recommendation)}>
          Explain confidence
        </Button>
      </div>
    </Card>
  );
}

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const { id: incidentId } = useParams<{ id: string }>();
  const { token } = useAuth();
  const handleExplainRecommendation = useCallback(
    (recommendation: IntelligenceRecommendation) => {
      if (!incidentId) {
        return;
      }

      navigate(`/incidents/${encodeURIComponent(incidentId)}/intelligence/explainability`, {
        state: {
          target: {
            type: 'RECOMMENDATION',
            value: recommendation,
          },
        },
      });
    },
    [incidentId, navigate],
  );

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [response, setResponse] = useState<RecommendationsResponse | null>(null);
  const [model, setModel] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<RecommendationPriority | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    if (!token || !incidentId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getIncident(token, incidentId);
      setIncident(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [incidentId, token]);

  useEffect(() => {
    void loadIncident();
  }, [loadIncident]);

  const runRecommendations = useCallback(async () => {
    if (!token || !incidentId) {
      return;
    }

    const trimmedModel = model.trim();

    if (!trimmedModel) {
      setError('Enter an AI model before requesting recommendations.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const result = await getRecommendations(token, incidentId, trimmedModel);
      setResponse(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setGenerating(false);
    }
  }, [incidentId, model, token]);

  const recommendations = useMemo(() => {
    if (!response) {
      return [];
    }

    if (selectedPriority === 'ALL') {
      return response.recommendations;
    }

    return response.recommendations.filter(
      (recommendation) => recommendation.priority === selectedPriority,
    );
  }, [response, selectedPriority]);

  const priorityCounts = useMemo(() => {
    const counts: Record<RecommendationPriority, number> = {
      IMMEDIATE: 0,
      HIGH: 0,
      NORMAL: 0,
      LOW: 0,
    };

    for (const recommendation of response?.recommendations ?? []) {
      counts[recommendation.priority] += 1;
    }

    return counts;
  }, [response]);

  if (!incidentId) {
    return (
      <div className="recommendations-page">
        <Card>
          <h1>Recommendations</h1>
          <p>Incident ID is missing.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="recommendations-page">
        <Card elevated className="recommendations-page__loading">
          <div className="auth-loading__indicator" aria-hidden="true" />
          <div>
            <strong>Loading incident</strong>
            <span>Preparing the recommendation workspace.</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <header className="recommendations-page__header">
        <div>
          <div className="recommendations-page__eyebrow">AI intelligence</div>
          <h1>Recommendations &amp; Next Actions</h1>
          <p>
            Evidence-grounded actions for investigation and incident response. Recommendations are
            advisory and require human validation before execution.
          </p>
        </div>

        <div className="recommendations-page__header-actions">
          <Link
            to={`/incidents/${encodeURIComponent(incidentId)}`}
            className="ui-button ui-button--secondary"
          >
            Incident
          </Link>
          <Link
            to={`/incidents/${encodeURIComponent(incidentId)}/intelligence`}
            className="ui-button ui-button--secondary"
          >
            Intelligence
          </Link>
        </div>
      </header>

      <nav
        className="recommendations-page__workspace-nav"
        aria-label="Incident intelligence workspace"
      >
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence`}>Overview</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>Timeline</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>Evidence</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>Investigation</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/summary`}>
          AI Summary
        </Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/assistant`}>
          AI Assistant
        </Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/root-cause`}>RCA</Link>
        <span className="recommendations-page__workspace-nav-active">Recommendations</span>
      </nav>

      {error ? (
        <Card className="recommendations-page__error">
          <div>
            <strong>Recommendation analysis unavailable</strong>
            <p>{error}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              if (response) {
                void runRecommendations();
              } else {
                void loadIncident();
              }
            }}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      <div className="recommendations-page__layout">
        <aside className="recommendations-page__sidebar">
          <Card>
            <div className="recommendations-page__sidebar-heading">
              <span className="recommendations-page__eyebrow">Investigation workspace</span>
              <h2>Next actions</h2>
            </div>

            <div className="recommendations-page__sidebar-links">
              <Link to={`/incidents/${encodeURIComponent(incidentId)}/timeline`}>Timeline</Link>
              <Link to={`/incidents/${encodeURIComponent(incidentId)}/evidence`}>Evidence</Link>
              <Link to={`/incidents/${encodeURIComponent(incidentId)}/investigation`}>
                Investigation
              </Link>
              <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/root-cause`}>
                Root cause analysis
              </Link>
            </div>
          </Card>

          <Card className="recommendations-page__safety-card">
            <Badge variant="warning">HUMAN VALIDATION</Badge>
            <h3>Advisory only</h3>
            <p>
              Recommendations do not execute operational changes. Validate proposed actions against
              current system state and operational procedures before acting.
            </p>
          </Card>
        </aside>

        <main className="recommendations-page__main">
          <Card elevated className="recommendations-page__configuration">
            <div className="recommendations-page__section-heading">
              <div>
                <span className="recommendations-page__eyebrow">Analysis configuration</span>
                <h2>Generate recommended actions</h2>
              </div>
              <Badge variant="info">AI-GENERATED</Badge>
            </div>

            <div className="recommendations-page__configuration-grid">
              <label>
                <span>AI model</span>
                <input
                  type="text"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="Enter the configured model"
                  maxLength={200}
                  autoComplete="off"
                />
                <small>
                  The backend requires an explicit model. No default model is assumed by the UI.
                </small>
              </label>

              <div className="recommendations-page__configuration-action">
                <span className="recommendations-page__eyebrow">Request</span>
                <p>
                  Generate only grounded recommendations using the current incident intelligence
                  context.
                </p>
                <Button
                  onClick={() => void runRecommendations()}
                  disabled={generating || !model.trim()}
                >
                  {generating ? 'Generating…' : 'Generate recommendations'}
                </Button>
              </div>
            </div>
          </Card>

          {incident ? (
            <Card className="recommendations-page__context">
              <div className="recommendations-page__section-heading">
                <div>
                  <span className="recommendations-page__eyebrow">Incident context</span>
                  <h2>{incident.title}</h2>
                </div>
                <Badge variant="warning">{incident.severity}</Badge>
              </div>

              <div className="recommendations-page__context-grid">
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

              <div className="recommendations-page__boundary">
                <strong>Interpretation boundary</strong>
                <p>
                  Recommendations are advisory. Deterministic findings, correlations, temporal
                  relationships, and hypotheses do not by themselves establish causation. Missing or
                  unverified information remains uncertain.
                </p>
              </div>
            </Card>
          ) : null}

          {response ? (
            <section className="recommendations-page__results">
              <div className="recommendations-page__results-heading">
                <div>
                  <span className="recommendations-page__eyebrow">AI recommendation set</span>
                  <h2>Recommended actions</h2>
                  <p>
                    {response.recommendations.length} recommendation
                    {response.recommendations.length === 1 ? '' : 's'} returned by the configured
                    provider.
                  </p>
                </div>

                <div className="recommendations-page__result-meta">
                  <Badge variant="info">GROUNDED</Badge>
                  <span>{response.provider}</span>
                </div>
              </div>

              <div className="recommendations-page__priority-filters">
                <button
                  type="button"
                  className={
                    selectedPriority === 'ALL'
                      ? 'recommendations-page__priority-filter recommendations-page__priority-filter--selected'
                      : 'recommendations-page__priority-filter'
                  }
                  onClick={() => setSelectedPriority('ALL')}
                >
                  All <strong>{response.recommendations.length}</strong>
                </button>

                {PRIORITIES.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    className={
                      selectedPriority === priority
                        ? 'recommendations-page__priority-filter recommendations-page__priority-filter--selected'
                        : 'recommendations-page__priority-filter'
                    }
                    onClick={() => setSelectedPriority(priority)}
                  >
                    {priority} <strong>{priorityCounts[priority]}</strong>
                  </button>
                ))}
              </div>

              {recommendations.length > 0 ? (
                <div className="recommendations-page__recommendations">
                  {recommendations.map((recommendation, index) => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      index={index}
                      onExplain={handleExplainRecommendation}
                    />
                  ))}
                </div>
              ) : (
                <Card className="recommendations-page__empty">
                  <strong>No recommendations in this priority</strong>
                  <p>
                    The returned recommendation set does not contain actions matching the selected
                    priority.
                  </p>
                </Card>
              )}

              <Card className="recommendations-page__metadata">
                <div>
                  <span className="recommendations-page__eyebrow">Provider</span>
                  <strong>{response.provider}</strong>
                </div>
                <div>
                  <span className="recommendations-page__eyebrow">Model</span>
                  <strong>{response.model}</strong>
                </div>
                <div>
                  <span className="recommendations-page__eyebrow">Latency</span>
                  <strong>
                    {response.latencyMs === undefined ? 'Not provided' : `${response.latencyMs} ms`}
                  </strong>
                </div>
                <div>
                  <span className="recommendations-page__eyebrow">Request ID</span>
                  <strong>{response.requestId ? response.requestId : 'Not provided'}</strong>
                </div>
                <div>
                  <span className="recommendations-page__eyebrow">Incident ID</span>
                  <strong>{response.incidentId}</strong>
                </div>
              </Card>
            </section>
          ) : (
            <Card className="recommendations-page__empty">
              <Badge variant="neutral">READY</Badge>
              <h2>No recommendation analysis yet</h2>
              <p>
                Enter the configured AI model and generate recommendations against the current
                grounded incident context.
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
