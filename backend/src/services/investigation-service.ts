import type {
  CreateInvestigationRequest,
  InvestigationResponse,
  UpdateInvestigationRequest,
} from '../contracts/investigation';
import type { IncidentDataAccess } from '../data-access/incident-data-access';
import type { InvestigationDataAccess } from '../data-access/investigation-data-access';

export class InvestigationService {
  constructor(
    private readonly investigationDataAccess: InvestigationDataAccess,
    private readonly incidentDataAccess: IncidentDataAccess,
  ) {}

  async createInvestigation(
    incidentId: string,
    input: CreateInvestigationRequest,
  ): Promise<InvestigationResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    const existing = await this.investigationDataAccess.findByIncidentId(incidentId);

    if (existing) {
      throw new Error(`Investigation already exists for incident: ${incidentId}`);
    }

    return this.investigationDataAccess.create(incidentId, input);
  }

  async getInvestigation(incidentId: string): Promise<InvestigationResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    return this.investigationDataAccess.findByIncidentId(incidentId);
  }

  async updateInvestigation(
    incidentId: string,
    input: UpdateInvestigationRequest,
  ): Promise<InvestigationResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    return this.investigationDataAccess.update(incidentId, input);
  }

  async removeInvestigation(incidentId: string): Promise<boolean | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    return this.investigationDataAccess.deleteByIncidentId(incidentId);
  }
}
