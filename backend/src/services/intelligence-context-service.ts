import type { EvidenceDataAccess } from '../data-access/evidence-data-access';
import type { IncidentDataAccess } from '../data-access/incident-data-access';
import type { IncidentEventDataAccess } from '../data-access/incident-event-data-access';
import type { InvestigationDataAccess } from '../data-access/investigation-data-access';
import type {
  IntelligenceContext,
  IntelligenceContextMetadata,
  IntelligenceContextSnapshot,
} from '../intelligence';

export class IntelligenceContextService {
  constructor(
    private readonly incidentDataAccess: IncidentDataAccess,
    private readonly incidentEventDataAccess: IncidentEventDataAccess,
    private readonly evidenceDataAccess: EvidenceDataAccess,
    private readonly investigationDataAccess: InvestigationDataAccess,
  ) {}

  async buildContext(incidentId: string): Promise<IntelligenceContextSnapshot | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    const [events, evidence, investigation] = await Promise.all([
      this.incidentEventDataAccess.listByIncident(incidentId),
      this.evidenceDataAccess.listByIncident(incidentId),
      this.investigationDataAccess.findByIncidentId(incidentId),
    ]);

    const orderedEvents = this.orderEvents(events);
    const orderedEvidence = this.orderEvidence(evidence);

    const context: IntelligenceContext = {
      incident: this.toIncidentResponse(incident),
      events: orderedEvents,
      evidence: orderedEvidence,
      investigation,
    };

    const metadata: IntelligenceContextMetadata = {
      generatedAt: new Date().toISOString(),
      eventCount: orderedEvents.length,
      evidenceCount: orderedEvidence.length,
      hasInvestigation: investigation !== null,
    };

    return {
      context,
      metadata,
    };
  }

  private orderEvents(events: Awaited<ReturnType<IncidentEventDataAccess['listByIncident']>>) {
    return [...events].sort((left, right) => {
      const occurredAtComparison = left.occurredAt.localeCompare(right.occurredAt);

      if (occurredAtComparison !== 0) {
        return occurredAtComparison;
      }

      const sequenceComparison = left.sequence - right.sequence;

      if (sequenceComparison !== 0) {
        return sequenceComparison;
      }

      return left.id.localeCompare(right.id);
    });
  }

  private orderEvidence(evidence: Awaited<ReturnType<EvidenceDataAccess['listByIncident']>>) {
    return [...evidence].sort((left, right) => {
      if (left.occurredAt === null && right.occurredAt !== null) {
        return 1;
      }

      if (left.occurredAt !== null && right.occurredAt === null) {
        return -1;
      }

      if (left.occurredAt !== null && right.occurredAt !== null) {
        const occurredAtComparison = left.occurredAt.localeCompare(right.occurredAt);

        if (occurredAtComparison !== 0) {
          return occurredAtComparison;
        }
      }

      const createdAtComparison = left.createdAt.localeCompare(right.createdAt);

      if (createdAtComparison !== 0) {
        return createdAtComparison;
      }

      return left.id.localeCompare(right.id);
    });
  }

  private toIncidentResponse(
    incident: Awaited<ReturnType<IncidentDataAccess['findById']>> extends infer T
      ? Exclude<T, null>
      : never,
  ) {
    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      priority: incident.priority,
      startedAt: incident.startedAt?.toISOString() ?? null,
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
      closedAt: incident.closedAt?.toISOString() ?? null,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
    };
  }
}
