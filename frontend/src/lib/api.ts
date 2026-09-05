const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

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

  return response.json();
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

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

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
