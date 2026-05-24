import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { weatherRoutes } from './routes/weather.js';
import { musicRoutes } from './routes/music.js';
import { currentRoutes } from './routes/current.js';
import { correlationRoutes } from './routes/correlation.js';
import { exportRoutes } from './routes/export.js';
import { adminRoutes } from './routes/admin.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/music', musicRoutes);
  app.use('/api/current', currentRoutes);
  app.use('/api/correlation', correlationRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/admin', adminRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[error]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  });

  return app;
}
