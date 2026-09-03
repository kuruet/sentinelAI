import type {
  CreateIncidentEventRequest,
  IncidentEventListResponse,
  IncidentEventResponse,
} from '../contracts/incident-event';
import type { IncidentDataAccess } from '../data-access/incident-data-access';
import type { IncidentEventDataAccess } from '../data-access/incident-event-data-access';

export class IncidentEventService {
  constructor(
    private readonly eventDataAccess: IncidentEventDataAccess,
    private readonly incidentDataAccess: IncidentDataAccess,
  ) {}

  async createEvent(
    incidentId: string,
    input: CreateIncidentEventRequest,
  ): Promise<IncidentEventResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    const existing = await this.eventDataAccess.findByIncidentAndSequence(
      incidentId,
      input.sequence,
    );

    if (existing) {
      throw new Error(`Incident event sequence already exists: ${input.sequence}`);
    }

    return this.eventDataAccess.create(incidentId, input);
  }

  async listEvents(incidentId: string): Promise<IncidentEventListResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    const items = await this.eventDataAccess.listByIncident(incidentId);

    return { items };
  }

  async getTimeline(incidentId: string): Promise<IncidentEventListResponse | null> {
    return this.listEvents(incidentId);
  }
}
