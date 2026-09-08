import { intelligenceContextService } from './intelligence-context';
import { AutomaticIncidentCorrelationService } from '../services/automatic-incident-correlation-service';

export const automaticIncidentCorrelationService = new AutomaticIncidentCorrelationService(
  intelligenceContextService,
);
