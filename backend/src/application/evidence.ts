import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { PrismaEvidenceDataAccess } from '../data-access/prisma-evidence-data-access';
import { EvidenceService } from '../services/evidence-service';

const incidentDataAccess = new PrismaIncidentDataAccess();
const evidenceDataAccess = new PrismaEvidenceDataAccess();

export const evidenceService = new EvidenceService(evidenceDataAccess, incidentDataAccess);
