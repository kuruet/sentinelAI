export interface AuditLogResponse {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  incidentId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogListResponse {
  items: AuditLogResponse[];
}
