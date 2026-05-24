import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { buildJsonExport, buildXmlExport, type ExportRow } from '../lib/exporter.js';

export const exportRoutes = Router();

exportRoutes.use(requireAuth);

exportRoutes.get('/', async (req, res) => {
  const format = ((req.query.format as string) || 'json').toLowerCase();
  if (format !== 'json' && format !== 'xml') {
    return res.status(400).json({ error: 'format must be json or xml' });
  }
  const fromQ = req.query.from as string | undefined;
  const toQ = req.query.to as string | undefined;
  const from = fromQ ? new Date(fromQ) : new Date(0);
  const to = toQ ? new Date(toQ) : new Date();

  const result = await db.execute(sql`
    SELECT
      hour, temperature, precipitation, cloud_cover AS "cloudCover",
      sunshine_last_hour AS "sunshineLastHour", weather_code AS "weatherCode",
      avg_valence AS "avgValence", avg_energy AS "avgEnergy",
      avg_tempo AS "avgTempo", avg_danceability AS "avgDanceability",
      avg_loudness AS "avgLoudness", avg_acousticness AS "avgAcousticness",
      avg_speechiness AS "avgSpeechiness", avg_instrumentalness AS "avgInstrumentalness",
      track_count AS "trackCount"
    FROM hourly_aggregates
    WHERE hour >= ${from} AND hour <= ${to}
    ORDER BY hour ASC
  `);
  const rows = result.rows as unknown as ExportRow[];

  const meta = {
    from: from.toISOString(),
    to: to.toISOString(),
    count: rows.length,
    generatedAt: new Date().toISOString(),
  };
  const fname = `music-weather-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.${format}`;
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.send(buildJsonExport(rows, meta));
  } else {
    res.setHeader('Content-Type', 'application/xml');
    res.send(buildXmlExport(rows, meta));
  }
});
