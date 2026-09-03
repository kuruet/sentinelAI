import type {
  CreateInvestigationRequest,
  InvestigationResponse,
  UpdateInvestigationRequest,
} from '../contracts/investigation';

export interface InvestigationDataAccess {
  findByIncidentId(incidentId: string): Promise<InvestigationResponse | null>;

  create(incidentId: string, input: CreateInvestigationRequest): Promise<InvestigationResponse>;

  update(
    incidentId: string,
    input: UpdateInvestigationRequest,
  ): Promise<InvestigationResponse | null>;

  deleteByIncidentId(incidentId: string): Promise<string | null>;
}
