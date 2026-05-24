import { Router } from 'express';
import { sql, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { hourlyAggregates, spotifySnapshots } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

export const currentRoutes = Router();

currentRoutes.use(requireAuth);

currentRoutes.get('/', async (_req, res) => {
  const [agg] = await db
    .select()
    .from(hourlyAggregates)
    .orderBy(desc(hourlyAggregates.hour))
    .limit(1);

  if (!agg) {
    return res.json({
      weather: null,
      music: { avgValence: null, avgEnergy: null, avgTempo: null, avgDanceability: null, trackCount: 0, topTracks: [] },
    });
  }

  // Latest snapshot for top tracks
  const [snap] = await db
    .select()
    .from(spotifySnapshots)
    .orderBy(desc(spotifySnapshots.capturedAt))
    .limit(1);

  let topTracks: unknown[] = [];
  if (snap) {
    const rows = await db.execute(sql`
      SELECT
        t.id, t.spotify_id AS "spotifyId", t.name, t.artist, t.album,
        t.valence, t.energy, t.tempo, t.danceability,
        st.position
      FROM snapshot_tracks st
      JOIN tracks t ON t.id = st.track_id
      WHERE st.snapshot_id = ${snap.id}
      ORDER BY st.position ASC
      LIMIT 50
    `);
    topTracks = rows.rows;
  }

  res.json({
    weather: {
      capturedAt: agg.hour,
      temperature: agg.temperature,
      precipitation: agg.precipitation,
      cloudCover: agg.cloudCover,
      windSpeed: null,
      sunshineLastHour: agg.sunshineLastHour,
      weatherCode: agg.weatherCode,
    },
    music: {
      avgValence: agg.avgValence,
      avgEnergy: agg.avgEnergy,
      avgTempo: agg.avgTempo,
      avgDanceability: agg.avgDanceability,
      avgLoudness: agg.avgLoudness,
      avgAcousticness: agg.avgAcousticness,
      avgSpeechiness: agg.avgSpeechiness,
      avgInstrumentalness: agg.avgInstrumentalness,
      trackCount: agg.trackCount,
      topTracks,
    },
  });
});
