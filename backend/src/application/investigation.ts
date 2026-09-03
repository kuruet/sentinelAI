import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { PrismaInvestigationDataAccess } from '../data-access/prisma-investigation-data-access';
import { InvestigationService } from '../services/investigation-service';

const incidentDataAccess = new PrismaIncidentDataAccess();
const investigationDataAccess = new PrismaInvestigationDataAccess();

export const investigationService = new InvestigationService(
  investigationDataAccess,
  incidentDataAccess,
);
