import type { FastifyInstance } from 'fastify';
import type { ApiSuccessResponse } from '../contracts';
import { automaticIncidentCorrelationService } from '../application/automatic-incident-correlation';
import { incidentAuthorizationService } from '../application';
import { AppError } from '../errors/app-error';
import { authenticate, getAuthenticatedIdentity } from '../security';
import { parseRequest } from '../validation';
import { z } from 'zod';

const incidentIdParamSchema = z.object({ id: z.string().uuid() }).strict();

export async function automaticCorrelationRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.get(
    '/api/v1/incidents/:id/intelligence/correlation',
    async (request, reply): Promise<ApiSuccessResponse<unknown>> => {
      const identity = getAuthenticatedIdentity(request);
      const { id: incidentId } = parseRequest(incidentIdParamSchema, request.params);

      await incidentAuthorizationService.requireReadAccess(incidentId, identity.userId);

      const result = await automaticIncidentCorrelationService.analyze(incidentId);

      if (!result) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      reply.code(200);

      return {
        status: 'ok',
        data: result,
      };
    },
  );
}
