import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../env.js';
import { registerInputSchema, loginInputSchema } from '@mw/shared';

export const authRoutes = Router();

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

authRoutes.post('/register', async (req, res) => {
  const parsed = registerInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid input', details: parsed.error.flatten() });
  const { name, email, password } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: 'email already taken' });

  const countRow = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  const isFirst = (countRow[0]?.c ?? 0) === 0;
  const role = isFirst ? 'admin' : 'user';

  const passwordHash = await bcrypt.hash(password, 10);
  const [u] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning({ id: users.id, email: users.email, role: users.role, name: users.name });

  if (!u) return res.status(500).json({ error: 'insert failed' });
  const token = await signToken({ id: u.id, email: u.email, role: u.role as 'user' | 'admin' });
  res.cookie('mw_token', token, cookieOpts);
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role });
});

authRoutes.post('/login', async (req, res) => {
  const parsed = loginInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid input' });
  const { email, password } = parsed.data;
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = await signToken({ id: u.id, email: u.email, role: u.role as 'user' | 'admin' });
  res.cookie('mw_token', token, cookieOpts);
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role });
});

authRoutes.post('/logout', (_req, res) => {
  res.clearCookie('mw_token', { path: '/' });
  res.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (req, res) => {
  const [u] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, req.user!.id))
    .limit(1);
  if (!u) return res.status(404).json({ error: 'user not found' });
  res.json(u);
});
