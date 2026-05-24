import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { computeCorrelationMatrix, type HourlyPoint } from '../lib/correlation.js';

export const correlationRoutes = Router();

correlationRoutes.use(requireAuth);

correlationRoutes.get('/', async (req, res) => {
  const fromQ = req.query.from as string | undefined;
  const toQ = req.query.to as string | undefined;
  const from = fromQ ? new Date(fromQ) : new Date(0);
  const to = toQ ? new Date(toQ) : new Date();

  const data = await db.transaction(async (tx) => {
    await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
    const rows = await tx.execute(sql`
      SELECT
        hour, temperature, precipitation, cloud_cover AS "cloudCover",
        sunshine_last_hour AS "sunshineLastHour",
        weather_code AS "weatherCode",
        avg_valence AS "avgValence", avg_energy AS "avgEnergy",
        avg_tempo AS "avgTempo", avg_danceability AS "avgDanceability",
        avg_loudness AS "avgLoudness", avg_acousticness AS "avgAcousticness",
        avg_speechiness AS "avgSpeechiness", avg_instrumentalness AS "avgInstrumentalness",
        track_count AS "trackCount"
      FROM hourly_aggregates
      WHERE hour >= ${from} AND hour <= ${to}
      ORDER BY hour ASC
    `);
    return rows.rows as unknown as HourlyPoint[];
  });

  if (data.length < 5) {
    return res.json({ matrix: [], timeSeries: data, dataPoints: data.length, warning: 'Za mało danych' });
  }

  const matrix = computeCorrelationMatrix(data);
  res.json({ matrix, timeSeries: data, dataPoints: data.length });
});
