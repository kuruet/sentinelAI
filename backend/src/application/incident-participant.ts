import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { PrismaIncidentParticipantDataAccess } from '../data-access/prisma-incident-participant-data-access';
import { IncidentParticipantService } from '../services/incident-participant-service';

const incidentDataAccess = new PrismaIncidentDataAccess();
const participantDataAccess = new PrismaIncidentParticipantDataAccess();

export const incidentParticipantService = new IncidentParticipantService(
  participantDataAccess,
  incidentDataAccess,
);
