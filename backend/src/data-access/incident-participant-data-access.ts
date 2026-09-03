import type {
  AddIncidentParticipantRequest,
  IncidentParticipantResponse,
} from '../contracts/participant';

export interface IncidentParticipantDataAccess {
  findByIncidentAndUser(
    incidentId: string,
    userId: string,
  ): Promise<IncidentParticipantResponse | null>;

  create(
    incidentId: string,
    input: AddIncidentParticipantRequest,
  ): Promise<IncidentParticipantResponse>;

  listByIncident(incidentId: string): Promise<IncidentParticipantResponse[]>;

  deleteByIdForIncident(incidentId: string, participantId: string): Promise<boolean>;
}
