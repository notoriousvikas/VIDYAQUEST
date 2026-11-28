import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().email('Valid email required').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
    grade: z.string().trim().max(20).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email required').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});
