import type {
  AddIncidentParticipantRequest,
  IncidentParticipantListResponse,
  IncidentParticipantResponse,
} from '../contracts/participant';
import type { IncidentParticipantDataAccess } from '../data-access/incident-participant-data-access';
import type { IncidentDataAccess } from '../data-access/incident-data-access';

export class IncidentParticipantService {
  constructor(
    private readonly participantDataAccess: IncidentParticipantDataAccess,
    private readonly incidentDataAccess: IncidentDataAccess,
  ) {}

  async addParticipant(
    incidentId: string,
    input: AddIncidentParticipantRequest,
  ): Promise<IncidentParticipantResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    const existing = await this.participantDataAccess.findByIncidentAndUser(
      incidentId,
      input.userId,
    );

    if (existing) {
      throw new Error(`Participant already exists for user: ${input.userId}`);
    }

    return this.participantDataAccess.create(incidentId, input);
  }

  async listParticipants(incidentId: string): Promise<IncidentParticipantListResponse | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    const items = await this.participantDataAccess.listByIncident(incidentId);

    return { items };
  }

  async removeParticipant(incidentId: string, participantId: string): Promise<boolean | null> {
    const incident = await this.incidentDataAccess.findById(incidentId);

    if (!incident) {
      return null;
    }

    return this.participantDataAccess.deleteByIdForIncident(incidentId, participantId);
  }
}
