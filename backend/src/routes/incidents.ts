import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccessResponse,
  IncidentEventListResponse,
  IncidentEventResponse,
  IncidentListResponse,
  IncidentResponse,
} from '../contracts';
import { incidentEventService, incidentParticipantService, incidentService } from '../application';
import { AppError } from '../errors/app-error';
import {
  addIncidentParticipantRequestSchema,
  createIncidentEventRequestSchema,
  createIncidentRequestSchema,
  listIncidentsQuerySchema,
  parseRequest,
  updateIncidentLifecycleRequestSchema,
  updateIncidentSeverityPriorityRequestSchema,
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
    '/api/v1/incidents/:id/severity-priority',
    async (request): Promise<ApiSuccessResponse<IncidentResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const input = parseRequest(updateIncidentSeverityPriorityRequestSchema, request.body);

      const incident = await incidentService.updateIncidentSeverityPriority(id, input);

      if (!incident) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

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

  app.patch(
    '/api/v1/incidents/:id/lifecycle',
    async (request): Promise<ApiSuccessResponse<IncidentResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const input = parseRequest(updateIncidentLifecycleRequestSchema, request.body);

      try {
        const incident = await incidentService.updateIncidentLifecycle(id, input);

        if (!incident) {
          throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
        }

        return {
          status: 'ok',
          data: incident,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith('Invalid incident lifecycle transition:')
        ) {
          throw new AppError(400, 'BAD_REQUEST', error.message);
        }

        throw error;
      }
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
  app.post(
    '/api/v1/incidents/:id/participants',
    async (
      request,
      reply,
    ): Promise<ApiSuccessResponse<import('../contracts').IncidentParticipantResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const input = parseRequest(addIncidentParticipantRequestSchema, request.body);

      try {
        const participant = await incidentParticipantService.addParticipant(id, input);

        if (!participant) {
          throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
        }

        reply.code(201);

        return {
          status: 'ok',
          data: participant,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith('Participant already exists for user:')
        ) {
          throw new AppError(400, 'BAD_REQUEST', error.message);
        }

        throw error;
      }
    },
  );

  app.get(
    '/api/v1/incidents/:id/participants',
    async (
      request,
    ): Promise<ApiSuccessResponse<import('../contracts').IncidentParticipantListResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const participants = await incidentParticipantService.listParticipants(id);

      if (!participants) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      return {
        status: 'ok',
        data: participants,
      };
    },
  );

  app.delete(
    '/api/v1/incidents/:id/participants/:participantId',
    async (request): Promise<import('../contracts').ApiMessageResponse> => {
      const { id, participantId } = request.params as {
        id?: string;
        participantId?: string;
      };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      if (!participantId || participantId.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Participant ID is required.');
      }

      const deleted = await incidentParticipantService.removeParticipant(id, participantId);

      if (deleted === null) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      if (!deleted) {
        throw new AppError(404, 'NOT_FOUND', 'Participant not found.');
      }

      return {
        status: 'ok',
        message: 'Incident participant removed.',
      };
    },
  );
  app.post(
    '/api/v1/incidents/:id/events',
    async (request, reply): Promise<ApiSuccessResponse<IncidentEventResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const input = parseRequest(createIncidentEventRequestSchema, request.body);

      try {
        const event = await incidentEventService.createEvent(id, input);

        if (!event) {
          throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
        }

        reply.code(201);

        return {
          status: 'ok',
          data: event,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith('Incident event sequence already exists:')
        ) {
          throw new AppError(400, 'BAD_REQUEST', error.message);
        }

        throw error;
      }
    },
  );

  app.get(
    '/api/v1/incidents/:id/events',
    async (request): Promise<ApiSuccessResponse<IncidentEventListResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const events = await incidentEventService.listEvents(id);

      if (!events) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      return {
        status: 'ok',
        data: events,
      };
    },
  );

  app.get(
    '/api/v1/incidents/:id/timeline',
    async (request): Promise<ApiSuccessResponse<IncidentEventListResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const timeline = await incidentEventService.getTimeline(id);

      if (!timeline) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      return {
        status: 'ok',
        data: timeline,
      };
    },
  );
}
