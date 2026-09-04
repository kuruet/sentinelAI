import { PrismaEvidenceDataAccess } from '../data-access/prisma-evidence-data-access';
import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { PrismaIncidentEventDataAccess } from '../data-access/prisma-incident-event-data-access';
import { PrismaInvestigationDataAccess } from '../data-access/prisma-investigation-data-access';
import { IntelligenceContextService } from '../services/intelligence-context-service';

const incidentDataAccess = new PrismaIncidentDataAccess();
const incidentEventDataAccess = new PrismaIncidentEventDataAccess();
const evidenceDataAccess = new PrismaEvidenceDataAccess();
const investigationDataAccess = new PrismaInvestigationDataAccess();

export const intelligenceContextService = new IntelligenceContextService(
  incidentDataAccess,
  incidentEventDataAccess,
  evidenceDataAccess,
  investigationDataAccess,
);
