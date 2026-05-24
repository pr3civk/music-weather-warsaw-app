import { z } from 'zod';
import { hourlyAggregateSchema } from './aggregate.dto';

export const correlationResultSchema = z.object({
  r: z.number(),
  r2: z.number(),
  strength: z.enum(['strong', 'moderate', 'weak', 'none']),
  direction: z.enum(['positive', 'negative', 'none']),
  label: z.string(),
});
export type CorrelationResult = z.infer<typeof correlationResultSchema>;

export const correlationMatrixEntrySchema = z.object({
  weatherMetric: z.string(),
  musicMetric: z.string(),
  result: correlationResultSchema,
});
export type CorrelationMatrixEntry = z.infer<typeof correlationMatrixEntrySchema>;

export const correlationResponseSchema = z.object({
  matrix: z.array(correlationMatrixEntrySchema),
  timeSeries: z.array(hourlyAggregateSchema),
  dataPoints: z.number().int(),
  warning: z.string().optional(),
});
export type CorrelationResponse = z.infer<typeof correlationResponseSchema>;
