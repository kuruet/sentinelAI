import type {
  CreateIncidentEventRequest,
  IncidentEventResponse,
} from '../contracts/incident-event';

export interface IncidentEventDataAccess {
  findByIncidentAndSequence(
    incidentId: string,
    sequence: number,
  ): Promise<IncidentEventResponse | null>;

  create(incidentId: string, input: CreateIncidentEventRequest): Promise<IncidentEventResponse>;

  listByIncident(incidentId: string): Promise<IncidentEventResponse[]>;
}
