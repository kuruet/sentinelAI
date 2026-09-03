export type ParticipantRole = 'RESPONDER' | 'INCIDENT_COMMANDER' | 'OBSERVER';

export interface AddIncidentParticipantRequest {
  userId: string;
  role: ParticipantRole;
}

export interface IncidentParticipantResponse {
  id: string;
  incidentId: string;
  userId: string;
  role: ParticipantRole;
  createdAt: string;
}

export interface IncidentParticipantListResponse {
  items: IncidentParticipantResponse[];
}
