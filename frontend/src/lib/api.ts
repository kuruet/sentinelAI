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
