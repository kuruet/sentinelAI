import { createHash } from 'node:crypto';

import type { EvidenceResponse, IncidentEventResponse } from '../contracts';

import type { IntelligenceContextSnapshot, IntelligenceCorrelation } from '../intelligence';

const DEFAULT_TEMPORAL_WINDOW_MS = 5 * 60 * 1000;

interface CorrelationCandidate {
  type: IntelligenceCorrelation['type'];
  title: string;
  description: string;
  confidence: IntelligenceCorrelation['confidence'];
  references: IntelligenceCorrelation['references'];
  occurredAt: string | null;
}

function stableId(
  type: IntelligenceCorrelation['type'],
  firstId: string,
  secondId: string,
): string {
  const input = `${type}:${firstId}:${secondId}`;

  return `correlation-${createHash('sha256').update(input).digest('hex').slice(0, 24)}`;
}

function timestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? null : parsed;
}

function sourceMatches(
  first: { source: string | null },
  second: { source: string | null },
): boolean {
  if (!first.source || !second.source) {
    return false;
  }

  return first.source.trim().toLowerCase() === second.source.trim().toLowerCase();
}

function temporalDistance(
  first: string | null | undefined,
  second: string | null | undefined,
): number | null {
  const firstTimestamp = timestamp(first);
  const secondTimestamp = timestamp(second);

  if (firstTimestamp === null || secondTimestamp === null) {
    return null;
  }

  return Math.abs(firstTimestamp - secondTimestamp);
}

function temporalOccurredAt(
  first: string | null | undefined,
  second: string | null | undefined,
): string | null {
  const firstTimestamp = timestamp(first);
  const secondTimestamp = timestamp(second);

  if (firstTimestamp === null && secondTimestamp === null) {
    return null;
  }

  if (firstTimestamp === null) {
    return second ?? null;
  }

  if (secondTimestamp === null) {
    return first ?? null;
  }

  return firstTimestamp <= secondTimestamp ? (first ?? null) : (second ?? null);
}

function eventReference(event: IncidentEventResponse, reason: string) {
  return {
    type: 'EVENT' as const,
    id: event.id,
    reason,
  };
}

function evidenceReference(evidence: EvidenceResponse, reason: string) {
  return {
    type: 'EVIDENCE' as const,
    id: evidence.id,
    reason,
  };
}

function buildEventEventCandidate(
  first: IncidentEventResponse,
  second: IncidentEventResponse,
  temporalWindowMs: number,
): CorrelationCandidate | null {
  const distance = temporalDistance(first.occurredAt, second.occurredAt);
  const sharedSource = sourceMatches(first, second);

  const temporallyRelated = distance !== null && distance <= temporalWindowMs;

  if (!temporallyRelated && !sharedSource) {
    return null;
  }

  const references = [
    eventReference(
      first,
      temporallyRelated
        ? 'Event is temporally related to the correlated event.'
        : 'Event shares a source with the correlated event.',
    ),
    eventReference(
      second,
      temporallyRelated
        ? 'Event is temporally related to the correlated event.'
        : 'Event shares a source with the correlated event.',
    ),
  ];

  if (temporallyRelated && sharedSource) {
    return {
      type: 'TEMPORAL',
      title: 'Events are temporally and source related',
      description:
        `Events "${first.id}" and "${second.id}" occurred within the configured ` +
        `correlation window and share source "${first.source}". This indicates ` +
        'a deterministic correlation, not causation.',
      confidence: 'HIGH',
      references,
      occurredAt: temporalOccurredAt(first.occurredAt, second.occurredAt),
    };
  }

  if (temporallyRelated) {
    return {
      type: 'TEMPORAL',
      title: 'Events are temporally related',
      description:
        `Events "${first.id}" and "${second.id}" occurred within the configured ` +
        'correlation window. This indicates temporal correlation, not causation.',
      confidence: 'MEDIUM',
      references,
      occurredAt: temporalOccurredAt(first.occurredAt, second.occurredAt),
    };
  }

  return {
    type: 'SHARED_SOURCE',
    title: 'Events share a common source',
    description:
      `Events "${first.id}" and "${second.id}" originate from the same source ` +
      `"${first.source}". This indicates source correlation, not causation.`,
    confidence: 'LOW',
    references,
    occurredAt: temporalOccurredAt(first.occurredAt, second.occurredAt),
  };
}

function buildEventEvidenceCandidate(
  event: IncidentEventResponse,
  evidence: EvidenceResponse,
  temporalWindowMs: number,
): CorrelationCandidate | null {
  const distance = temporalDistance(event.occurredAt, evidence.occurredAt);
  const sharedSource = sourceMatches(event, evidence);

  const temporallyRelated = distance !== null && distance <= temporalWindowMs;

  if (!temporallyRelated && !sharedSource) {
    return null;
  }

  const references = [
    eventReference(
      event,
      temporallyRelated
        ? 'Event occurred near the observed evidence timestamp.'
        : 'Event shares a source with the evidence.',
    ),
    evidenceReference(
      evidence,
      temporallyRelated
        ? 'Evidence was observed near the event timestamp.'
        : 'Evidence shares a source with the event.',
    ),
  ];

  if (temporallyRelated && sharedSource) {
    return {
      type: 'EVENT_EVIDENCE',
      title: 'Event and evidence are temporally and source related',
      description:
        `Event "${event.id}" and evidence "${evidence.id}" are within the ` +
        'configured correlation window and share a source. This indicates a ' +
        'deterministic relationship, not causation.',
      confidence: 'HIGH',
      references,
      occurredAt: temporalOccurredAt(event.occurredAt, evidence.occurredAt),
    };
  }

  if (temporallyRelated) {
    return {
      type: 'EVENT_EVIDENCE',
      title: 'Event and evidence are temporally related',
      description:
        `Event "${event.id}" and evidence "${evidence.id}" occur within the ` +
        'configured correlation window. This indicates temporal correlation, ' +
        'not causation.',
      confidence: 'MEDIUM',
      references,
      occurredAt: temporalOccurredAt(event.occurredAt, evidence.occurredAt),
    };
  }

  return {
    type: 'EVENT_EVIDENCE',
    title: 'Event and evidence share a common source',
    description:
      `Event "${event.id}" and evidence "${evidence.id}" originate from the ` +
      `same source "${event.source}". This indicates source correlation, ` +
      'not causation.',
    confidence: 'LOW',
    references,
    occurredAt: temporalOccurredAt(event.occurredAt, evidence.occurredAt),
  };
}

function toCorrelation(
  candidate: CorrelationCandidate,
  firstId: string,
  secondId: string,
): IntelligenceCorrelation {
  return {
    id: stableId(candidate.type, firstId, secondId),
    type: candidate.type,
    title: candidate.title,
    description: candidate.description,
    confidence: candidate.confidence,
    references: candidate.references,
    occurredAt: candidate.occurredAt,
  };
}

export class EventEvidenceCorrelationService {
  constructor(private readonly temporalWindowMs: number = DEFAULT_TEMPORAL_WINDOW_MS) {
    if (!Number.isFinite(temporalWindowMs) || temporalWindowMs < 0) {
      throw new Error('Correlation temporal window must be a finite non-negative number.');
    }
  }

  correlate(snapshot: IntelligenceContextSnapshot): IntelligenceCorrelation[] {
    const events = [...snapshot.context.events].sort((a, b) => {
      const timeDifference = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return a.id.localeCompare(b.id);
    });

    const evidence = [...snapshot.context.evidence].sort((a, b) => {
      const aTime = timestamp(a.occurredAt);
      const bTime = timestamp(b.occurredAt);

      if (aTime === null && bTime !== null) {
        return 1;
      }

      if (aTime !== null && bTime === null) {
        return -1;
      }

      if (aTime !== null && bTime !== null && aTime !== bTime) {
        return aTime - bTime;
      }

      const createdDifference = Date.parse(a.createdAt) - Date.parse(b.createdAt);

      if (createdDifference !== 0) {
        return createdDifference;
      }

      return a.id.localeCompare(b.id);
    });

    const correlations: IntelligenceCorrelation[] = [];

    for (let firstIndex = 0; firstIndex < events.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < events.length; secondIndex += 1) {
        const first = events[firstIndex];
        const second = events[secondIndex];

        const candidate = buildEventEventCandidate(first, second, this.temporalWindowMs);

        if (candidate) {
          correlations.push(toCorrelation(candidate, first.id, second.id));
        }
      }
    }

    for (const event of events) {
      for (const evidenceItem of evidence) {
        const candidate = buildEventEvidenceCandidate(event, evidenceItem, this.temporalWindowMs);

        if (candidate) {
          correlations.push(toCorrelation(candidate, event.id, evidenceItem.id));
        }
      }
    }

    return correlations.sort((a, b) => {
      const aTime = timestamp(a.occurredAt);
      const bTime = timestamp(b.occurredAt);

      if (aTime === null && bTime !== null) {
        return 1;
      }

      if (aTime !== null && bTime === null) {
        return -1;
      }

      if (aTime !== null && bTime !== null && aTime !== bTime) {
        return aTime - bTime;
      }

      return a.id.localeCompare(b.id);
    });
  }
}
