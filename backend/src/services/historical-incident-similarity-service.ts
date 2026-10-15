import type { IntelligenceContextSnapshot } from '../intelligence';

export interface HistoricalIncidentMatchReason {
  signal: 'CONTENT_HASH' | 'EVENT_PATTERN' | 'EVIDENCE_PATTERN' | 'INCIDENT_TEXT' | 'INVESTIGATION';
  description: string;
}

export interface HistoricalIncidentSimilarityMatch {
  incidentId: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  resolvedAt: string | null;
  similarityScore: number;
  matchReasons: HistoricalIncidentMatchReason[];
}

interface WeightedSignal {
  signal: HistoricalIncidentMatchReason['signal'];
  description: string;
  weight: number;
  similarity: number;
  comparable: boolean;
}

const SIGNAL_WEIGHTS = {
  CONTENT_HASH: 30,
  EVENT_PATTERN: 25,
  EVIDENCE_PATTERN: 20,
  INCIDENT_TEXT: 20,
  INVESTIGATION: 5,
} as const;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'was', 'were',
  'has', 'have', 'had', 'when', 'then', 'into', 'during', 'after',
  'before', 'while', 'not', 'but', 'our', 'their', 'there', 'here',
  'incident', 'error', 'failure', 'issue',
]);

export class HistoricalIncidentSimilarityService {
  /**
   * Candidates must already be filtered to incidents the requester may read.
   * This service performs no database writes and makes no AI calls.
   */
  findSimilar(
    current: IntelligenceContextSnapshot,
    candidates: IntelligenceContextSnapshot[],
    limit = 5,
  ): HistoricalIncidentSimilarityMatch[] {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(20, Math.max(1, Math.floor(limit)))
      : 5;

    const currentId = current.context.incident.id;

    return candidates
      .filter((candidate) => candidate.context.incident.id !== currentId)
      .map((candidate) => this.compare(current, candidate))
      .filter((match): match is HistoricalIncidentSimilarityMatch => match !== null)
      .sort(
        (left, right) =>
          right.similarityScore - left.similarityScore ||
          right.createdAt.localeCompare(left.createdAt) ||
          left.incidentId.localeCompare(right.incidentId),
      )
      .slice(0, safeLimit);
  }

  private compare(
    current: IntelligenceContextSnapshot,
    candidate: IntelligenceContextSnapshot,
  ): HistoricalIncidentSimilarityMatch | null {
    const left = current.context;
    const right = candidate.context;

    const currentHashes = new Set(
      left.evidence
        .map((item) => this.normalize(item.contentHash ?? ''))
        .filter(Boolean),
    );
    const candidateHashes = new Set(
      right.evidence
        .map((item) => this.normalize(item.contentHash ?? ''))
        .filter(Boolean),
    );

    const currentEvents = this.eventTokens(current);
    const candidateEvents = this.eventTokens(candidate);
    const currentEvidence = this.evidenceTokens(current);
    const candidateEvidence = this.evidenceTokens(candidate);
    const currentIncidentText = this.tokens(
      `${left.incident.title} ${left.incident.description ?? ''}`,
    );
    const candidateIncidentText = this.tokens(
      `${right.incident.title} ${right.incident.description ?? ''}`,
    );
    const currentInvestigation = this.tokens(left.investigation?.summary ?? '');
    const candidateInvestigation = this.tokens(right.investigation?.summary ?? '');

    const signals: WeightedSignal[] = [
      {
        signal: 'CONTENT_HASH',
        description: 'Shared evidence content fingerprint',
        weight: SIGNAL_WEIGHTS.CONTENT_HASH,
        similarity: this.intersectionRatio(currentHashes, candidateHashes),
        comparable: currentHashes.size > 0 && candidateHashes.size > 0,
      },
      {
        signal: 'EVENT_PATTERN',
        description: 'Overlapping event titles and descriptions',
        weight: SIGNAL_WEIGHTS.EVENT_PATTERN,
        similarity: this.jaccard(currentEvents, candidateEvents),
        comparable: currentEvents.size > 0 && candidateEvents.size > 0,
      },
      {
        signal: 'EVIDENCE_PATTERN',
        description: 'Overlapping evidence titles and descriptions',
        weight: SIGNAL_WEIGHTS.EVIDENCE_PATTERN,
        similarity: this.jaccard(currentEvidence, candidateEvidence),
        comparable: currentEvidence.size > 0 && candidateEvidence.size > 0,
      },
      {
        signal: 'INCIDENT_TEXT',
        description: 'Overlapping incident title and description terms',
        weight: SIGNAL_WEIGHTS.INCIDENT_TEXT,
        similarity: this.jaccard(currentIncidentText, candidateIncidentText),
        comparable:
          currentIncidentText.size > 0 && candidateIncidentText.size > 0,
      },
      {
        signal: 'INVESTIGATION',
        description: 'Overlapping investigation-summary terms',
        weight: SIGNAL_WEIGHTS.INVESTIGATION,
        similarity: this.jaccard(currentInvestigation, candidateInvestigation),
        comparable:
          currentInvestigation.size > 0 && candidateInvestigation.size > 0,
      },
    ];

    const comparableSignals = signals.filter((signal) => signal.comparable);
    const totalWeight = comparableSignals.reduce(
      (total, signal) => total + signal.weight,
      0,
    );

    if (totalWeight === 0) {
      return null;
    }

    const weightedSimilarity = comparableSignals.reduce(
      (total, signal) => total + signal.weight * signal.similarity,
      0,
    );

    const similarityScore = Math.round(
      (weightedSimilarity / totalWeight) * 100,
    );

    // Do not surface candidates with no overlapping signals.
    if (similarityScore === 0) {
      return null;
    }

    return {
      incidentId: right.incident.id,
      title: right.incident.title,
      status: right.incident.status,
      severity: right.incident.severity,
      createdAt: right.incident.createdAt,
      resolvedAt: right.incident.resolvedAt,
      similarityScore,
      matchReasons: comparableSignals
        .filter((signal) => signal.similarity > 0)
        .map((signal) => ({
          signal: signal.signal,
          description: signal.description,
        })),
    };
  }

  private eventTokens(snapshot: IntelligenceContextSnapshot): Set<string> {
    const result = new Set<string>();

    for (const event of snapshot.context.events) {
      for (const token of this.tokens(
        `${event.title} ${event.description ?? ''}`,
      )) {
        result.add(token);
      }
    }

    return result;
  }

  private evidenceTokens(snapshot: IntelligenceContextSnapshot): Set<string> {
    const result = new Set<string>();

    for (const evidence of snapshot.context.evidence) {
      for (const token of this.tokens(
        `${evidence.title} ${evidence.description ?? ''}`,
      )) {
        result.add(token);
      }
    }

    return result;
  }

  private tokens(value: string): Set<string> {
    return new Set(
      this.normalize(value)
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
    );
  }

  private normalize(value: string): string {
    return value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private jaccard(left: Set<string>, right: Set<string>): number {
    if (left.size === 0 || right.size === 0) {
      return 0;
    }

    let intersection = 0;

    for (const item of left) {
      if (right.has(item)) {
        intersection++;
      }
    }

    const union = left.size + right.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  private intersectionRatio(left: Set<string>, right: Set<string>): number {
    if (left.size === 0 || right.size === 0) {
      return 0;
    }

    let intersection = 0;

    for (const item of left) {
      if (right.has(item)) {
        intersection++;
      }
    }

    return intersection > 0 ? 1 : 0;
  }
}
