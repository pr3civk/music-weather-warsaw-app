import { z } from 'zod';

export const hourlyAggregateSchema = z.object({
  hour: z.string(),
  temperature: z.number().nullable(),
  precipitation: z.number().nullable(),
  cloudCover: z.number().nullable(),
  sunshineLastHour: z.number().nullable(),
  weatherCode: z.number().int().nullable(),
  avgValence: z.number().nullable(),
  avgEnergy: z.number().nullable(),
  avgTempo: z.number().nullable(),
  avgDanceability: z.number().nullable(),
  avgLoudness: z.number().nullable(),
  avgAcousticness: z.number().nullable(),
  avgSpeechiness: z.number().nullable(),
  avgInstrumentalness: z.number().nullable(),
  trackCount: z.number().int(),
});
export type HourlyAggregate = z.infer<typeof hourlyAggregateSchema>;
