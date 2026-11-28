import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const worldIdParamSchema = z.object({
  params: z.object({
    worldId: z.string().regex(objectIdRegex, 'Invalid worldId format'),
  }),
});

export const nodeIdParamSchema = z.object({
  params: z.object({
    nodeId: z.string().regex(objectIdRegex, 'Invalid nodeId format'),
  }),
});

export const leaderboardQuerySchema = z.object({
  query: z.object({
    type: z.enum(['global', 'school', 'class', 'subject']).default('global'),
    period: z.enum(['all-time', 'weekly', 'monthly']).default('all-time'),
    subject: z.enum(['chemistry', 'physics', 'biology', 'mathematics', 'coding']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
  }),
});

export const leaderboardMeQuerySchema = z.object({
  query: z.object({
    type: z.enum(['global', 'school', 'class', 'subject']).default('global'),
    period: z.enum(['all-time', 'weekly', 'monthly']).default('all-time'),
    subject: z.enum(['chemistry', 'physics', 'biology', 'mathematics', 'coding']).optional(),
  }),
});

export const leaderboardStudentParamSchema = z.object({
  params: z.object({
    studentId: z.string().trim().min(1, 'studentId is required'),
  }),
});

export const claimRewardParamSchema = z.object({
  params: z.object({
    achievementId: z.string().regex(objectIdRegex, 'Invalid achievementId format'),
  }),
});

export const completeMissionParamSchema = z.object({
  params: z.object({
    missionId: z.string().min(1, 'missionId is required'),
  }),
});

export const subjectIdParamSchema = z.object({
  params: z.object({
    subjectId: z.string().min(1, 'subjectId is required'),
  }),
});

export const zoneIdParamSchema = z.object({
  params: z.object({
    zoneId: z.string().regex(objectIdRegex, 'Invalid zoneId format'),
  }),
});

export const studentMissionIdParamSchema = z.object({
  params: z.object({
    missionId: z.string().regex(objectIdRegex, 'Invalid missionId format'),
  }),
});

export const completeStudentMissionSchema = z.object({
  params: z.object({
    missionId: z.string().regex(objectIdRegex, 'Invalid missionId format'),
  }),
  body: z.object({
    score: z.coerce.number().min(0).max(100).optional().default(100),
  }),
});

export const adminUpsertZoneSchema = z.object({
  body: z.object({
    mapId: z.string().regex(objectIdRegex, 'Invalid mapId'),
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(80),
    locationType: z.string().trim().optional(),
    positionX: z.number().min(0).max(100),
    positionY: z.number().min(0).max(100),
    accentColor: z.string().trim().optional(),
    displayOrder: z.number().int().min(0).optional(),
    description: z.string().trim().optional(),
  }),
});

export const adminUpsertMissionSchema = z.object({
  body: z.object({
    subjectId: z.string().regex(objectIdRegex, 'Invalid subjectId'),
    mapId: z.string().regex(objectIdRegex, 'Invalid mapId'),
    locationId: z.string().regex(objectIdRegex, 'Invalid locationId'),
    slug: z.string().trim().min(2).max(80),
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(2).max(1000),
    missionType: z.enum([
      'Quiz',
      'Interactive lesson',
      'Virtual experiment',
      'Puzzle',
      'Project',
      'Challenge',
    ]),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Master']),
    xpReward: z.number().int().min(0).max(5000),
    prerequisites: z.array(z.string().regex(objectIdRegex)).optional(),
    sequence: z.number().int().min(1),
    learningObjectives: z.array(z.string().trim()).optional(),
    positionX: z.number().min(0).max(100),
    positionY: z.number().min(0).max(100),
    isPublished: z.boolean().optional(),
  }),
});
