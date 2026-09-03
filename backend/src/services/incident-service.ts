import type {
  CreateIncidentRequest,
  IncidentListResponse,
  IncidentResponse,
  IncidentStatus,
  ListIncidentsQuery,
  UpdateIncidentLifecycleRequest,
  UpdateIncidentSeverityPriorityRequest,
  UpdateIncidentRequest,
} from '../contracts/incident';
import type { IncidentDataAccess, IncidentRecord } from '../data-access/incident-data-access';

const LIFECYCLE_TRANSITIONS: Record<IncidentStatus, IncidentStatus | null> = {
  IDENTIFIED: 'INVESTIGATING',
  INVESTIGATING: 'RESOLVED',
  RESOLVED: 'CLOSED',
  CLOSED: null,
};

export class IncidentService {
  constructor(private readonly incidentDataAccess: IncidentDataAccess) {}

  async getIncidentById(id: string): Promise<IncidentRecord | null> {
    return this.incidentDataAccess.findById(id);
  }

  async createIncident(input: CreateIncidentRequest): Promise<IncidentResponse> {
    const incident = await this.incidentDataAccess.create(input);

    return this.toResponse(incident);
  }

  async updateIncident(id: string, input: UpdateIncidentRequest): Promise<IncidentResponse | null> {
    const incident = await this.incidentDataAccess.update(id, input);

    return incident ? this.toResponse(incident) : null;
  }

  async updateIncidentSeverityPriority(
    id: string,
    input: UpdateIncidentSeverityPriorityRequest,
  ): Promise<IncidentResponse | null> {
    const incident = await this.incidentDataAccess.updateSeverityPriority(id, input);

    return incident ? this.toResponse(incident) : null;
  }
  async updateIncidentLifecycle(
    id: string,
    input: UpdateIncidentLifecycleRequest,
  ): Promise<IncidentResponse | null> {
    const incident = await this.incidentDataAccess.findById(id);

    if (!incident) {
      return null;
    }

    const expectedNextStatus = LIFECYCLE_TRANSITIONS[incident.status];

    if (expectedNextStatus !== input.status) {
      throw new Error(
        `Invalid incident lifecycle transition: ${incident.status} -> ${input.status}`,
      );
    }

    const updated = await this.incidentDataAccess.updateLifecycle(id, input);

    return updated ? this.toResponse(updated) : null;
  }

  async listIncidents(query: ListIncidentsQuery): Promise<IncidentListResponse> {
    const result = await this.incidentDataAccess.list(query);

    return {
      items: result.items.map((incident) => this.toResponse(incident)),
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  private toResponse(incident: IncidentRecord): IncidentResponse {
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
