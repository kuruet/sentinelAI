import type { CreateEvidenceRequest, EvidenceResponse } from '../contracts/evidence';

export interface EvidenceDataAccess {
  findByIdForIncident(incidentId: string, evidenceId: string): Promise<EvidenceResponse | null>;

  create(incidentId: string, input: CreateEvidenceRequest): Promise<EvidenceResponse>;

  listByIncident(incidentId: string): Promise<EvidenceResponse[]>;

  deleteByIdForIncident(incidentId: string, evidenceId: string): Promise<boolean>;
}
