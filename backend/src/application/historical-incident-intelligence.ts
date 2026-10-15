import { PrismaIncidentDataAccess } from '../data-access/prisma-incident-data-access';
import { HistoricalIncidentIntelligenceService } from '../services/historical-incident-intelligence-service';
import { HistoricalIncidentSimilarityService } from '../services/historical-incident-similarity-service';
import { incidentAuthorizationService } from './incident-authorization';
import { intelligenceContextService } from './intelligence-context';

const incidentDataAccess = new PrismaIncidentDataAccess();
const similarityService = new HistoricalIncidentSimilarityService();

export const historicalIncidentIntelligenceService =
  new HistoricalIncidentIntelligenceService(
    incidentDataAccess,
    incidentAuthorizationService,
    intelligenceContextService,
    similarityService,
  );
