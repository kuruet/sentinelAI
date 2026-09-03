import { prisma } from '../infrastructure/database';
import type { InputJsonValue } from '../generated/prisma/internal/prismaNamespace';
import type {
  CreateIncidentEventRequest,
  IncidentEventResponse,
} from '../contracts/incident-event';
import type { IncidentEventDataAccess } from './incident-event-data-access';

export class PrismaIncidentEventDataAccess implements IncidentEventDataAccess {
  async findByIncidentAndSequence(
    incidentId: string,
    sequence: number,
  ): Promise<IncidentEventResponse | null> {
    const event = await prisma.incidentEvent.findUnique({
      where: {
        incidentId_sequence: {
          incidentId,
          sequence,
        },
      },
    });

    return event ? this.toResponse(event) : null;
  }

  async create(
    incidentId: string,
    input: CreateIncidentEventRequest,
  ): Promise<IncidentEventResponse> {
    const event = await prisma.incidentEvent.create({
      data: {
        incidentId,
        eventType: input.eventType,
        occurredAt: new Date(input.occurredAt),
        sequence: input.sequence,
        title: input.title,
        description: input.description ?? null,
        source: input.source ?? null,
        ...(input.metadata == null
          ? {}
          : {
              metadata: input.metadata as InputJsonValue,
            }),
      },
    });

    return this.toResponse(event);
  }

  async listByIncident(incidentId: string): Promise<IncidentEventResponse[]> {
    const events = await prisma.incidentEvent.findMany({
      where: {
        incidentId,
      },
      orderBy: [
        {
          occurredAt: 'asc',
        },
        {
          sequence: 'asc',
        },
      ],
    });

    return events.map((event) => this.toResponse(event));
  }

  private toResponse(event: {
    id: string;
    incidentId: string;
    eventType:
      'ALERT' | 'LOG' | 'METRIC' | 'DEPLOYMENT' | 'CONFIGURATION_CHANGE' | 'MANUAL' | 'SYSTEM';
    occurredAt: Date;
    sequence: number;
    title: string;
    description: string | null;
    source: string | null;
    metadata: unknown;
    createdAt: Date;
  }): IncidentEventResponse {
    return {
      id: event.id,
      incidentId: event.incidentId,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      sequence: event.sequence,
      title: event.title,
      description: event.description,
      source: event.source,
      metadata:
        event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
          ? (event.metadata as Record<string, unknown>)
          : null,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
