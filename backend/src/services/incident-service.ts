import type {
  CreateIncidentRequest,
  IncidentListResponse,
  IncidentResponse,
  ListIncidentsQuery,
} from '../contracts/incident';
import type { IncidentDataAccess, IncidentRecord } from '../data-access/incident-data-access';

export class IncidentService {
  constructor(private readonly incidentDataAccess: IncidentDataAccess) {}

  async getIncidentById(id: string): Promise<IncidentRecord | null> {
    return this.incidentDataAccess.findById(id);
  }

  async createIncident(input: CreateIncidentRequest): Promise<IncidentResponse> {
    const incident = await this.incidentDataAccess.create(input);

    return this.toResponse(incident);
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
