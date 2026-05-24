import { z } from 'zod';

export const weatherSnapshotSchema = z.object({
  id: z.number().int().optional(),
  capturedAt: z.string(),
  temperature: z.number().nullable(),
  precipitation: z.number().nullable(),
  cloudCover: z.number().nullable(),
  windSpeed: z.number().nullable(),
  sunshineLastHour: z.number().nullable(),
  weatherCode: z.number().int().nullable(),
});
export type WeatherSnapshot = z.infer<typeof weatherSnapshotSchema>;

export const weatherListSchema = z.array(weatherSnapshotSchema);
export type WeatherList = z.infer<typeof weatherListSchema>;
