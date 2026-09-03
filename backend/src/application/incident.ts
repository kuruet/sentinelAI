import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { PrismaIncidentParticipantDataAccess } from '../data-access/prisma-incident-participant-data-access';
import { IncidentService } from '../services/incident-service';

const incidentDataAccess = new PrismaIncidentDataAccess();
const participantDataAccess = new PrismaIncidentParticipantDataAccess();

export const incidentService = new IncidentService(incidentDataAccess, participantDataAccess);
