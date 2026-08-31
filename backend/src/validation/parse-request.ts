import { z } from 'zod';
import { AppError } from '../errors/app-error';

export function parseRequest<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
      .join('; ');

    throw new AppError(400, 'VALIDATION_ERROR', message);
  }

  return result.data;
}
