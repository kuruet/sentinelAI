import type { FastifyInstance } from 'fastify';
import type { ApiSuccessResponse, IncidentResponse } from '../contracts';
import { incidentService } from '../application';
import { AppError } from '../errors/app-error';

export async function incidentRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/incidents/:id',
    async (request): Promise<ApiSuccessResponse<IncidentResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const incident = await incidentService.getIncidentById(id);

      if (!incident) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      return {
        status: 'ok',
        data: {
          id: incident.id,
          title: incident.title,
          description: incident.description,
          status: incident.status,
          severity: incident.severity,
          priority: incident.priority,
          startedAt: incident.startedAt?.toISOString() ?? null,
          resolvedAt: incident.resolvedAt?.toISOString() ?? null,
          closedAt: incident.closedAt?.toISOString() ?? null,
          createdAt: incident.createdAt.toISOString(),
          updatedAt: incident.updatedAt.toISOString(),
        },
      };
    },
  );
}
