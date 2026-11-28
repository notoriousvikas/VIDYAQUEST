import { LevelRewardConfigModel } from '../models/LevelRewardConfig.model';

const LEVEL_REWARD_SEED = [
  // Mathematics
  { missionSlug: 'math-1', subjectSlug: 'mathematics', sequence: 1, rewardItemKeys: ['outfit-math-tshirt'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'math-2', subjectSlug: 'mathematics', sequence: 2, rewardItemKeys: ['jacket-number-hoodie'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'math-3', subjectSlug: 'mathematics', sequence: 3, rewardItemKeys: ['jacket-denim-classic'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'math-5', subjectSlug: 'mathematics', sequence: 5, rewardItemKeys: ['shoes-royal-sneakers'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'math-8', subjectSlug: 'mathematics', sequence: 8, rewardItemKeys: ['costume-royal-king'], rewardXp: 0, rewardType: 'conqueror' as const },

  // Physics
  { missionSlug: 'phys-1', subjectSlug: 'physics', sequence: 1, rewardItemKeys: ['outfit-atom-tshirt'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'phys-2', subjectSlug: 'physics', sequence: 2, rewardItemKeys: ['jacket-scientist'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'phys-3', subjectSlug: 'physics', sequence: 3, rewardItemKeys: ['backpack-energy-pack'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'phys-5', subjectSlug: 'physics', sequence: 5, rewardItemKeys: ['costume-physics-suit'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'phys-8', subjectSlug: 'physics', sequence: 8, rewardItemKeys: ['costume-astronaut'], rewardXp: 0, rewardType: 'conqueror' as const },

  // Chemistry
  { missionSlug: 'chem-1', subjectSlug: 'chemistry', sequence: 1, rewardItemKeys: ['outfit-chem-tshirt'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'chem-2', subjectSlug: 'chemistry', sequence: 2, rewardItemKeys: ['jacket-potion-hoodie'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'chem-3', subjectSlug: 'chemistry', sequence: 3, rewardItemKeys: ['jacket-lab-coat'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'chem-5', subjectSlug: 'chemistry', sequence: 5, rewardItemKeys: ['accessory-flask'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'chem-8', subjectSlug: 'chemistry', sequence: 8, rewardItemKeys: ['costume-wizard'], rewardXp: 0, rewardType: 'conqueror' as const },

  // Biology
  { missionSlug: 'bio-1', subjectSlug: 'biology', sequence: 1, rewardItemKeys: ['outfit-bio-tshirt'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'bio-2', subjectSlug: 'biology', sequence: 2, rewardItemKeys: ['jacket-forest-hoodie'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'bio-3', subjectSlug: 'biology', sequence: 3, rewardItemKeys: ['backpack-botanist'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'bio-5', subjectSlug: 'biology', sequence: 5, rewardItemKeys: ['shoes-trail-emerald'], rewardXp: 0, rewardType: 'clothing' as const },
  { missionSlug: 'bio-8', subjectSlug: 'biology', sequence: 8, rewardItemKeys: ['costume-explorer'], rewardXp: 0, rewardType: 'conqueror' as const },
];

let levelRewardsSeededPromise: Promise<void> | null = null;

export async function ensureLevelRewardsSeeded(): Promise<void> {
  if (!levelRewardsSeededPromise) {
    levelRewardsSeededPromise = (async () => {
      const count = await LevelRewardConfigModel.countDocuments({});
      if (count >= LEVEL_REWARD_SEED.length) return;

      await Promise.all(
        LEVEL_REWARD_SEED.map((cfg) =>
          LevelRewardConfigModel.updateOne(
            { missionSlug: cfg.missionSlug },
            { $setOnInsert: { ...cfg, isRewardEnabled: true } },
            { upsert: true },
          ),
        ),
      );
    })().catch((err) => {
      levelRewardsSeededPromise = null;
      throw err;
    });
  }
  return levelRewardsSeededPromise;
}
