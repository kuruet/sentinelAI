export interface CreateInvestigationRequest {
  summary?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface UpdateInvestigationRequest {
  summary?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface InvestigationResponse {
  id: string;
  incidentId: string;
  summary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
