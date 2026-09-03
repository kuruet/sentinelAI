import { PrismaIncidentParticipantDataAccess } from '../data-access/prisma-incident-participant-data-access';
import { IncidentAuthorizationService } from '../services/incident-authorization-service';

const participantDataAccess = new PrismaIncidentParticipantDataAccess();

export const incidentAuthorizationService = new IncidentAuthorizationService(participantDataAccess);
