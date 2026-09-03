import { prisma } from '../infrastructure/database';
import type {
  AuditLogDataAccess,
  AuditLogRecord,
  CreateAuditLogInput,
} from './audit-log-data-access';

export class PrismaAuditLogDataAccess implements AuditLogDataAccess {
  async create(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    return prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        incidentId: input.incidentId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  async listByIncident(incidentId: string): Promise<AuditLogRecord[]> {
    return prisma.auditLog.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
