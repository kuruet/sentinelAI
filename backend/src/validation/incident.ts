import { z } from 'zod';

export const createIncidentRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title is required')
      .max(200, 'title must be at most 200 characters'),

    description: z
      .string()
      .trim()
      .max(5000, 'description must be at most 5000 characters')
      .nullable()
      .optional(),

    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),

    priority: z
      .number()
      .int('priority must be an integer')
      .min(0, 'priority must be at least 0')
      .max(1000, 'priority must be at most 1000')
      .optional(),

    startedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export type CreateIncidentRequestInput = z.infer<typeof createIncidentRequestSchema>;
