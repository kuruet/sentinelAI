import { createHash } from 'node:crypto';

import type { IncidentEventResponse, EvidenceResponse } from '../contracts';

import type {
  DeterministicAnalysisResult,
  DeterministicSignal,
  IntelligenceContextSnapshot,
  IntelligenceFinding,
  IntelligenceCorrelation,
} from '../intelligence';

const BURST_WINDOW_MS = 5 * 60 * 1000;
const BURST_EVENT_COUNT = 3;
const REPEATED_EVENT_TYPE_COUNT = 3;
const SOURCE_CONCENTRATION_RATIO = 0.75;
const EVIDENCE_CLUSTER_COUNT = 3;
const CORRELATION_DENSITY_COUNT = 3;

function timestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? null : parsed;
}

function stableFindingId(signalType: string, referenceIds: string[]): string {
  const normalized = [...referenceIds].sort().join('|');

  return `finding-${createHash('sha256')
    .update(`${signalType}:${normalized}`)
    .digest('hex')
    .slice(0, 24)}`;
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

function toFinding(signal: DeterministicSignal): IntelligenceFinding {
  const signalType = signal.type;

  return {
    id: stableFindingId(
      signalType,
      signal.references.map((reference) => reference.id),
    ),
    type: 'ANOMALY',
    title: signal.title,
    description: signal.description,
    confidence: {
      level: signal.confidence,
      rationale:
        'Confidence is derived deterministically from the strength and quantity of observed signals.',
    },
    references: signal.references,
  };
}

function detectTemporalBursts(events: IncidentEventResponse[]): DeterministicSignal[] {
  const sorted = [...events]
    .filter((event) => timestamp(event.occurredAt) !== null)
    .sort((a, b) => (timestamp(a.occurredAt) ?? 0) - (timestamp(b.occurredAt) ?? 0));

  const signals: DeterministicSignal[] = [];

  for (let start = 0; start < sorted.length; start += 1) {
    const startTime = timestamp(sorted[start].occurredAt);

    if (startTime === null) {
      continue;
    }

    const windowEvents: IncidentEventResponse[] = [];

    for (let index = start; index < sorted.length; index += 1) {
      const currentTime = timestamp(sorted[index].occurredAt);

      if (currentTime !== null && currentTime - startTime <= BURST_WINDOW_MS) {
        windowEvents.push(sorted[index]);
      } else {
        break;
      }
    }

    if (windowEvents.length < BURST_EVENT_COUNT) {
      continue;
    }

    const references = windowEvents.map((event) =>
      eventReference(event, 'Event participates in a deterministic high-density temporal window.'),
    );

    signals.push({
      type: 'TEMPORAL_BURST',
      title: 'Event burst detected',
      description:
        `${windowEvents.length} events occurred within a five-minute window. ` +
        'This is a deterministic temporal anomaly and does not establish causation.',
      confidence: windowEvents.length >= BURST_EVENT_COUNT + 2 ? 'HIGH' : 'MEDIUM',
      references,
    });

    break;
  }

  return signals;
}

function detectRepeatedEventTypes(events: IncidentEventResponse[]): DeterministicSignal[] {
  const counts = new Map<string, IncidentEventResponse[]>();

  for (const event of events) {
    const existing = counts.get(event.eventType) ?? [];
    existing.push(event);
    counts.set(event.eventType, existing);
  }

  const signals: DeterministicSignal[] = [];

  for (const [eventType, matchingEvents] of counts.entries()) {
    if (matchingEvents.length < REPEATED_EVENT_TYPE_COUNT) {
      continue;
    }

    signals.push({
      type: 'REPEATED_EVENT_TYPE',
      title: `Repeated ${eventType} events detected`,
      description:
        `${matchingEvents.length} events of type ${eventType} were recorded. ` +
        'The repetition is an observable signal requiring investigation.',
      confidence: matchingEvents.length >= REPEATED_EVENT_TYPE_COUNT + 2 ? 'HIGH' : 'MEDIUM',
      references: matchingEvents.map((event) =>
        eventReference(
          event,
          `Event is one of ${matchingEvents.length} repeated ${eventType} events.`,
        ),
      ),
    });
  }

  return signals;
}

function detectSourceConcentration(events: IncidentEventResponse[]): DeterministicSignal[] {
  if (events.length < 3) {
    return [];
  }

  const counts = new Map<string, IncidentEventResponse[]>();

  for (const event of events) {
    if (!event.source) {
      continue;
    }

    const key = event.source.trim().toLowerCase();
    const existing = counts.get(key) ?? [];
    existing.push(event);
    counts.set(key, existing);
  }

  const signals: DeterministicSignal[] = [];

  for (const [source, matchingEvents] of counts.entries()) {
    const ratio = matchingEvents.length / events.length;

    if (ratio < SOURCE_CONCENTRATION_RATIO) {
      continue;
    }

    signals.push({
      type: 'SOURCE_CONCENTRATION',
      title: 'Event source concentration detected',
      description:
        `${matchingEvents.length} of ${events.length} events (${Math.round(
          ratio * 100,
        )}%) originate from source "${source}". ` +
        'The concentration is an observable signal, not a causal conclusion.',
      confidence: ratio >= 0.9 ? 'HIGH' : 'MEDIUM',
      references: matchingEvents.map((event) =>
        eventReference(event, 'Event contributes to the detected source concentration.'),
      ),
    });
  }

  return signals;
}

function detectEvidenceClusters(evidence: EvidenceResponse[]): DeterministicSignal[] {
  const timestamped = evidence
    .filter((item) => timestamp(item.occurredAt) !== null)
    .sort((a, b) => (timestamp(a.occurredAt) ?? 0) - (timestamp(b.occurredAt) ?? 0));

  if (timestamped.length < EVIDENCE_CLUSTER_COUNT) {
    return [];
  }

  const signals: DeterministicSignal[] = [];

  for (let start = 0; start < timestamped.length; start += 1) {
    const startTime = timestamp(timestamped[start].occurredAt);

    if (startTime === null) {
      continue;
    }

    const cluster: EvidenceResponse[] = [];

    for (let index = start; index < timestamped.length; index += 1) {
      const currentTime = timestamp(timestamped[index].occurredAt);

      if (currentTime !== null && currentTime - startTime <= BURST_WINDOW_MS) {
        cluster.push(timestamped[index]);
      } else {
        break;
      }
    }

    if (cluster.length < EVIDENCE_CLUSTER_COUNT) {
      continue;
    }

    signals.push({
      type: 'EVIDENCE_CLUSTER',
      title: 'Evidence cluster detected',
      description:
        `${cluster.length} evidence items share a five-minute temporal window. ` +
        'The cluster indicates concentrated observations and requires contextual investigation.',
      confidence: cluster.length >= 5 ? 'HIGH' : 'MEDIUM',
      references: cluster.map((item) =>
        evidenceReference(item, 'Evidence participates in the detected temporal cluster.'),
      ),
    });

    break;
  }

  return signals;
}

function detectCorrelationDensity(correlations: IntelligenceCorrelation[]): DeterministicSignal[] {
  if (correlations.length < CORRELATION_DENSITY_COUNT) {
    return [];
  }

  const references = correlations.flatMap((correlation) => correlation.references);

  const uniqueReferences = new Map(
    references.map((reference) => [`${reference.type}:${reference.id}`, reference]),
  );

  return [
    {
      type: 'CORRELATION_DENSITY',
      title: 'High correlation density detected',
      description:
        `${correlations.length} deterministic correlations were identified ` +
        'within the incident context. This indicates a dense relationship pattern ' +
        'and does not establish causation.',
      confidence: correlations.length >= CORRELATION_DENSITY_COUNT + 3 ? 'HIGH' : 'MEDIUM',
      references: [...uniqueReferences.values()],
    },
  ];
}

export class DeterministicSignalAnalysisService {
  analyze(
    snapshot: IntelligenceContextSnapshot,
    correlations: IntelligenceCorrelation[] = [],
  ): DeterministicAnalysisResult {
    const events = [...snapshot.context.events];
    const evidence = [...snapshot.context.evidence];

    const signals = [
      ...detectTemporalBursts(events),
      ...detectRepeatedEventTypes(events),
      ...detectSourceConcentration(events),
      ...detectEvidenceClusters(evidence),
      ...detectCorrelationDensity(correlations),
    ];

    const findings = signals.map(toFinding).sort((a, b) => a.id.localeCompare(b.id));

    return {
      findings,
    };
  }
}
