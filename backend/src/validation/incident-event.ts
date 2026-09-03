import { z } from 'zod';

export const createIncidentEventRequestSchema = z
  .object({
    eventType: z.enum([
      'ALERT',
      'LOG',
      'METRIC',
      'DEPLOYMENT',
      'CONFIGURATION_CHANGE',
      'MANUAL',
      'SYSTEM',
    ]),
    occurredAt: z.string().datetime({ offset: true }),
    sequence: z
      .number()
      .int('sequence must be an integer')
      .positive('sequence must be greater than 0'),
    title: z.string().trim().min(1, 'title is required'),
    description: z.string().nullable().optional(),
    source: z.string().trim().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();
