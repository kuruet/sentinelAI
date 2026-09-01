import type { IncidentDataAccess, IncidentRecord } from '../data-access/incident-data-access';

export class IncidentService {
  constructor(private readonly incidentDataAccess: IncidentDataAccess) {}

  async getIncidentById(id: string): Promise<IncidentRecord | null> {
    return this.incidentDataAccess.findById(id);
  }
}
