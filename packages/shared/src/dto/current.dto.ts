import { z } from 'zod';
import { weatherSnapshotSchema } from './weather.dto';
import { trackSchema } from './track.dto';

export const currentResponseSchema = z.object({
  weather: weatherSnapshotSchema.nullable(),
  music: z.object({
    avgValence: z.number().nullable(),
    avgEnergy: z.number().nullable(),
    avgTempo: z.number().nullable(),
    avgDanceability: z.number().nullable(),
    avgLoudness: z.number().nullable(),
    avgAcousticness: z.number().nullable(),
    avgSpeechiness: z.number().nullable(),
    avgInstrumentalness: z.number().nullable(),
    trackCount: z.number().int(),
    topTracks: z.array(trackSchema),
  }),
});
export type CurrentResponse = z.infer<typeof currentResponseSchema>;
