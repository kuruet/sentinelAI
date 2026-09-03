export const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ['IDENTIFIED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

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

export interface UpdateIncidentLifecycleRequest {
  status: IncidentStatus;
}

export interface IncidentResponse {
  id: string;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  priority: number;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListIncidentsQuery {
  status?: IncidentStatus;
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
