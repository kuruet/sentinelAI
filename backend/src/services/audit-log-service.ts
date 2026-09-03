import type { AuditLogDataAccess, CreateAuditLogInput } from '../data-access/audit-log-data-access';

export class AuditLogService {
  constructor(private readonly auditLogDataAccess: AuditLogDataAccess) {}

  async record(input: CreateAuditLogInput): Promise<void> {
    await this.auditLogDataAccess.create(input);
  }

  async listByIncident(incidentId: string) {
    return this.auditLogDataAccess.listByIncident(incidentId);
  }
}
