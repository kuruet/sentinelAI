import type { FastifyRequest } from 'fastify';
import type { ParticipantRole } from '../generated/prisma/enums';
import { AppError } from '../errors/app-error';

export interface AuthenticatedIdentity {
  userId: string;
}

export function getAuthenticatedIdentity(request: FastifyRequest): AuthenticatedIdentity {
  const payload = request.user as { sub?: unknown } | undefined;

  if (!payload || typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticated identity is missing.');
  }

  return {
    userId: payload.sub,
  };
}

export function requireParticipantRole(
  actualRole: ParticipantRole | null,
  allowedRoles: readonly ParticipantRole[],
): void {
  if (!actualRole || !allowedRoles.includes(actualRole)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You are not authorized to perform this incident operation.',
    );
  }
}

export const INCIDENT_READ_ROLES: readonly ParticipantRole[] = [
  'OBSERVER',
  'RESPONDER',
  'INCIDENT_COMMANDER',
];

export const INCIDENT_CONTRIBUTOR_ROLES: readonly ParticipantRole[] = [
  'RESPONDER',
  'INCIDENT_COMMANDER',
];

export const INCIDENT_MANAGER_ROLES: readonly ParticipantRole[] = ['INCIDENT_COMMANDER'];
