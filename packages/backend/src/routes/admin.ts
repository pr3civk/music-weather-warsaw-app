import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { runHourlyFetch } from '../jobs/hourlyFetch.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.post('/trigger', async (_req, res) => {
  try {
    const r = await runHourlyFetch();
    res.json({ ok: true, capturedAt: r.capturedAt.toISOString(), skipped: r.skipped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'trigger failed';
    res.status(500).json({ error: msg });
  }
});
