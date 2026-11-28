import { z } from 'zod';

const languageEnum = z.enum(['python', 'javascript', 'java']);

export const levelIdParamSchema = z.object({
  params: z.object({
    levelId: z.string().trim().min(1, 'levelId is required').max(64),
  }),
});

export const challengeIdParamSchema = z.object({
  params: z.object({
    challengeId: z.string().trim().min(1, 'challengeId is required').max(64),
  }),
});

export const runCodeSchema = z.object({
  body: z.object({
    challengeId: z.string().trim().min(1).max(64),
    language: languageEnum,
    code: z
      .string()
      .min(1, 'Code submission cannot be empty')
      .max(32768, 'Code exceeds maximum allowed size (32 KB)')
      .refine((v) => v.trim().length > 0, 'Code submission cannot be blank'),
    customInput: z.string().max(8192, 'Input exceeds 8 KB limit').optional(),
  }),
});

export const submitCodeSchema = z.object({
  body: z.object({
    challengeId: z.string().trim().min(1).max(64),
    language: languageEnum,
    code: z
      .string()
      .min(1, 'Code submission cannot be empty')
      .max(32768, 'Code exceeds maximum allowed size (32 KB)')
      .refine((v) => v.trim().length > 0, 'Code submission cannot be blank'),
  }),
});

export const codingHintSchema = z.object({
  body: z.object({
    challengeId: z.string().trim().min(1).max(64),
    language: languageEnum,
    code: z.string().max(32768).default(''),
    hintLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
    errorOutput: z.string().max(4096).optional(),
    question: z.string().max(500).optional(),
  }),
});
