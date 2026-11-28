import { z } from 'zod';

export const listLabsQuerySchema = z.object({
  query: z.object({
    subjectSlug: z.string().trim().min(1).optional(),
  }),
});

export const resolveMissionLabSchema = z.object({
  params: z.object({
    missionId: z.string().trim().min(1, 'missionId is required'),
  }),
});

export const startLabAttemptSchema = z.object({
  params: z.object({
    labId: z.string().trim().min(1, 'labId is required'),
  }),
  body: z.object({
    missionId: z.string().trim().min(1).optional(),
  }),
});

export const completeLabSchema = z.object({
  params: z.object({
    labId: z.string().trim().min(1, 'labId is required'),
  }),
  body: z.object({
    missionId: z.string().trim().min(1).optional(),
    completedSteps: z.array(z.coerce.number().int().min(0)).default([]),
    observations: z.array(z.string().max(1000)).default([]),
    answers: z.record(z.string(), z.coerce.number().int().min(0)).default({}),
  }),
});
