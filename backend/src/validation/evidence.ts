import { z } from 'zod';

export const createEvidenceRequestSchema = z
  .object({
    evidenceType: z.enum([
      'LOG',
      'METRIC',
      'TRACE',
      'ALERT',
      'DEPLOYMENT',
      'CONFIGURATION',
      'DOCUMENT',
      'MANUAL',
      'OTHER',
    ]),
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
    source: z
      .string()
      .trim()
      .min(1, 'source is required')
      .max(500, 'source must be at most 500 characters'),
    sourceRef: z
      .string()
      .trim()
      .max(1000, 'sourceRef must be at most 1000 characters')
      .nullable()
      .optional(),
    collectedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    occurredAt: z.iso.datetime({ offset: true }).nullable().optional(),
    contentHash: z
      .string()
      .trim()
      .max(500, 'contentHash must be at most 500 characters')
      .nullable()
      .optional(),
    trustLevel: z
      .string()
      .trim()
      .max(100, 'trustLevel must be at most 100 characters')
      .nullable()
      .optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();

export type CreateEvidenceRequestInput = z.infer<typeof createEvidenceRequestSchema>;
