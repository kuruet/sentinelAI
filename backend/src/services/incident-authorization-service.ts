import type { ParticipantRole } from '../generated/prisma/enums';
import type { IncidentParticipantDataAccess } from '../data-access/incident-participant-data-access';
import {
  INCIDENT_CONTRIBUTOR_ROLES,
  INCIDENT_MANAGER_ROLES,
  INCIDENT_READ_ROLES,
  requireParticipantRole,
} from '../security/authorization';

export class IncidentAuthorizationService {
  constructor(private readonly participantDataAccess: IncidentParticipantDataAccess) {}

  async requireReadAccess(incidentId: string, userId: string): Promise<void> {
    const participant = await this.participantDataAccess.findByIncidentAndUser(incidentId, userId);

    requireParticipantRole(participant?.role ?? null, INCIDENT_READ_ROLES);
  }

  async requireContributorAccess(incidentId: string, userId: string): Promise<void> {
    const participant = await this.participantDataAccess.findByIncidentAndUser(incidentId, userId);

    requireParticipantRole(participant?.role ?? null, INCIDENT_CONTRIBUTOR_ROLES);
  }

  async requireManagerAccess(incidentId: string, userId: string): Promise<void> {
    const participant = await this.participantDataAccess.findByIncidentAndUser(incidentId, userId);

    requireParticipantRole(participant?.role ?? null, INCIDENT_MANAGER_ROLES);
  }

  async getRole(incidentId: string, userId: string): Promise<ParticipantRole | null> {
    const participant = await this.participantDataAccess.findByIncidentAndUser(incidentId, userId);

    return participant?.role ?? null;
  }
}
