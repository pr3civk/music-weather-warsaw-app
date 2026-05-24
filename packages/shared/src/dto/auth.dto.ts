import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
});
export type User = z.infer<typeof userSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;
