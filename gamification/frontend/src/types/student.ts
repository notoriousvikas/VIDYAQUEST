export interface AvatarAppearance {
  skinTone: string;
  hairstyle: string;
  hairColor: string;
  face: string;
  eyes: string;
  outfit: string;
  jacket?: string;
  bottoms?: string;
  shoes: string;
  costume?: string;
}

export interface AvatarEquippedItems {
  headwear: string;
  glasses: string;
  backpack: string;
  cape?: string;
  aura?: string;
  neckwear?: string;
  wristwear?: string;
  badge: string;
  accessory: string;
}

export type AvatarItemCategory =
  | 'skinTone'
  | 'hairstyle'
  | 'hairColor'
  | 'face'
  | 'eyes'
  | 'outfit'
  | 'jacket'
  | 'bottoms'
  | 'shoes'
  | 'costume'
  | 'headwear'
  | 'glasses'
  | 'backpack'
  | 'cape'
  | 'aura'
  | 'neckwear'
  | 'wristwear'
  | 'badge'
  | 'accessory';

export type AvatarItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AvatarItem {
  id: string;
  itemKey: string;
  name: string;
  category: AvatarItemCategory;
  subCategory?: string | null;
  assetReference: string;
  description: string;
  subjectSlug?: string | null;
  rarity?: AvatarItemRarity;
  unlockType: 'free' | 'level' | 'xp' | 'achievement' | 'milestone' | 'streak' | 'quest_level';
  unlockRequirement: {
    minLevel?: number;
    minXp?: number;
    minStreakDays?: number;
    achievementCode?: string;
    minMissions?: number;
    subjectSlug?: string;
    missionSlug?: string;
    missionSequence?: number;
    label: string;
  };
  unlocked: boolean;
}

export interface StudentAvatarState {
  appearance: AvatarAppearance;
  equippedItems: AvatarEquippedItems;
  unlockedItemKeys: string[];
  activeOutfitId?: string | null;
  updatedAt?: string;
}

export interface SavedOutfit {
  id: string;
  outfitName: string;
  appearance: AvatarAppearance;
  equippedItems: AvatarEquippedItems;
  createdAt: string;
  updatedAt: string;
}

export interface UnlockedClothingReward {
  itemKey: string;
  name: string;
  category: string;
  rarity: string;
  subjectSlug: string | null;
}

export interface StudentProfile {
  studentId: string;
  displayName: string;
  classGrade: string;
  school: string;
  schoolLocation?: string;
  preferredLanguage: string;
  timezone?: string;
  activeTitle?: string | null;
  conqueredSubjects?: string[];
  interests: string[];
  learningPreferences: {
    pace: 'relaxed' | 'balanced' | 'fast';
    visualMode: 'illustrated' | 'compact';
    audioHints: boolean;
  };
  accessibilitySettings: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  leaderboardOptOut?: boolean;
  showSchoolOnLeaderboard?: boolean;
}

export interface MissionSummaryCard {
  id: string;
  title: string;
  difficulty: string;
  xpReward: number;
  subjectSlug: string;
  subjectName: string;
  mapName: string;
}

export interface StudentAchievementItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  xpBonus: number;
  icon: string;
  unlocked: boolean;
  earnedAt: string | null;
  unlockCondition: string;
}

export interface StudentActivityItem {
  id: string;
  activityType: string;
  description: string;
  referenceId: string | null;
  xpDelta: number | null;
  createdAt: string;
}

export interface DailyQuestItem {
  id: string;
  dateKey: string;
  questKey: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
}

export interface SubjectProgressCard {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  totalMissions: number;
  completedMissions: number;
  completionPercentage: number;
  levelLabel: string;
  map: {
    id: string;
    mapName: string;
    mapSlug: string;
    previewAsset: string;
    version: number;
  } | null;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  avatar: StudentAvatarState;
  xp: {
    totalXp: number;
    level: number;
    currentLevelXp: number;
    xpPerLevel: number;
    xpToNextLevel: number;
    progressPercentage: number;
  };
  statistics: {
    totalXp: number;
    level: number;
    completedMissions: number;
    totalMissions: number;
    totalLearningMinutes: number;
    completedExperiments: number;
    competitionsParticipated: number;
    achievementsEarned: number;
    totalAchievements: number;
    currentStreakDays: number;
    longestStreakDays: number;
  };
  subjectProgress: SubjectProgressCard[];
  continueAdventure: {
    lastVisitedSubjectSlug: string;
    lastAttemptedMission: MissionSummaryCard | null;
    inProgressMission: MissionSummaryCard | null;
    recommendedNextMission: MissionSummaryCard | null;
  };
  dailyQuest: DailyQuestItem;
  achievements: StudentAchievementItem[];
  recentActivity: StudentActivityItem[];
  streak?: StreakSummary | null;
}

export type LeaderboardType = 'global' | 'school' | 'class' | 'subject';
export type LeaderboardPeriod = 'all-time' | 'weekly' | 'monthly';
export type LeaderboardSubjectSlug = 'chemistry' | 'physics' | 'biology' | 'mathematics' | 'coding';

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  userId: string;
  displayName: string;
  xp: number;
  totalXp: number;
  level: number;
  completedMissions: number;
  currentStreakDays: number;
  classGrade?: string;
  school?: string;
  schoolLocation?: string;
  avatar: {
    appearance: AvatarAppearance;
    equippedItems: AvatarEquippedItems;
  };
  topBadge: {
    code: string;
    title: string;
    iconUrl?: string;
  } | null;
  isCurrentUser: boolean;
}

export interface LeaderboardPageResponse {
  items: LeaderboardEntry[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  subject?: LeaderboardSubjectSlug;
  scopeHint?: string;
}

export interface LeaderboardMeResponse {
  rank: number | null;
  totalXp: number;
  periodXp: number;
  weeklyXp: number;
  level: number;
  completedMissions: number;
  participatingStudents: number;
  xpToNextRank: number;
  personalBestRank: number | null;
  optedOut: boolean;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  subject?: LeaderboardSubjectSlug;
  scopeHint?: string;
}

export type FlameTier = 'none' | 'spark' | 'blaze' | 'inferno' | 'phoenix' | 'cosmic';

export interface WeeklyCalendarDay {
  dateKey: string;
  dayLabel: string;
  status: 'completed' | 'freeze_used' | 'today_pending' | 'missed' | 'upcoming';
  activitiesCount: number;
}

export interface StreakSummary {
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  learnedToday: boolean;
  atRisk: boolean;
  canUseFreezeForYesterday: boolean;
  availableFreezes: number;
  maxFreezes: number;
  totalFreezesUsed: number;
  lastFreezeUsedDateKey: string | null;
  lastActiveDateKey: string | null;
  timezone: string;
  todayDateKey: string;
  flameTier: FlameTier;
  weeklyCalendar: WeeklyCalendarDay[];
  nextMilestone: {
    days: number;
    title: string;
    rewardLabel: string;
    daysRemaining: number;
    progressPercentage: number;
  } | null;
  claimedMilestones: number[];
}

export interface StreakHistoryItem {
  dateKey: string;
  status: 'completed' | 'freeze_used';
  activitiesCount: number;
  activities: Array<{
    activityType: string;
    activityId: string;
    title: string | null;
    completedAt: string;
  }>;
}

export interface StreakRewardItem {
  days: number;
  title: string;
  xp: number;
  freezeBonus: number;
  achievementCode: string | null;
  avatarItemKey: string | null;
  rewardLabel: string;
  flameTier: FlameTier;
  claimed: boolean;
  unlocked: boolean;
}

export interface SubjectConquerorRecord {
  subjectSlug: string;
  subjectName: string;
  mapName: string;
  titleAwarded: string;
  crownItemKey: string;
  unlockedItemKeys: string[];
  xpBonusAwarded: number;
  achievementCode: string;
  conqueredAt: string;
}

export interface ConquerorEventPayload {
  triggered: boolean;
  subjectSlug: string;
  subjectName: string;
  kingdomName: string;
  conquerorTitle: string;
  crownItemKey: string;
  xpBonus: number;
  achievementCode: string;
  accentColor: string;
  unlockedRewards: Array<{
    itemKey: string;
    name: string;
    category: string;
    rarity: string;
  }>;
}

export interface PublicLeaderboardProfile {
  studentId: string;
  displayName: string;
  level: number;
  totalXp: number;
  completedMissions: number;
  currentStreakDays: number;
  classGrade?: string;
  school?: string;
  schoolLocation?: string;
  avatar: {
    appearance: AvatarAppearance;
    equippedItems: AvatarEquippedItems;
  };
  achievements: Array<{
    code: string;
    title: string;
    description: string;
    iconUrl?: string;
    unlockedAt: string;
  }>;
}
