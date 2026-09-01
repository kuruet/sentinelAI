import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { IncidentService } from '../services/incident-service';

const incidentDataAccess = new PrismaIncidentDataAccess();

export const incidentService = new IncidentService(incidentDataAccess);
