import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { ApiRequestError, IncidentResponse, createIncident } from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

type Severity = (typeof SEVERITIES)[number];

function severityVariant(severity: Severity) {
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

export default function CreateIncidentPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [priority, setPriority] = useState('0');
  const [startedAt, setStartedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdIncident, setCreatedIncident] = useState<IncidentResponse | null>(null);

  const titleLength = title.trim().length;
  const descriptionLength = description.trim().length;

  function validate(): string | null {
    if (titleLength < 1) {
      return 'Incident title is required.';
    }

    if (titleLength > 200) {
      return 'Incident title must be at most 200 characters.';
    }

    if (descriptionLength > 5000) {
      return 'Description must be at most 5000 characters.';
    }

    const parsedPriority = Number(priority);

    if (!Number.isInteger(parsedPriority) || parsedPriority < 0 || parsedPriority > 1000) {
      return 'Priority must be an integer between 0 and 1000.';
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError('Your session is no longer available. Please sign in again.');
      return;
    }

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const incident = await createIncident(token, {
        title: title.trim(),
        description: description.trim() || null,
        severity,
        priority: Number(priority),
        startedAt: startedAt ? new Date(startedAt).toISOString() : null,
      });

      setCreatedIncident(incident);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        setError(requestError.message);
      } else {
        setError('Unable to create the incident. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (createdIncident) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Incident management</p>
            <h1>Incident created</h1>
            <p className="page-subtitle">
              The incident was created successfully and the authenticated operator was assigned as
              Incident Commander.
            </p>
          </div>
        </section>

        <Card>
          <div className="create-success">
            <div className="create-success__heading">
              <div>
                <h2>{createdIncident.title}</h2>
                <p className="muted-text">{createdIncident.id}</p>
              </div>

              <Badge variant={severityVariant(createdIncident.severity)}>
                {createdIncident.severity}
              </Badge>
            </div>

            <div className="create-success__meta">
              <span>
                <strong>Status:</strong> {createdIncident.status}
              </span>
              <span>
                <strong>Priority:</strong> {createdIncident.priority}
              </span>
            </div>

            <div className="button-row">
              <Button type="button" onClick={() => navigate('/incidents')}>
                View incidents
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreatedIncident(null);
                  setTitle('');
                  setDescription('');
                  setSeverity('MEDIUM');
                  setPriority('0');
                  setStartedAt('');
                }}
              >
                Create another
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Incident management</p>
          <h1>Create incident</h1>
          <p className="page-subtitle">
            Record a new operational incident using the controlled incident management workflow.
          </p>
        </div>
      </section>

      <Card>
        <form className="incident-form" onSubmit={handleSubmit} noValidate>
          <div className="incident-form__section">
            <div>
              <h2>Incident details</h2>
              <p className="muted-text">
                Provide the core information required to establish the incident.
              </p>
            </div>

            <label className="form-field">
              <span>
                Title <span className="required-mark">*</span>
              </span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="Describe the incident"
                autoComplete="off"
                disabled={submitting}
              />

              <small>{titleLength}/200 characters</small>
            </label>

            <label className="form-field">
              <span>Description</span>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                placeholder="Add relevant operational context"
                rows={7}
                disabled={submitting}
              />

              <small>{descriptionLength}/5000 characters</small>
            </label>
          </div>

          <div className="incident-form__section">
            <div>
              <h2>Classification</h2>
              <p className="muted-text">
                Severity and priority are persisted by the incident service.
              </p>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>
                  Severity <span className="required-mark">*</span>
                </span>

                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as Severity)}
                  disabled={submitting}
                >
                  {SEVERITIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>

                <Badge variant={severityVariant(severity)}>{severity}</Badge>
              </label>

              <label className="form-field">
                <span>Priority</span>

                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={1}
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  disabled={submitting}
                />

                <small>Integer from 0 to 1000.</small>
              </label>
            </div>
          </div>

          <div className="incident-form__section">
            <div>
              <h2>Timing</h2>
              <p className="muted-text">
                Started time is optional. Leave it empty when the incident start time is not known.
              </p>
            </div>

            <label className="form-field">
              <span>Started at</span>

              <input
                type="datetime-local"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                disabled={submitting}
              />
            </label>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <div className="incident-form__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/incidents')}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating incident…' : 'Create incident'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
