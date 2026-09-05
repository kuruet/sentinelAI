export interface ApiError {
  status: number;
  code?: string;
  message: string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.status = error.status;
    this.code = error.code;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return undefined;
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function explainIntelligenceTarget(
  token: string,
  incidentId: string,
  target: ExplainabilityTarget,
): Promise<IntelligenceExplanation> {
  const response = await apiRequest<{
    status: string;
    data: IntelligenceExplanation;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/intelligence/explain`,
    {
      method: 'POST',
      body: JSON.stringify({
        [target.type === 'HYPOTHESIS' ? 'hypothesis' : 'recommendation']: target.value,
      }),
    },
    token,
  );

  return response.data;
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
    });
  } catch {
    throw new ApiRequestError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the SentinelAI API.',
    });
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const payload =
      typeof body === 'object' && body !== null
        ? (body as {
            error?: {
              code?: unknown;
              message?: unknown;
            };
            message?: unknown;
          })
        : undefined;

    const message =
      typeof payload?.error?.message === 'string'
        ? payload.error.message
        : typeof payload?.message === 'string'
          ? payload.message
          : `Request failed with status ${response.status}.`;

    const code = typeof payload?.error?.code === 'string' ? payload.error.code : undefined;

    throw new ApiRequestError({
      status: response.status,
      code,
      message,
    });
  }

  return body as T;
}

export async function testProtectedRequest(token: string): Promise<{
  status: string;
  message: string;
}> {
  return apiRequest('/api/v1/test-protected', {}, token);
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'IDENTIFIED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

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

export interface IncidentListResponse {
  items: IncidentResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listIncidents(
  token: string,
  options: {
    page?: number;
    limit?: number;
    status?: IncidentStatus;
    severity?: IncidentSeverity;
  } = {},
): Promise<IncidentListResponse> {
  const params = new URLSearchParams();

  params.set('page', String(options.page ?? 1));
  params.set('limit', String(options.limit ?? 100));

  if (options.status) {
    params.set('status', options.status);
  }

  if (options.severity) {
    params.set('severity', options.severity);
  }

  const response = await apiRequest<{
    status: string;
    data: IncidentListResponse;
  }>('/api/v1/incidents?' + params.toString(), {}, token);

  return response.data;
}

export interface CreateIncidentRequest {
  title: string;
  description?: string | null;
  severity: IncidentSeverity;
  priority?: number;
  startedAt?: string | null;
}

export async function createIncident(
  token: string,
  input: CreateIncidentRequest,
): Promise<IncidentResponse> {
  const response = await apiRequest<{
    status: string;
    data: IncidentResponse;
  }>(
    '/api/v1/incidents',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    token,
  );

  return response.data;
}
export async function getIncident(token: string, incidentId: string): Promise<IncidentResponse> {
  const response = await apiRequest<{
    status: string;
    data: IncidentResponse;
  }>(`/api/v1/incidents/${encodeURIComponent(incidentId)}`, {}, token);

  return response.data;
}
export type IncidentEventType =
  'ALERT' | 'LOG' | 'METRIC' | 'DEPLOYMENT' | 'CONFIGURATION_CHANGE' | 'MANUAL' | 'SYSTEM';

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

export interface CreateIncidentEventRequest {
  eventType: IncidentEventType;
  occurredAt: string;
  sequence: number;
  title: string;
  description?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function listIncidentEvents(
  token: string,
  incidentId: string,
): Promise<IncidentEventListResponse> {
  const response = await apiRequest<{
    status: string;
    data: IncidentEventListResponse;
  }>(`/api/v1/incidents/${encodeURIComponent(incidentId)}/events`, {}, token);

  return response.data;
}

export async function getIncidentTimeline(
  token: string,
  incidentId: string,
): Promise<IncidentEventListResponse> {
  const response = await apiRequest<{
    status: string;
    data: IncidentEventListResponse;
  }>(`/api/v1/incidents/${encodeURIComponent(incidentId)}/timeline`, {}, token);

  return response.data;
}

export async function createIncidentEvent(
  token: string,
  incidentId: string,
  input: CreateIncidentEventRequest,
): Promise<IncidentEventResponse> {
  const response = await apiRequest<{
    status: string;
    data: IncidentEventResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    token,
  );

  return response.data;
}

export const EVIDENCE_TYPES = [
  'LOG',
  'METRIC',
  'TRACE',
  'ALERT',
  'DEPLOYMENT',
  'CONFIGURATION',
  'DOCUMENT',
  'MANUAL',
  'OTHER',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export interface CreateEvidenceRequest {
  evidenceType: EvidenceType;
  title: string;
  description?: string | null;
  source: string;
  sourceRef?: string | null;
  collectedAt?: string | null;
  occurredAt?: string | null;
  contentHash?: string | null;
  trustLevel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EvidenceResponse {
  id: string;
  incidentId: string;
  evidenceType: EvidenceType;
  title: string;
  description: string | null;
  source: string;
  sourceRef: string | null;
  collectedAt: string | null;
  occurredAt: string | null;
  contentHash: string | null;
  trustLevel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceListResponse {
  items: EvidenceResponse[];
}
export async function listIncidentEvidence(
  token: string,
  incidentId: string,
): Promise<EvidenceListResponse> {
  const response = await apiRequest<{
    status: string;
    data: EvidenceListResponse;
  }>(`/api/v1/incidents/${encodeURIComponent(incidentId)}/evidence`, {}, token);

  return response.data;
}

export async function getIncidentEvidence(
  token: string,
  incidentId: string,
  evidenceId: string,
): Promise<EvidenceResponse> {
  const response = await apiRequest<{
    status: string;
    data: EvidenceResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/evidence/${encodeURIComponent(evidenceId)}`,
    {},
    token,
  );

  return response.data;
}

export async function createIncidentEvidence(
  token: string,
  incidentId: string,
  input: CreateEvidenceRequest,
): Promise<EvidenceResponse> {
  const response = await apiRequest<{
    status: string;
    data: EvidenceResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/evidence`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response.data;
}

export async function deleteIncidentEvidence(
  token: string,
  incidentId: string,
  evidenceId: string,
): Promise<void> {
  await apiRequest<unknown>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/evidence/${encodeURIComponent(evidenceId)}`,
    {
      method: 'DELETE',
    },
    token,
  );
}
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score?: number | null;
  rationale: string;
}

export type IntelligenceReferenceType = 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION';

export interface IntelligenceReference {
  type: IntelligenceReferenceType;
  id: string;
  reason: string;
}

export interface IntelligenceContext {
  incident: IncidentResponse;
  events: IncidentEventResponse[];
  evidence: EvidenceResponse[];
  investigation: InvestigationResponse | null;
}

export interface IntelligenceContextMetadata {
  generatedAt: string;
  eventCount: number;
  evidenceCount: number;
  hasInvestigation: boolean;
}

export interface IntelligenceContextSnapshot {
  context: IntelligenceContext;
  metadata: IntelligenceContextMetadata;
}

export async function getIncidentIntelligenceContext(
  token: string,
  incidentId: string,
): Promise<IntelligenceContextSnapshot> {
  const response = await apiRequest<{
    status: string;
    data: IntelligenceContextSnapshot;
  }>(`/api/v1/incidents/${encodeURIComponent(incidentId)}/intelligence/context`, {}, token);

  return response.data;
}
export type InvestigationAssistantIntent =
  | 'INVESTIGATION_SUMMARY'
  | 'EVIDENCE_INTERPRETATION'
  | 'TIMELINE_ANALYSIS'
  | 'NEXT_INVESTIGATION_STEP'
  | 'HYPOTHESIS_REVIEW';

export interface InvestigationAssistantReference {
  type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION' | 'FINDING';
  id: string;
  reason: string;
}

export interface InvestigationAssistantResponse {
  incidentId: string;
  answer: string;
  references: InvestigationAssistantReference[];
  limitations: string[];
  provider: string;
  model: string;
  requestId?: string | null;
  latencyMs: number;
}

export async function askInvestigationAssistant(
  token: string,
  incidentId: string,
  question: string,
  intent: InvestigationAssistantIntent,
  model: string,
): Promise<InvestigationAssistantResponse> {
  const response = await apiRequest<{
    status: string;
    data: InvestigationAssistantResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/intelligence/assistant`,
    {
      method: 'POST',
      body: JSON.stringify({ question, intent, model }),
    },
    token,
  );

  return response.data;
}
export type RootCauseAnalysisMode = 'PRIMARY' | 'ALTERNATIVE';

export interface RootCauseAnalysisReference {
  type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION' | 'FINDING';
  id: string;
  reason: string;
}

export interface RootCauseAnalysisConfidence {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  score?: number | null;
  rationale: string;
}

export interface RootCauseAnalysisHypothesis {
  id: string;
  title: string;
  description: string;
  confidence: RootCauseAnalysisConfidence;
  supportingReferences: RootCauseAnalysisReference[];
  contradictingReferences: RootCauseAnalysisReference[];
}

export type RecommendationPriority = 'IMMEDIATE' | 'HIGH' | 'NORMAL' | 'LOW';

export interface RecommendationConfidence {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  score?: number | null;
  rationale: string;
}

export interface RecommendationReference {
  type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION';
  id: string;
  reason: string;
}

export interface IntelligenceRecommendation {
  id: string;
  title: string;
  action: string;
  priority: RecommendationPriority;
  confidence: RecommendationConfidence;
  references: RecommendationReference[];
}

export interface RecommendationsResponse {
  incidentId: string;
  recommendations: IntelligenceRecommendation[];
  provider: string;
  model: string;
  requestId?: string;
  latencyMs?: number;
}

export type ExplainabilityTargetType = 'FINDING' | 'HYPOTHESIS' | 'RECOMMENDATION';

export interface ExplainabilityConfidence {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  score?: number | null;
  rationale: string;
}

export interface ExplainabilityReference {
  type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION';
  id: string;
  reason: string;
}

export interface IntelligenceExplanation {
  targetType: ExplainabilityTargetType;
  targetId: string;
  explanation: string;
  confidence: ExplainabilityConfidence;
  supportingReferences: ExplainabilityReference[];
  uncertainty: string[];
}

export interface ExplainabilityTarget {
  type: 'HYPOTHESIS' | 'RECOMMENDATION';
  value: RootCauseAnalysisHypothesis | IntelligenceRecommendation;
}

export interface RootCauseAnalysisResponse {
  incidentId: string;
  mode: RootCauseAnalysisMode;
  hypotheses: RootCauseAnalysisHypothesis[];
  analysis: string;
  limitations: string[];
  provider: string;
  model: string;
  requestId?: string | null;
  latencyMs?: number;
}

export async function getRecommendations(
  token: string,
  incidentId: string,
  model: string,
): Promise<RecommendationsResponse> {
  const response = await apiRequest<{
    status: string;
    data: RecommendationsResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/intelligence/recommendations`,
    {
      method: 'POST',
      body: JSON.stringify({ model }),
    },
    token,
  );

  return response.data;
}
export async function analyzeRootCause(
  token: string,
  incidentId: string,
  mode: RootCauseAnalysisMode,
  model: string,
): Promise<RootCauseAnalysisResponse> {
  const response = await apiRequest<{
    status: string;
    data: RootCauseAnalysisResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/intelligence/root-cause`,
    {
      method: 'POST',
      body: JSON.stringify({ mode, model }),
    },
    token,
  );

  return response.data;
}
export type IncidentSummaryMode = 'EXECUTIVE' | 'INVESTIGATION' | 'TIMELINE';

export interface IncidentSummaryReference {
  type: 'INCIDENT' | 'EVENT' | 'EVIDENCE' | 'INVESTIGATION' | 'FINDING';
  id: string;
  reason: string;
}

export interface IncidentSummaryResponse {
  incidentId: string;
  mode: IncidentSummaryMode;
  summary: string;
  references: IncidentSummaryReference[];
  limitations: string[];
  provider: string;
  model: string;
  requestId?: string | null;
  latencyMs: number;
}

export async function generateIncidentSummary(
  token: string,
  incidentId: string,
  mode: IncidentSummaryMode,
  model: string,
): Promise<IncidentSummaryResponse> {
  const response = await apiRequest<{
    status: string;
    data: IncidentSummaryResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/intelligence/summary`,
    {
      method: 'POST',
      body: JSON.stringify({ mode, model }),
    },
    token,
  );

  return response.data;
}
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

export async function getIncidentInvestigation(
  token: string,
  incidentId: string,
): Promise<InvestigationResponse> {
  const response = await apiRequest<{
    status: string;
    data: InvestigationResponse;
  }>(`/api/v1/incidents/${encodeURIComponent(incidentId)}/investigation`, {}, token);

  return response.data;
}

export async function createIncidentInvestigation(
  token: string,
  incidentId: string,
  input: CreateInvestigationRequest,
): Promise<InvestigationResponse> {
  const response = await apiRequest<{
    status: string;
    data: InvestigationResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/investigation`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response.data;
}

export async function updateIncidentInvestigation(
  token: string,
  incidentId: string,
  input: UpdateInvestigationRequest,
): Promise<InvestigationResponse> {
  const response = await apiRequest<{
    status: string;
    data: InvestigationResponse;
  }>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/investigation`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    token,
  );

  return response.data;
}

export async function deleteIncidentInvestigation(
  token: string,
  incidentId: string,
): Promise<void> {
  await apiRequest<unknown>(
    `/api/v1/incidents/${encodeURIComponent(incidentId)}/investigation`,
    {
      method: 'DELETE',
    },
    token,
  );
}
