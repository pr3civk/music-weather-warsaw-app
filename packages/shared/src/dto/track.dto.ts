import { z } from 'zod';

export const trackSchema = z.object({
  id: z.number().int(),
  spotifyId: z.string(),
  name: z.string(),
  artist: z.string(),
  album: z.string().nullable(),
  durationMs: z.number().int().nullable().optional(),
  popularity: z.number().int().nullable().optional(),
  valence: z.number().nullable(),
  energy: z.number().nullable(),
  tempo: z.number().nullable(),
  danceability: z.number().nullable(),
  loudness: z.number().nullable().optional(),
  acousticness: z.number().nullable().optional(),
  speechiness: z.number().nullable().optional(),
  instrumentalness: z.number().nullable().optional(),
  position: z.number().int().optional(),
  avgPosition: z.number().nullable().optional(),
  appearances: z.number().int().optional(),
});
export type Track = z.infer<typeof trackSchema>;

export const trackListSchema = z.array(trackSchema);
export type TrackList = z.infer<typeof trackListSchema>;
