import type {
  IntelligenceContextSnapshot,
} from '../contracts/context';
import type {
  IntelligenceFinding,
} from '../contracts/finding';
import type {
  AIContextBuilderOptions,
  AIContextItem,
  AIContextItemType,
  AIContextReference,
  GroundedAIContext,
} from './ai-context';

const DEFAULT_MAX_EVENTS = 50;
const DEFAULT_MAX_EVIDENCE = 50;
const DEFAULT_MAX_FINDINGS = 25;
const DEFAULT_MAX_CONTENT_LENGTH = 4000;

function reference(
  type: AIContextItemType,
  id: string,
  reason: string,
): AIContextReference {
  return { type, id, reason };
}

function boundedContent(
  value: string | null | undefined,
  maxLength: number,
): string {
  const normalized = (value ?? '').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}\n[content truncated]`;
}

function findingItem(
  finding: IntelligenceFinding,
  maxContentLength: number,
): AIContextItem {
  return {
    type: 'FINDING',
    id: finding.id,
    content: boundedContent(
      `${finding.title}\n${finding.description}`,
      maxContentLength,
    ),
    reference: reference(
      'FINDING',
      finding.id,
      'Derived deterministic intelligence finding.',
    ),
  };
}

export class AIContextBuilder {
  private readonly options: Required<AIContextBuilderOptions>;

  constructor(options: AIContextBuilderOptions = {}) {
    this.options = {
      maxEvents: options.maxEvents ?? DEFAULT_MAX_EVENTS,
      maxEvidence: options.maxEvidence ?? DEFAULT_MAX_EVIDENCE,
      maxFindings: options.maxFindings ?? DEFAULT_MAX_FINDINGS,
      maxContentLength:
        options.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH,
    };
  }

  build(
    snapshot: IntelligenceContextSnapshot,
    findings: IntelligenceFinding[] = [],
  ): GroundedAIContext {
    const items: AIContextItem[] = [];

    const incident = snapshot.context.incident;

    items.push({
      type: 'INCIDENT',
      id: incident.id,
      content: boundedContent(
        [
          `Title: ${incident.title}`,
          `Description: ${incident.description ?? ''}`,
          `Status: ${incident.status}`,
          `Severity: ${incident.severity}`,
          `Priority: ${incident.priority}`,
          `Started At: ${incident.startedAt ?? 'unknown'}`,
        ].join('\n'),
        this.options.maxContentLength,
      ),
      reference: reference(
        'INCIDENT',
        incident.id,
        'Primary incident context.',
      ),
    });

    const events = snapshot.context.events
      .slice()
      .sort((a, b) => {
        const time =
          a.occurredAt.localeCompare(b.occurredAt);

        if (time !== 0) {
          return time;
        }

        return a.id.localeCompare(b.id);
      });

    const evidence = snapshot.context.evidence
      .slice()
      .sort((a, b) => {
        const aTime = a.occurredAt ?? a.collectedAt;
        const bTime = b.occurredAt ?? b.collectedAt;

        if (aTime === null && bTime === null) {
          return a.id.localeCompare(b.id);
        }

        if (aTime === null) {
          return 1;
        }

        if (bTime === null) {
          return -1;
        }

        const time = aTime.localeCompare(bTime);

        if (time !== 0) {
          return time;
        }

        return a.id.localeCompare(b.id);
      });

    const selectedEvents = events.slice(
      0,
      this.options.maxEvents,
    );

    const selectedEvidence = evidence.slice(
      0,
      this.options.maxEvidence,
    );

    for (const event of selectedEvents) {
      items.push({
        type: 'EVENT',
        id: event.id,
        content: boundedContent(
          [
            `Title: ${event.title}`,
            `Description: ${event.description ?? ''}`,
            `Type: ${event.eventType}`,
            `Occurred At: ${event.occurredAt}`,
            `Sequence: ${event.sequence}`,
            `Source: ${event.source ?? ''}`,
          ].join('\n'),
          this.options.maxContentLength,
        ),
        occurredAt: event.occurredAt,
        source: event.source,
        reference: reference(
          'EVENT',
          event.id,
          'Incident event selected for analysis context.',
        ),
      });
    }

    for (const item of selectedEvidence) {
      items.push({
        type: 'EVIDENCE',
        id: item.id,
        content: boundedContent(
          [
            `Title: ${item.title}`,
            `Description: ${item.description ?? ''}`,
            `Type: ${item.evidenceType}`,
            `Source: ${item.source ?? ''}`,
            `Source Reference: ${item.sourceRef ?? ''}`,
            `Occurred At: ${item.occurredAt ?? 'unknown'}`,
            `Collected At: ${item.collectedAt}`,
            `Trust Level: ${item.trustLevel}`,
            `Content Hash: ${item.contentHash ?? ''}`,
          ].join('\n'),
          this.options.maxContentLength,
        ),
        occurredAt: item.occurredAt ?? item.collectedAt,
        source: item.source,
        reference: reference(
          'EVIDENCE',
          item.id,
          'Incident evidence selected for analysis context.',
        ),
      });
    }

    if (snapshot.context.investigation) {
      const investigation = snapshot.context.investigation;

      items.push({
        type: 'INVESTIGATION',
        id: investigation.id,
        content: boundedContent(
          [
            `Summary: ${investigation.summary ?? ''}`,
            `Started At: ${investigation.startedAt}`,
            `Completed At: ${investigation.completedAt ?? 'not completed'}`,
          ].join('\n'),
          this.options.maxContentLength,
        ),
        reference: reference(
          'INVESTIGATION',
          investigation.id,
          'Current investigation context.',
        ),
      });
    }

    const selectedFindings = findings
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, this.options.maxFindings);

    for (const finding of selectedFindings) {
      items.push(findingItem(
        finding,
        this.options.maxContentLength,
      ));
    }

    const references = items
      .map((item) => item.reference)
      .sort((a, b) => {
        const type = a.type.localeCompare(b.type);

        if (type !== 0) {
          return type;
        }

        return a.id.localeCompare(b.id);
      });

    return {
      incidentId: incident.id,
      items,
      references,
      generatedAt: new Date().toISOString(),
      itemCount: items.length,
      truncated:
        events.length > selectedEvents.length ||
        evidence.length > selectedEvidence.length ||
        findings.length > selectedFindings.length,
    };
  }
}
