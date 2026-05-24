import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type JwtPayload = { id: number; email: string; role: 'user' | 'admin' };

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.id !== 'number' || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return { id: payload.id, email: payload.email, role: payload.role as 'user' | 'admin' };
  } catch {
    return null;
  }
}
