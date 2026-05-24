import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

export const musicRoutes = Router();

musicRoutes.use(requireAuth);

musicRoutes.get('/', async (req, res) => {
  const now = new Date();
  const fromQ = req.query.from as string | undefined;
  const toQ = req.query.to as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);
  const to = toQ ? new Date(toQ) : now;
  const from = fromQ ? new Date(fromQ) : new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const rows = await db.execute(sql`
    SELECT
      t.id, t.spotify_id AS "spotifyId", t.name, t.artist, t.album,
      t.duration_ms AS "durationMs", t.popularity,
      t.valence, t.energy, t.tempo, t.danceability,
      t.loudness, t.acousticness, t.speechiness, t.instrumentalness,
      AVG(st.position)::real AS "avgPosition",
      COUNT(st.id)::int AS appearances
    FROM snapshot_tracks st
    JOIN tracks t ON t.id = st.track_id
    JOIN spotify_snapshots s ON s.id = st.snapshot_id
    WHERE s.captured_at >= ${from} AND s.captured_at <= ${to}
    GROUP BY t.id
    ORDER BY appearances DESC, "avgPosition" ASC
    LIMIT ${limit}
  `);

  res.json(rows.rows);
});
