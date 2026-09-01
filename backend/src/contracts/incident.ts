export const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export interface CreateIncidentRequest {
  title: string;
  description?: string | null;
  severity: IncidentSeverity;
  priority?: number;
  startedAt?: string | null;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string | null;
  severity?: IncidentSeverity;
  priority?: number;
  startedAt?: string | null;
}

export interface IncidentResponse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: IncidentSeverity;
  priority: number;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListIncidentsQuery {
  status?: string;
  severity?: IncidentSeverity;
  page: number;
  limit: number;
}

export interface IncidentListResponse {
  items: IncidentResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
