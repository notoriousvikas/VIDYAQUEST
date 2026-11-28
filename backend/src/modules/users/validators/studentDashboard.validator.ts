import { z } from 'zod';

export const updateAvatarSchema = z.object({
  body: z
    .object({
      appearance: z
        .object({
          skinTone: z.string().min(1).optional(),
          hairstyle: z.string().min(1).optional(),
          hairColor: z.string().min(1).optional(),
          face: z.string().min(1).optional(),
          eyes: z.string().min(1).optional(),
          outfit: z.string().min(1).optional(),
          jacket: z.string().min(1).optional(),
          bottoms: z.string().min(1).optional(),
          shoes: z.string().min(1).optional(),
          costume: z.string().min(1).optional(),
        })
        .optional(),
      equippedItems: z
        .object({
          headwear: z.string().min(1).optional(),
          glasses: z.string().min(1).optional(),
          backpack: z.string().min(1).optional(),
          cape: z.string().min(1).optional(),
          aura: z.string().min(1).optional(),
          neckwear: z.string().min(1).optional(),
          wristwear: z.string().min(1).optional(),
          badge: z.string().min(1).optional(),
          accessory: z.string().min(1).optional(),
        })
        .optional(),
      activeOutfitId: z.string().nullable().optional(),
    })
    .refine(
      (data) => Boolean(data.appearance || data.equippedItems),
      'At least one appearance or equippedItems field is required',
    ),
});

export const createSavedOutfitSchema = z.object({
  body: z.object({
    outfitName: z.string().trim().min(1).max(50),
    appearance: z.record(z.string()).optional(),
    equippedItems: z.record(z.string()).optional(),
  }),
});

export const updateSavedOutfitSchema = z.object({
  body: z.object({
    outfitName: z.string().trim().min(1).max(50).optional(),
    equip: z.boolean().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().trim().min(2).max(80).optional(),
    classGrade: z.string().trim().min(1).max(30).optional(),
    school: z.string().trim().max(120).optional(),
    schoolLocation: z.string().trim().max(120).optional(),
    preferredLanguage: z.string().trim().min(2).max(40).optional(),
    timezone: z.string().trim().min(2).max(64).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    learningPreferences: z
      .object({
        pace: z.enum(['relaxed', 'balanced', 'fast']).optional(),
        visualMode: z.enum(['illustrated', 'compact']).optional(),
        audioHints: z.boolean().optional(),
      })
      .optional(),
    accessibilitySettings: z
      .object({
        highContrast: z.boolean().optional(),
        reducedMotion: z.boolean().optional(),
        fontSize: z.enum(['small', 'medium', 'large']).optional(),
      })
      .optional(),
    leaderboardOptOut: z.boolean().optional(),
    showSchoolOnLeaderboard: z.boolean().optional(),
  }),
});
