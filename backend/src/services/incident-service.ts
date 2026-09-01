import type { CreateIncidentRequest, IncidentResponse } from '../contracts/incident';
import type { IncidentDataAccess, IncidentRecord } from '../data-access/incident-data-access';

export class IncidentService {
  constructor(private readonly incidentDataAccess: IncidentDataAccess) {}

  async getIncidentById(id: string): Promise<IncidentRecord | null> {
    return this.incidentDataAccess.findById(id);
  }

  async createIncident(input: CreateIncidentRequest): Promise<IncidentResponse> {
    const incident = await this.incidentDataAccess.create(input);

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
