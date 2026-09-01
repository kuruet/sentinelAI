import type { FastifyInstance } from 'fastify';
import type { ApiSuccessResponse, IncidentListResponse, IncidentResponse } from '../contracts';
import { incidentService } from '../application';
import { AppError } from '../errors/app-error';
import {
  createIncidentRequestSchema,
  listIncidentsQuerySchema,
  parseRequest,
  updateIncidentRequestSchema,
} from '../validation';

export async function incidentRoutes(app: FastifyInstance) {
  app.post(
    '/api/v1/incidents',
    async (request, reply): Promise<ApiSuccessResponse<IncidentResponse>> => {
      const input = parseRequest(createIncidentRequestSchema, request.body);

      const incident = await incidentService.createIncident(input);

      reply.code(201);

      return {
        status: 'ok',
        data: incident,
      };
    },
  );

  app.patch(
    '/api/v1/incidents/:id',
    async (request): Promise<ApiSuccessResponse<IncidentResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const input = parseRequest(updateIncidentRequestSchema, request.body);

      const incident = await incidentService.updateIncident(id, input);

      if (!incident) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      return {
        status: 'ok',
        data: incident,
      };
    },
  );
  app.get(
    '/api/v1/incidents',
    async (request): Promise<ApiSuccessResponse<IncidentListResponse>> => {
      const query = parseRequest(listIncidentsQuerySchema, request.query);

      const incidents = await incidentService.listIncidents(query);

      return {
        status: 'ok',
        data: incidents,
      };
    },
  );

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
