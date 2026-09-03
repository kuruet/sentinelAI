import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { PrismaIncidentEventDataAccess } from '../data-access/prisma-incident-event-data-access';
import { IncidentEventService } from '../services/incident-event-service';

const incidentDataAccess = new PrismaIncidentDataAccess();
const eventDataAccess = new PrismaIncidentEventDataAccess();

export const incidentEventService = new IncidentEventService(eventDataAccess, incidentDataAccess);
