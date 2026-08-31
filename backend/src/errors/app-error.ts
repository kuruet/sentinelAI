export type ApiErrorCode =
  'BAD_REQUEST' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorResponse {
  status: 'error';
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
