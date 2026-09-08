import type { FastifyInstance } from 'fastify';
import type { ApiSuccessResponse } from '../contracts';
import {
  incidentEventService,
  incidentAuthorizationService,
  auditLogService,
} from '../application';
import { AppError } from '../errors/app-error';
import { authenticate, getAuthenticatedIdentity } from '../security';
import { parseRequest } from '../validation';
import { ingestionBatchSchema } from './contracts';
import { IngestionService } from './ingestion-service';

export async function ingestionRoutes(app: FastifyInstance) {
  const ingestionService = new IngestionService(incidentEventService);

  app.addHook('onRequest', authenticate);

  app.post(
    '/api/v1/ingestion/signals',
    async (request, reply): Promise<ApiSuccessResponse<unknown>> => {
      const identity = getAuthenticatedIdentity(request);

      const input = parseRequest(ingestionBatchSchema, request.body);

      await incidentAuthorizationService.requireContributorAccess(
        input.incidentId,
        identity.userId,
      );

      const existingEvents = await incidentEventService.listEvents(input.incidentId);

      if (!existingEvents) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      const nextSequence =
        existingEvents.items.reduce((maximum, item) => Math.max(maximum, item.sequence), 0) + 1;

      const result = await ingestionService.ingest(input, nextSequence);

      if (!result) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'INGESTION_ACCEPTED',
        resourceType: 'INCIDENT',
        resourceId: input.incidentId,
        incidentId: input.incidentId,
        metadata: {
          sourceCount: input.signals.length,
          acceptedCount: result.accepted,
          sources: [...new Set(input.signals.map((signal) => signal.source))],
        },
      });

      reply.code(202);

      return {
        status: 'ok',
        data: {
          incidentId: input.incidentId,
          ...result,
        },
      };
    },
  );
}
