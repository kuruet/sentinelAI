import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiRequestError,
  createIncidentEvent,
  getIncident,
  getIncidentTimeline,
  IncidentEventResponse,
  IncidentEventType,
  IncidentResponse,
} from '../lib/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const EVENT_TYPES: IncidentEventType[] = [
  'ALERT',
  'LOG',
  'METRIC',
  'DEPLOYMENT',
  'CONFIGURATION_CHANGE',
  'MANUAL',
  'SYSTEM',
];

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function eventVariant(type: IncidentEventType) {
  switch (type) {
    case 'ALERT':
      return 'danger' as const;
    case 'DEPLOYMENT':
    case 'CONFIGURATION_CHANGE':
      return 'warning' as const;
    case 'SYSTEM':
      return 'success' as const;
    default:
      return 'info' as const;
  }
}

function serializeMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  return JSON.stringify(metadata, null, 2);
}

function TimelineEvent({ event }: { event: IncidentEventResponse }) {
  const [expanded, setExpanded] = useState(false);
  const metadata = serializeMetadata(event.metadata);
  const hasDetails = Boolean(event.description || event.source || metadata);
  return (
    <article className="timeline-event">
      <div className="timeline-event__marker" aria-hidden="true">
        <span />
      </div>

      <div className="timeline-event__content">
        <div className="timeline-event__header">
          <div className="timeline-event__heading">
            <div className="timeline-event__type">
              <Badge variant={eventVariant(event.eventType)}>{formatLabel(event.eventType)}</Badge>
              <span className="timeline-event__sequence">#{event.sequence}</span>
            </div>
            <h3>{event.title}</h3>
          </div>

          <time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time>
        </div>

        {event.description && <p className="timeline-event__description">{event.description}</p>}

        <div className="timeline-event__meta">
          {event.source && (
            <span>
              <strong>Source</strong>
              {event.source}
            </span>
          )}
          <span>
            <strong>Recorded</strong>
            {formatDate(event.createdAt)}
          </span>
        </div>

        {hasDetails && (
          <button
            type="button"
            className="timeline-event__toggle"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        )}

        {expanded && (
          <div className="timeline-event__details">
            {event.description && (
              <div>
                <span>Description</span>
                <p>{event.description}</p>
              </div>
            )}

            {event.source && (
              <div>
                <span>Source</span>
                <p>{event.source}</p>
              </div>
            )}

            {metadata && (
              <div>
                <span>Metadata</span>
                <pre>{metadata}</pre>
              </div>
            )}

            <div>
              <span>Event ID</span>
              <code>{event.id}</code>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function CreateEventForm({
  token,
  incidentId,
  nextSequence,
  onCreated,
}: {
  token: string;
  incidentId: string;
  nextSequence: number;
  onCreated: (event: IncidentEventResponse) => void;
}) {
  const [eventType, setEventType] = useState<IncidentEventType>('MANUAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [sequence, setSequence] = useState(String(nextSequence));
  const [metadata, setMetadata] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSequence(String(nextSequence));
  }, [nextSequence]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedSource = source.trim();
    const trimmedMetadata = metadata.trim();
    const numericSequence = Number(sequence);

    if (!trimmedTitle) {
      setError('Event title is required.');
      return;
    }

    if (!Number.isInteger(numericSequence) || numericSequence <= 0) {
      setError('Sequence must be a positive integer.');
      return;
    }

    if (!occurredAt) {
      setError('Occurred time is required.');
      return;
    }

    let parsedMetadata: Record<string, unknown> | null = null;

    if (trimmedMetadata) {
      try {
        const parsed = JSON.parse(trimmedMetadata);

        if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
          setError('Metadata must be a JSON object.');
          return;
        }

        parsedMetadata = parsed as Record<string, unknown>;
      } catch {
        setError('Metadata must contain valid JSON.');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const created = await createIncidentEvent(token, incidentId, {
        eventType,
        occurredAt: new Date(occurredAt).toISOString(),
        sequence: numericSequence,
        title: trimmedTitle,
        description: trimmedDescription || null,
        source: trimmedSource || null,
        metadata: parsedMetadata,
      });

      setTitle('');
      setDescription('');
      setSource('');
      setMetadata('');
      setEventType('MANUAL');
      onCreated(created);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 400) {
          setError(requestError.message);
        } else if (requestError.status === 401 || requestError.status === 403) {
          setError('You are not authorized to add events to this incident.');
        } else {
          setError(requestError.message);
        }
      } else {
        setError('Unable to create the event. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Card>
      <div className="timeline-panel-header">
        <div>
          <p className="eyebrow">Operational record</p>
          <h2>Add event</h2>
        </div>
        <span className="timeline-next-sequence">Next sequence {nextSequence}</span>
      </div>

      <form className="timeline-event-form" onSubmit={handleSubmit}>
        {error && (
          <div className="timeline-form-error" role="alert">
            {error}
          </div>
        )}

        <div className="timeline-form-grid">
          <label>
            <span>Event type</span>
            <select
              value={eventType}
              onChange={(event) => setEventType(event.target.value as IncidentEventType)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Sequence</span>
            <input
              type="number"
              min="1"
              step="1"
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
            />
          </label>

          <label className="timeline-form-grid__wide">
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              placeholder="Describe the event"
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
            <span>Source</span>
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Optional source"
            />
          </label>

          <label className="timeline-form-grid__wide">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Optional operational context"
            />
          </label>

          <label className="timeline-form-grid__wide">
            <span>Metadata JSON</span>
            <textarea
              value={metadata}
              onChange={(event) => setMetadata(event.target.value)}
              rows={4}
              placeholder='Optional JSON object, e.g. {"host":"api-01"}'
              spellCheck={false}
            />
          </label>
        </div>

        <div className="button-row">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding event…' : 'Add event'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [events, setEvents] = useState<IncidentEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | IncidentEventType>('ALL');

  async function loadTimeline() {
    if (!token || !id) {
      setLoading(false);
      setError('The incident could not be identified.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [incidentResult, timelineResult] = await Promise.all([
        getIncident(token, id),
        getIncidentTimeline(token, id),
      ]);

      setIncident(incidentResult);
      setEvents(timelineResult.items);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 404) {
          setError('Incident not found.');
        } else if (requestError.status === 401 || requestError.status === 403) {
          setError('You are not authorized to view this incident timeline.');
        } else {
          setError(requestError.message);
        }
      } else {
        setError('Unable to load the incident timeline. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTimeline();
  }, [id, token]);

  const filteredEvents = useMemo(
    () => (filter === 'ALL' ? events : events.filter((event) => event.eventType === filter)),
    [events, filter],
  );

  const nextSequence = useMemo(
    () => events.reduce((highest, event) => Math.max(highest, event.sequence), 0) + 1,
    [events],
  );

  function handleCreated(event: IncidentEventResponse) {
    setEvents((current) =>
      [...current, event].sort(
        (left, right) =>
          Date.parse(left.occurredAt) - Date.parse(right.occurredAt) ||
          left.sequence - right.sequence,
      ),
    );
  }

  if (loading) {
    return (
      <div className="timeline-state" role="status">
        <div className="timeline-spinner" aria-hidden="true" />
        <div>
          <strong>Loading timeline</strong>
          <p>Retrieving the chronological event stream from SentinelAI.</p>
        </div>
      </div>
    );
  }

  if (error || !incident || !id) {
    return (
      <div className="timeline-state timeline-state--error" role="alert">
        <div className="timeline-state__icon" aria-hidden="true">
          !
        </div>
        <div>
          <strong>{error || 'Timeline unavailable.'}</strong>
          <p>The incident timeline could not be loaded.</p>
          <div className="button-row">
            <Button type="button" onClick={() => navigate('/incidents')}>
              Back to incidents
            </Button>
            <Button type="button" variant="secondary" onClick={() => void loadTimeline()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="timeline-page">
      <nav className="timeline-breadcrumb" aria-label="Breadcrumb">
        <Link to="/incidents">Incidents</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/incidents/${encodeURIComponent(incident.id)}`}>{incident.title}</Link>
        <span aria-hidden="true">/</span>
        <span>Timeline</span>
      </nav>

      <section className="timeline-header">
        <div>
          <p className="eyebrow">Incident timeline</p>
          <h1>{incident.title}</h1>
          <p className="timeline-header__id">{incident.id}</p>
        </div>

        <div className="timeline-header__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/incidents/${encodeURIComponent(incident.id)}`)}
          >
            Incident overview
          </Button>
        </div>
      </section>

      <Card>
        <div className="timeline-summary">
          <div>
            <span>Total events</span>
            <strong>{events.length}</strong>
          </div>
          <div>
            <span>Visible events</span>
            <strong>{filteredEvents.length}</strong>
          </div>
          <div>
            <span>Latest event</span>
            <strong>
              {events.length > 0 ? formatDate(events[events.length - 1].occurredAt) : 'No events'}
            </strong>
          </div>
        </div>

        <div className="timeline-filters" aria-label="Filter timeline by event type">
          <button
            type="button"
            className={
              filter === 'ALL' ? 'timeline-filter timeline-filter--active' : 'timeline-filter'
            }
            onClick={() => setFilter('ALL')}
          >
            All
          </button>

          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={
                filter === type ? 'timeline-filter timeline-filter--active' : 'timeline-filter'
              }
              onClick={() => setFilter(type)}
            >
              {formatLabel(type)}
            </button>
          ))}
        </div>
      </Card>

      {filteredEvents.length === 0 ? (
        <div className="timeline-empty">
          <strong>{events.length === 0 ? 'No events recorded' : 'No matching events'}</strong>
          <p>
            {events.length === 0
              ? 'Add the first operational event to establish the incident timeline.'
              : 'Choose another event type filter to view recorded events.'}
          </p>
        </div>
      ) : (
        <section className="timeline-stream" aria-label="Incident event timeline">
          {filteredEvents.map((event) => (
            <TimelineEvent key={event.id} event={event} />
          ))}
        </section>
      )}

      <CreateEventForm
        token={token!}
        incidentId={incident.id}
        nextSequence={nextSequence}
        onCreated={handleCreated}
      />
    </div>
  );
}
