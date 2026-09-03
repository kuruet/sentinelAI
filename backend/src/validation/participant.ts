import { z } from 'zod';

export const addIncidentParticipantRequestSchema = z
  .object({
    userId: z.string().trim().min(1, 'userId is required'),
    role: z.enum(['RESPONDER', 'INCIDENT_COMMANDER', 'OBSERVER']),
  })
  .strict();

export type AddIncidentParticipantRequestInput = z.infer<
  typeof addIncidentParticipantRequestSchema
>;
