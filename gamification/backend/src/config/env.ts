import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/vidyaquest'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  AUTH_SECRET: z
    .string()
    .min(16)
    .default('vidyaquest-dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ONLINECOMPILER_API_KEY: z.string().optional(),
  ONLINECOMPILER_API_URL: z
    .string()
    .url()
    .default('https://api.onlinecompiler.io/api/run-code-sync/'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (
  parsed.data.NODE_ENV === 'production' &&
  parsed.data.AUTH_SECRET === 'vidyaquest-dev-secret-change-in-production'
) {
  console.error('AUTH_SECRET must be set to a strong secret in production.');
  process.exit(1);
}

export const env = parsed.data;
