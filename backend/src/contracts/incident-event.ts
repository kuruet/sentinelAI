export const INCIDENT_EVENT_TYPES = [
  'ALERT',
  'LOG',
  'METRIC',
  'DEPLOYMENT',
  'CONFIGURATION_CHANGE',
  'MANUAL',
  'SYSTEM',
] as const;

export type IncidentEventType = (typeof INCIDENT_EVENT_TYPES)[number];

export interface CreateIncidentEventRequest {
  eventType: IncidentEventType;
  occurredAt: string;
  sequence: number;
  title: string;
  description?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface IncidentEventResponse {
  id: string;
  incidentId: string;
  eventType: IncidentEventType;
  occurredAt: string;
  sequence: number;
  title: string;
  description: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface IncidentEventListResponse {
  items: IncidentEventResponse[];
}
