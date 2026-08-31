import { z } from 'zod';

export const testRequestSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100),
});

export type TestRequest = z.infer<typeof testRequestSchema>;
