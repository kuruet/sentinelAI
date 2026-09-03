import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccessResponse,
  AuditLogListResponse,
  EvidenceListResponse,
  EvidenceResponse,
  IncidentEventListResponse,
  InvestigationResponse,
  IncidentEventResponse,
  IncidentListResponse,
  IncidentResponse,
} from '../contracts';
import {
  evidenceService,
  incidentEventService,
  investigationService,
  incidentAuthorizationService,
  incidentParticipantService,
  incidentService,
  auditLogService,
} from '../application';
import { AppError } from '../errors/app-error';
import { authenticate, getAuthenticatedIdentity } from '../security';
import {
  createEvidenceRequestSchema,
  createInvestigationRequestSchema,
  updateInvestigationRequestSchema,
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
  app.addHook('onRequest', authenticate);
  app.post(
    '/api/v1/incidents',
    async (request, reply): Promise<ApiSuccessResponse<IncidentResponse>> => {
      const input = parseRequest(createIncidentRequestSchema, request.body);

      const identity = getAuthenticatedIdentity(request);

      const incident = await incidentService.createIncident(input, identity.userId);

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'INCIDENT_CREATED',
        resourceType: 'INCIDENT',
        resourceId: incident.id,
        incidentId: incident.id,
      });

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireManagerAccess(id, identity.userId);

      const input = parseRequest(updateIncidentSeverityPriorityRequestSchema, request.body);

      const incident = await incidentService.updateIncidentSeverityPriority(id, input);

      if (!incident) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'INCIDENT_SEVERITY_PRIORITY_UPDATED',
        resourceType: 'INCIDENT',
        resourceId: id,
        incidentId: id,
        metadata: input,
      });

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireManagerAccess(id, identity.userId);

      const input = parseRequest(updateIncidentRequestSchema, request.body);

      const incident = await incidentService.updateIncident(id, input);

      if (!incident) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'INCIDENT_UPDATED',
        resourceType: 'INCIDENT',
        resourceId: id,
        incidentId: id,
        metadata: input,
      });

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireManagerAccess(id, identity.userId);

      const input = parseRequest(updateIncidentLifecycleRequestSchema, request.body);

      try {
        const incident = await incidentService.updateIncidentLifecycle(id, input);

        if (!incident) {
          throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
        }

        await auditLogService.record({
          actorUserId: identity.userId,
          action: 'INCIDENT_LIFECYCLE_UPDATED',
          resourceType: 'INCIDENT',
          resourceId: id,
          incidentId: id,
          metadata: input,
        });

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

      const identity = getAuthenticatedIdentity(request);

      const incidents = await incidentService.listIncidents(query, identity.userId);

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireManagerAccess(id, identity.userId);

      const input = parseRequest(addIncidentParticipantRequestSchema, request.body);

      try {
        const participant = await incidentParticipantService.addParticipant(id, input);

        if (!participant) {
          throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
        }

        await auditLogService.record({
          actorUserId: identity.userId,
          action: 'PARTICIPANT_ADDED',
          resourceType: 'INCIDENT_PARTICIPANT',
          resourceId: participant.id,
          incidentId: id,
          metadata: { userId: participant.userId, role: participant.role },
        });

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireManagerAccess(id, identity.userId);

      const deleted = await incidentParticipantService.removeParticipant(id, participantId);

      if (deleted === null) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      if (!deleted) {
        throw new AppError(404, 'NOT_FOUND', 'Participant not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'PARTICIPANT_REMOVED',
        resourceType: 'INCIDENT_PARTICIPANT',
        resourceId: participantId,
        incidentId: id,
      });

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireContributorAccess(id, identity.userId);

      const input = parseRequest(createIncidentEventRequestSchema, request.body);

      try {
        const event = await incidentEventService.createEvent(id, input);

        if (!event) {
          throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
        }

        await auditLogService.record({
          actorUserId: identity.userId,
          action: 'EVENT_CREATED',
          resourceType: 'INCIDENT_EVENT',
          resourceId: event.id,
          incidentId: id,
          metadata: { eventType: event.eventType, sequence: event.sequence },
        });

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
    '/api/v1/incidents/:id/audit',
    async (request, reply): Promise<ApiSuccessResponse<AuditLogListResponse>> => {
      const { id } = request.params as { id: string };
      const identity = getAuthenticatedIdentity(request);

      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

      const entries = await auditLogService.listByIncident(id);

      return reply.send({
        data: {
          items: entries.map((entry) => ({
            id: entry.id,
            actorUserId: entry.actorUserId,
            action: entry.action,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
            incidentId: entry.incidentId,
            metadata: entry.metadata,
            createdAt: entry.createdAt.toISOString(),
          })),
        },
      });
    },
  );

  app.get(
    '/api/v1/incidents/:id/events',
    async (request): Promise<ApiSuccessResponse<IncidentEventListResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

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

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

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
  app.post(
    '/api/v1/incidents/:id/evidence',
    async (request, reply): Promise<ApiSuccessResponse<EvidenceResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireContributorAccess(id, identity.userId);

      const input = parseRequest(createEvidenceRequestSchema, request.body);
      const evidence = await evidenceService.createEvidence(id, input);

      if (!evidence) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'EVIDENCE_CREATED',
        resourceType: 'EVIDENCE',
        resourceId: evidence.id,
        incidentId: id,
        metadata: { evidenceType: evidence.evidenceType, source: evidence.source },
      });

      reply.code(201);

      return {
        status: 'ok',
        data: evidence,
      };
    },
  );

  app.get(
    '/api/v1/incidents/:id/evidence',
    async (request): Promise<ApiSuccessResponse<EvidenceListResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

      const evidence = await evidenceService.listEvidence(id);

      if (!evidence) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      return {
        status: 'ok',
        data: evidence,
      };
    },
  );

  app.get(
    '/api/v1/incidents/:id/evidence/:evidenceId',
    async (request): Promise<ApiSuccessResponse<EvidenceResponse>> => {
      const { id, evidenceId } = request.params as {
        id?: string;
        evidenceId?: string;
      };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      if (!evidenceId || evidenceId.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Evidence ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

      const evidence = await evidenceService.getEvidence(id, evidenceId);

      if (!evidence) {
        throw new AppError(404, 'NOT_FOUND', 'Evidence not found.');
      }

      return {
        status: 'ok',
        data: evidence,
      };
    },
  );

  app.delete(
    '/api/v1/incidents/:id/evidence/:evidenceId',
    async (request): Promise<ApiSuccessResponse<{ message: string }>> => {
      const { id, evidenceId } = request.params as {
        id?: string;
        evidenceId?: string;
      };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      if (!evidenceId || evidenceId.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Evidence ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireManagerAccess(id, identity.userId);

      const removed = await evidenceService.removeEvidence(id, evidenceId);

      if (removed === null) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      if (!removed) {
        throw new AppError(404, 'NOT_FOUND', 'Evidence not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'EVIDENCE_DELETED',
        resourceType: 'EVIDENCE',
        resourceId: evidenceId,
        incidentId: id,
      });

      return {
        status: 'ok',
        data: {
          message: 'Evidence deleted successfully.',
        },
      };
    },
  );
  app.post(
    '/api/v1/incidents/:id/investigation',
    async (request, reply): Promise<ApiSuccessResponse<InvestigationResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireContributorAccess(id, identity.userId);

      const input = parseRequest(createInvestigationRequestSchema, request.body);

      try {
        const investigation = await investigationService.createInvestigation(id, input);

        if (!investigation) {
          throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
        }

        await auditLogService.record({
          actorUserId: identity.userId,
          action: 'INVESTIGATION_CREATED',
          resourceType: 'INVESTIGATION',
          resourceId: investigation.id,
          incidentId: id,
        });

        reply.code(201);

        return {
          status: 'ok',
          data: investigation,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith('Investigation already exists for incident:')
        ) {
          throw new AppError(400, 'BAD_REQUEST', error.message);
        }

        throw error;
      }
    },
  );

  app.get(
    '/api/v1/incidents/:id/investigation',
    async (request): Promise<ApiSuccessResponse<InvestigationResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireReadAccess(id, identity.userId);

      const investigation = await investigationService.getInvestigation(id);

      if (!investigation) {
        throw new AppError(404, 'NOT_FOUND', 'Investigation not found.');
      }

      return {
        status: 'ok',
        data: investigation,
      };
    },
  );

  app.patch(
    '/api/v1/incidents/:id/investigation',
    async (request): Promise<ApiSuccessResponse<InvestigationResponse>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireContributorAccess(id, identity.userId);

      const input = parseRequest(updateInvestigationRequestSchema, request.body);

      const investigation = await investigationService.updateInvestigation(id, input);

      if (!investigation) {
        throw new AppError(404, 'NOT_FOUND', 'Investigation not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'INVESTIGATION_UPDATED',
        resourceType: 'INVESTIGATION',
        resourceId: investigation.id,
        incidentId: id,
        metadata: input,
      });

      return {
        status: 'ok',
        data: investigation,
      };
    },
  );

  app.delete(
    '/api/v1/incidents/:id/investigation',
    async (request): Promise<ApiSuccessResponse<{ message: string }>> => {
      const { id } = request.params as { id?: string };

      if (!id || id.trim().length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'Incident ID is required.');
      }

      const identity = getAuthenticatedIdentity(request);
      await incidentAuthorizationService.requireManagerAccess(id, identity.userId);

      const removed = await investigationService.removeInvestigation(id);

      if (removed === null) {
        throw new AppError(404, 'NOT_FOUND', 'Incident not found.');
      }

      if (!removed) {
        throw new AppError(404, 'NOT_FOUND', 'Investigation not found.');
      }

      await auditLogService.record({
        actorUserId: identity.userId,
        action: 'INVESTIGATION_DELETED',
        resourceType: 'INVESTIGATION',
        resourceId: removed,
        incidentId: id,
      });

      return {
        status: 'ok',
        data: {
          message: 'Investigation deleted successfully.',
        },
      };
    },
  );
}
