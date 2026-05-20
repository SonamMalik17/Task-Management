import { z } from 'zod';
import { USER_ROLES } from '../constants';
import { ObjectIdSchema, TimestampsSchema } from './common.schema';

export const UserSchema = z
  .object({
    id: ObjectIdSchema,
    email: z.string().email(),
    name: z.string().min(1).max(80),
    avatarUrl: z.string().url().nullable().optional(),
    role: z.enum(USER_ROLES).default('member'),
  })
  .merge(TimestampsSchema);

export type User = z.infer<typeof UserSchema>;

// Auth payload shapes — kept narrow to avoid leaking internal fields
export const RegisterInputSchema = z.object({
  email: z.string().email(),
  // Min 8 + at least one letter and one number. Keep client-facing rule simple
  // and explainable — heavy entropy requirements lower completion rates.
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  name: z.string().min(1).max(80),
});

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
