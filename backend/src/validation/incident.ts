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

export const updateIncidentRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title is required')
      .max(200, 'title must be at most 200 characters')
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, 'description must be at most 5000 characters')
      .nullable()
      .optional(),

    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),

    priority: z
      .number()
      .int('priority must be an integer')
      .min(0, 'priority must be at least 0')
      .max(1000, 'priority must be at most 1000')
      .optional(),

    startedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateIncidentRequestInput = z.infer<typeof updateIncidentRequestSchema>;
export const updateIncidentSeverityPriorityRequestSchema = z
  .object({
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    priority: z
      .number()
      .int('priority must be an integer')
      .min(0, 'priority must be at least 0')
      .max(1000, 'priority must be at most 1000')
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one severity or priority field must be provided',
  });

export type UpdateIncidentSeverityPriorityRequestInput = z.infer<
  typeof updateIncidentSeverityPriorityRequestSchema
>;

export const updateIncidentLifecycleRequestSchema = z
  .object({
    status: z.enum(['IDENTIFIED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']),
  })
  .strict();

export type UpdateIncidentLifecycleRequestInput = z.infer<
  typeof updateIncidentLifecycleRequestSchema
>;

export const listIncidentsQuerySchema = z
  .object({
    status: z.enum(['IDENTIFIED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ListIncidentsQueryInput = z.infer<typeof listIncidentsQuerySchema>;
