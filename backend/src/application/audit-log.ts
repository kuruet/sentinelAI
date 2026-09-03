import { PrismaAuditLogDataAccess } from '../data-access/prisma-audit-log-data-access';
import { AuditLogService } from '../services/audit-log-service';

const auditLogDataAccess = new PrismaAuditLogDataAccess();

export const auditLogService = new AuditLogService(auditLogDataAccess);
