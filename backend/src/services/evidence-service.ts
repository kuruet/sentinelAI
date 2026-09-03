import type {
  CreateEvidenceRequest,
  EvidenceListResponse,
  EvidenceResponse,
} from '../contracts/evidence';
import type { IncidentDataAccess } from '../data-access/incident-data-access';
import type { EvidenceDataAccess } from '../data-access/evidence-data-access';

export class EvidenceService {
  constructor(
    private readonly evidenceDataAccess: EvidenceDataAccess,
    private readonly incidentDataAccess: IncidentDataAccess,
  ) {}

  async createEvidence(
    incidentId: string,
    input: CreateEvidenceRequest,
  ): Promise<EvidenceResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    return this.evidenceDataAccess.create(incidentId, input);
  }

  async listEvidence(incidentId: string): Promise<EvidenceListResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    const items = await this.evidenceDataAccess.listByIncident(incidentId);

    return { items };
  }

  async getEvidence(incidentId: string, evidenceId: string): Promise<EvidenceResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    return this.evidenceDataAccess.findByIdForIncident(incidentId, evidenceId);
  }

  async removeEvidence(incidentId: string, evidenceId: string): Promise<boolean | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    return this.evidenceDataAccess.deleteByIdForIncident(incidentId, evidenceId);
  }
}
