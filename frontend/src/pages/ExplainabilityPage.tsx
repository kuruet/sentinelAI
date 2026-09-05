import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthProvider';
import {
  explainIntelligenceTarget,
  getIncident,
  type IncidentResponse,
  type IntelligenceExplanation,
  type ExplainabilityTarget,
} from '../lib/api';

type LocationState = {
  target?: ExplainabilityTarget;
};

function confidenceVariant(level: IntelligenceExplanation['confidence']['level']) {
  if (level === 'HIGH') {
    return 'success' as const;
  }

  if (level === 'MEDIUM') {
    return 'warning' as const;
  }

  return 'danger' as const;
}

function formatScore(score: number | null | undefined): string {
  if (score === undefined || score === null) {
    return 'Not provided';
  }

  return `${Math.round(score * 100)}%`;
}

function ReferenceList({
  references,
}: {
  references: IntelligenceExplanation['supportingReferences'];
}) {
  if (references.length === 0) {
    return <p className="explainability-page__muted">No supporting references were supplied.</p>;
  }

  return (
    <ul className="explainability-page__references">
      {references.map((reference) => (
        <li key={`${reference.type}:${reference.id}`}>
          <div className="explainability-page__reference-header">
            <Badge variant="info">{reference.type}</Badge>
            <code>{reference.id}</code>
          </div>
          <p>{reference.reason}</p>
        </li>
      ))}
    </ul>
  );
}

export default function ExplainabilityPage() {
  const { id: incidentId } = useParams<{ id: string }>();
  const location = useLocation();
  const { token } = useAuth();

  const target = (location.state as LocationState | null)?.target;

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [response, setResponse] = useState<IntelligenceExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);
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
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Incident context could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [incidentId, token]);

  useEffect(() => {
    void loadIncident();
  }, [loadIncident]);

  const runExplanation = useCallback(async () => {
    if (!token || !incidentId || !target) {
      return;
    }

    setExplaining(true);
    setError(null);

    try {
      const result = await explainIntelligenceTarget(token, incidentId, target);
      setResponse(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Explainability could not be generated.',
      );
    } finally {
      setExplaining(false);
    }
  }, [incidentId, target, token]);

  if (!incidentId) {
    return (
      <div className="explainability-page">
        <Card className="explainability-page__error">
          <strong>Invalid incident</strong>
          <p>No incident identifier was supplied.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="explainability-page">
        <Card elevated className="explainability-page__loading">
          <strong>Loading explainability workspace</strong>
          <span>Preparing incident context.</span>
        </Card>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="explainability-page">
        <Card className="explainability-page__error">
          <strong>Incident context unavailable</strong>
          <p>{error ?? 'The requested incident could not be loaded.'}</p>
          <Button variant="secondary" onClick={() => void loadIncident()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="explainability-page">
      <header className="explainability-page__header">
        <div>
          <div className="explainability-page__eyebrow">Intelligence explainability</div>
          <h1>Explainability &amp; Confidence</h1>
          <p>
            Understand what supports an existing intelligence result and where uncertainty remains.
          </p>
        </div>

        <Link
          to={`/incidents/${encodeURIComponent(incidentId)}/intelligence`}
          className="ui-button ui-button--secondary"
        >
          Back to intelligence
        </Link>
      </header>

      <nav className="explainability-page__workspace-nav" aria-label="Intelligence workspace">
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence`}>Overview</Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/summary`}>
          Summary
        </Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/assistant`}>
          Assistant
        </Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/root-cause`}>
          Root cause
        </Link>
        <Link to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/recommendations`}>
          Recommendations
        </Link>
        <span className="explainability-page__workspace-nav-active">Explainability</span>
      </nav>

      {error && (
        <Card className="explainability-page__error">
          <strong>Explainability unavailable</strong>
          <p>{error}</p>
          {target && (
            <Button variant="secondary" onClick={() => void runExplanation()} disabled={explaining}>
              {explaining ? 'Explaining…' : 'Retry explanation'}
            </Button>
          )}
        </Card>
      )}

      <div className="explainability-page__layout">
        <aside className="explainability-page__sidebar">
          <Card>
            <div className="explainability-page__section-heading">
              <div>
                <span className="explainability-page__eyebrow">Incident</span>
                <h2>{incident.title}</h2>
              </div>
            </div>

            <dl className="explainability-page__metadata">
              <div>
                <dt>Incident ID</dt>
                <dd>{incident.id}</dd>
              </div>
              <div>
                <dt>Severity</dt>
                <dd>{incident.severity}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{incident.status}</dd>
              </div>
            </dl>
          </Card>

          <Card className="explainability-page__boundary">
            <div className="explainability-page__eyebrow">Trust boundary</div>
            <p>
              Explainability is deterministic. It evaluates the selected intelligence target and
              does not create a new AI conclusion.
            </p>
            <p>
              Confidence is an assessment supplied by the intelligence result. It is not proof of
              causation or operational correctness.
            </p>
          </Card>
        </aside>

        <main className="explainability-page__main">
          {!target ? (
            <Card elevated className="explainability-page__empty">
              <div className="explainability-page__eyebrow">No target selected</div>
              <h2>Choose an intelligence result to explain</h2>
              <p>
                Open this workspace from a root-cause hypothesis or recommendation to explain the
                exact existing result.
              </p>
              <div className="explainability-page__actions">
                <Link
                  to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/root-cause`}
                  className="ui-button ui-button--secondary"
                >
                  Open root-cause analysis
                </Link>
                <Link
                  to={`/incidents/${encodeURIComponent(incidentId)}/intelligence/recommendations`}
                  className="ui-button ui-button--secondary"
                >
                  Open recommendations
                </Link>
              </div>
            </Card>
          ) : (
            <>
              <Card elevated className="explainability-page__target">
                <div className="explainability-page__section-heading">
                  <div>
                    <span className="explainability-page__eyebrow">Selected target</span>
                    <h2>{target.type}</h2>
                  </div>
                  <Badge variant="info">{target.type}</Badge>
                </div>

                <p>
                  The explanation uses the exact intelligence object selected from the source result
                  page.
                </p>

                <Button onClick={() => void runExplanation()} disabled={explaining}>
                  {explaining ? 'Explaining…' : response ? 'Refresh explanation' : 'Explain result'}
                </Button>
              </Card>

              {response && (
                <section className="explainability-page__results">
                  <Card elevated>
                    <div className="explainability-page__result-header">
                      <div>
                        <span className="explainability-page__eyebrow">
                          Deterministic explanation
                        </span>
                        <h2>Why this result is supported</h2>
                      </div>

                      <Badge variant={confidenceVariant(response.confidence.level)}>
                        {response.confidence.level} · {formatScore(response.confidence.score)}
                      </Badge>
                    </div>

                    <div className="explainability-page__explanation">{response.explanation}</div>

                    <div className="explainability-page__confidence">
                      <span className="explainability-page__eyebrow">Confidence rationale</span>
                      <p>{response.confidence.rationale}</p>
                    </div>
                  </Card>

                  <Card>
                    <div className="explainability-page__section-heading">
                      <div>
                        <span className="explainability-page__eyebrow">Evidence linkage</span>
                        <h2>Supporting references</h2>
                      </div>
                      <span className="ui-mono ui-text-xs ui-muted">
                        {response.supportingReferences.length} reference
                        {response.supportingReferences.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <ReferenceList references={response.supportingReferences} />
                  </Card>

                  <Card>
                    <div className="explainability-page__section-heading">
                      <div>
                        <span className="explainability-page__eyebrow">Uncertainty</span>
                        <h2>What remains uncertain</h2>
                      </div>
                    </div>

                    {response.uncertainty.length === 0 ? (
                      <p className="explainability-page__muted">
                        No additional uncertainty statements were supplied.
                      </p>
                    ) : (
                      <ul className="explainability-page__uncertainty">
                        {response.uncertainty.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </Card>

                  <Card className="explainability-page__metadata-card">
                    <div className="explainability-page__section-heading">
                      <div>
                        <span className="explainability-page__eyebrow">Traceability</span>
                        <h2>Explanation metadata</h2>
                      </div>
                    </div>

                    <dl className="explainability-page__metadata">
                      <div>
                        <dt>Target type</dt>
                        <dd>{response.targetType}</dd>
                      </div>
                      <div>
                        <dt>Target ID</dt>
                        <dd>
                          <code>{response.targetId}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Confidence level</dt>
                        <dd>{response.confidence.level}</dd>
                      </div>
                      <div>
                        <dt>Confidence score</dt>
                        <dd>{formatScore(response.confidence.score)}</dd>
                      </div>
                    </dl>
                  </Card>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="explainability-page__footer">
        <span className="ui-mono ui-text-xs ui-muted">
          DETERMINISTIC EXPLAINABILITY · NO SOURCE-OF-TRUTH MODIFICATION
        </span>
        <span className="ui-muted">Incident {incident.id}</span>
      </footer>
    </div>
  );
}
