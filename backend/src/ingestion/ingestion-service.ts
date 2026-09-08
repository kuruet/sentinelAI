import type { IncidentEventService } from '../services/incident-event-service';
import type { IngestionBatchRequest } from './contracts';

export interface IngestionResult {
  accepted: number;
  events: Array<{
    id: string;
    sequence: number;
    eventType: string;
  }>;
}

export class IngestionService {
  constructor(private readonly incidentEventService: IncidentEventService) {}

  async ingest(
    input: IngestionBatchRequest,
    startingSequence: number,
  ): Promise<IngestionResult | null> {
    const events: IngestionResult['events'] = [];

    for (const [index, signal] of input.signals.entries()) {
      const sequence = startingSequence + index;

      const event = await this.incidentEventService.createEvent(input.incidentId, {
        eventType: signal.signalType,
        occurredAt: signal.occurredAt,
        sequence,
        title: signal.title,
        description: signal.description ?? null,
        source: signal.source,
        metadata: {
          ...(signal.metadata ?? {}),
          ingestionSource: signal.source,
          sourceRef: signal.sourceRef ?? null,
        },
      });

      if (!event) {
        return null;
      }

      events.push({
        id: event.id,
        sequence,
        eventType: signal.signalType,
      });
    }

    return {
      accepted: events.length,
      events,
    };
  }
}
