import { z } from 'zod';

export const createInvestigationRequestSchema = z
  .object({
    summary: z
      .string()
      .trim()
      .max(10000, 'summary must be at most 10000 characters')
      .nullable()
      .optional(),
    startedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    completedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export const updateInvestigationRequestSchema = z
  .object({
    summary: z
      .string()
      .trim()
      .max(10000, 'summary must be at most 10000 characters')
      .nullable()
      .optional(),
    startedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    completedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.summary !== undefined ||
      value.startedAt !== undefined ||
      value.completedAt !== undefined,
    {
      message: 'At least one investigation field is required.',
    },
  );

export type CreateInvestigationRequestInput = z.infer<typeof createInvestigationRequestSchema>;

export type UpdateInvestigationRequestInput = z.infer<typeof updateInvestigationRequestSchema>;
