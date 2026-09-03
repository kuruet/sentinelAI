import type { Prisma } from '../generated/prisma/client';

export interface AuditLogRecord {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  incidentId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  incidentId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export interface AuditLogDataAccess {
  create(input: CreateAuditLogInput): Promise<AuditLogRecord>;
  listByIncident(incidentId: string): Promise<AuditLogRecord[]>;
}
