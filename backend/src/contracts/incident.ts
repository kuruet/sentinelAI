export interface IncidentResponse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  priority: number;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
