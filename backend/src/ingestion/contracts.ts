import { z } from 'zod';

export const ingestionSignalSchema = z
  .object({
    source: z.string().trim().min(1).max(500),
    signalType: z.enum([
      'ALERT',
      'LOG',
      'METRIC',
      'DEPLOYMENT',
      'CONFIGURATION_CHANGE',
      'MANUAL',
      'SYSTEM',
    ]),
    occurredAt: z.string().datetime({ offset: true }),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).nullable().optional(),
    sourceRef: z.string().trim().max(1000).nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();

export const ingestionBatchSchema = z
  .object({
    incidentId: z.string().uuid(),
    signals: z.array(ingestionSignalSchema).min(1).max(100),
  })
  .strict();

export type IngestionSignal = z.infer<typeof ingestionSignalSchema>;
export type IngestionBatchRequest = z.infer<typeof ingestionBatchSchema>;
