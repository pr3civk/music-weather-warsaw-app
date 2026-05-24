import { z } from 'zod';

export const triggerResponseSchema = z.object({
  ok: z.boolean(),
  capturedAt: z.string(),
  skipped: z.boolean(),
});
export type TriggerResponse = z.infer<typeof triggerResponseSchema>;
