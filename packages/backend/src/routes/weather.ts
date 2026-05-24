import { Router } from 'express';
import { and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { weatherSnapshots } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

export const weatherRoutes = Router();

weatherRoutes.use(requireAuth);

weatherRoutes.get('/', async (req, res) => {
  const now = new Date();
  const fromQ = req.query.from as string | undefined;
  const toQ = req.query.to as string | undefined;
  const to = toQ ? new Date(toQ) : now;
  const from = fromQ ? new Date(fromQ) : new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(weatherSnapshots)
    .where(and(gte(weatherSnapshots.capturedAt, from), lte(weatherSnapshots.capturedAt, to)))
    .orderBy(desc(weatherSnapshots.capturedAt));

  res.json(rows);
});
