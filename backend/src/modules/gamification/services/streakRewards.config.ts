export type FlameTier = 'none' | 'spark' | 'blaze' | 'inferno' | 'phoenix' | 'cosmic';

export interface StreakMilestoneReward {
  days: number;
  title: string;
  xp: number;
  freezeBonus: number;
  achievementCode?: string;
  avatarItemKey?: string;
  rewardLabel: string;
  flameTier: FlameTier;
}

export const STREAK_MILESTONES: StreakMilestoneReward[] = [
  {
    days: 3,
    title: '3-Day Spark',
    xp: 30,
    freezeBonus: 0,
    rewardLabel: '+30 XP',
    flameTier: 'spark',
  },
  {
    days: 7,
    title: '7-Day Flame Keeper',
    xp: 100,
    freezeBonus: 1,
    achievementCode: 'STREAK_7_FLAME',
    avatarItemKey: 'badge-flame-streak',
    rewardLabel: '+100 XP · Flame Badge · +1 Freeze',
    flameTier: 'blaze',
  },
  {
    days: 14,
    title: '14-Day Torchbearer',
    xp: 200,
    freezeBonus: 0,
    avatarItemKey: 'accessory-flame-torch',
    rewardLabel: '+200 XP · Flame Torch Accessory',
    flameTier: 'blaze',
  },
  {
    days: 30,
    title: '30-Day Phoenix Scholar',
    xp: 500,
    freezeBonus: 1,
    avatarItemKey: 'outfit-phoenix-flame',
    rewardLabel: '+500 XP · Rare Phoenix Outfit · +1 Freeze',
    flameTier: 'phoenix',
  },
  {
    days: 60,
    title: '60-Day Inferno Legend',
    xp: 1000,
    freezeBonus: 1,
    achievementCode: 'STREAK_60_INFERNO',
    avatarItemKey: 'badge-inferno-crest',
    rewardLabel: '+1000 XP · Inferno Crest Badge · +1 Freeze',
    flameTier: 'inferno',
  },
  {
    days: 100,
    title: '100-Day Cosmic Ember',
    xp: 0,
    freezeBonus: 2,
    avatarItemKey: 'skin-cosmic-ember',
    rewardLabel: 'Exclusive Cosmic Ember Skin · +2 Freezes',
    flameTier: 'cosmic',
  },
];

export const MAX_STREAK_FREEZES = 5;

export function getFlameTierForStreak(streakDays: number): FlameTier {
  if (streakDays >= 100) return 'cosmic';
  if (streakDays >= 60) return 'inferno';
  if (streakDays >= 30) return 'phoenix';
  if (streakDays >= 7) return 'blaze';
  if (streakDays >= 1) return 'spark';
  return 'none';
}
