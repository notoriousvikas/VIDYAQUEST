import { Types } from 'mongoose';
import { AppError } from '../../../middleware/errorHandler';
import { SubjectModel } from '../../catalog/models/Subject.model';
import { AchievementModel } from '../../gamification/models/Achievement.model';
import { MissionModel } from '../../gamification/models/Mission.model';
import { StudentMissionProgressModel } from '../../gamification/models/StudentMissionProgress.model';
import { UserAchievementModel } from '../../gamification/models/UserAchievement.model';
import { rewardService } from '../../gamification/services/reward.service';
import { SubjectMapModel } from '../../gamification/models/SubjectMap.model';
import { XP_PER_LEVEL, xpService } from '../../gamification/services/xp.service';
import { normalizeTimezone, streakService } from '../../gamification/services/streak.service';
import { StudentStreakModel } from '../../gamification/models/StudentStreak.model';
import { UserModel } from '../../identity/models/User.model';
import { AvatarItemModel } from '../models/AvatarItem.model';
import { DailyQuestProgressModel } from '../models/DailyQuestProgress.model';
import { StudentActivityModel, StudentActivityType } from '../models/StudentActivity.model';
import {
  AvatarAppearanceConfig,
  AvatarEquippedItemsConfig,
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
  IStudentAvatar,
  StudentAvatarModel,
} from '../models/StudentAvatar.model';
import { SavedOutfitModel } from '../models/SavedOutfit.model';
import { StudentProfileModel } from '../models/StudentProfile.model';
import { ensureStudentDefaultsSeeded } from './seedStudentDefaults.service';

const DAILY_QUEST_TEMPLATES = [
  {
    questKey: 'daily-mission-1',
    title: 'Realm Explorer',
    description: 'Complete 1 learning mission in any subject world today.',
    targetCount: 1,
    xpReward: 40,
  },
  {
    questKey: 'daily-science-spark',
    title: 'Knowledge Spark',
    description: 'Complete 1 quest to keep your learning momentum alive.',
    targetCount: 1,
    xpReward: 45,
  },
  {
    questKey: 'daily-pathfinder',
    title: 'Pathfinder Challenge',
    description: 'Conquer 1 mission and earn stars toward your next level.',
    targetCount: 1,
    xpReward: 50,
  },
];

function getTodayDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getDailyQuestTemplateForDate(dateKey: string) {
  const dayNum = Number(dateKey.replace(/-/g, '')) || 0;
  return DAILY_QUEST_TEMPLATES[dayNum % DAILY_QUEST_TEMPLATES.length];
}

export class StudentDashboardService {
  async recordActivity(input: {
    studentId: string;
    activityType: StudentActivityType;
    description: string;
    referenceId?: string;
    xpDelta?: number;
  }) {
    return StudentActivityModel.create({
      studentId: input.studentId,
      activityType: input.activityType,
      description: input.description,
      referenceId: input.referenceId,
      xpDelta: input.xpDelta,
    });
  }

  async getOrCreateProfile(studentId: string) {
    let profile = await StudentProfileModel.findOne({ studentId });
    if (!profile) {
      const user = Types.ObjectId.isValid(studentId)
        ? await UserModel.findById(studentId).lean()
        : null;
      profile = await StudentProfileModel.create({
        studentId,
        displayName: user?.name ?? 'Young Explorer',
        classGrade: user?.grade ?? 'Grade 8',
        school: '',
        schoolLocation: '',
        preferredLanguage: 'English',
        interests: ['Science', 'Mathematics'],
      });
    }
    return profile;
  }

  async getOrCreateDailyQuest(studentId: string) {
    const dateKey = getTodayDateKey();
    let quest = await DailyQuestProgressModel.findOne({ studentId, dateKey });
    if (!quest) {
      const tpl = getDailyQuestTemplateForDate(dateKey);
      quest = await DailyQuestProgressModel.create({
        studentId,
        dateKey,
        questKey: tpl.questKey,
        title: tpl.title,
        description: tpl.description,
        targetCount: tpl.targetCount,
        currentCount: 0,
        xpReward: tpl.xpReward,
        completed: false,
      }).catch(async (err) => {
        if (err?.code === 11000) {
          const existing = await DailyQuestProgressModel.findOne({ studentId, dateKey });
          if (existing) return existing;
        }
        throw err;
      });
    }
    return quest;
  }

  async evaluateAndUnlockRewards(
    studentId: string,
    preloaded?: {
      progress: Awaited<ReturnType<typeof xpService.getOrCreateProgress>>;
      completedMissions: Array<{ subjectId: Types.ObjectId; missionId: Types.ObjectId }>;
      subjects: Array<{ _id: Types.ObjectId; slug: string }>;
      achievements: Array<{
        _id: Types.ObjectId;
        code: string;
        title: string;
        description: string;
        category: string;
        xpBonus: number;
        iconUrl?: string;
      }>;
      existingUserAchs: Array<{
        achievementId: Types.ObjectId;
        unlockedAt: Date;
        claimed?: boolean;
      }>;
      allItems: Array<{
        itemKey: string;
        name: string;
        unlockType: string;
        unlockRequirement: {
          minLevel?: number;
          minXp?: number;
          achievementCode?: string;
          minMissions?: number;
        };
      }>;
      avatar: IStudentAvatar | null;
    },
  ) {
    if (!preloaded) {
      await ensureStudentDefaultsSeeded();
    }

    const [progress, completedMissions, subjects, achievements, existingUserAchs, allItems, avatar] =
      preloaded
        ? [
            preloaded.progress,
            preloaded.completedMissions,
            preloaded.subjects,
            preloaded.achievements,
            preloaded.existingUserAchs,
            preloaded.allItems,
            preloaded.avatar,
          ]
        : await Promise.all([
            xpService.getOrCreateProgress(studentId),
            StudentMissionProgressModel.find({ studentId, status: 'COMPLETED' })
              .select('subjectId missionId')
              .lean(),
            SubjectModel.find({ isActive: true }).select('_id slug').lean(),
            AchievementModel.find({ isActive: true }).lean(),
            UserAchievementModel.find({ userId: studentId }).lean(),
            AvatarItemModel.find({ isActive: true }).lean(),
            StudentAvatarModel.findOne({ studentId }),
          ]);

    const subjectSlugById = new Map(subjects.map((s) => [s._id.toString(), s.slug]));
    const completedCount = completedMissions.length;
    const completedSubjectSlugs = new Set(
      completedMissions
        .map((m) => subjectSlugById.get(m.subjectId.toString()))
        .filter((slug): slug is string => Boolean(slug)),
    );
    const scienceCount = completedMissions.filter((m) => {
      const slug = subjectSlugById.get(m.subjectId.toString());
      return slug === 'chemistry' || slug === 'physics' || slug === 'biology';
    }).length;
    const mathCount = completedMissions.filter(
      (m) => subjectSlugById.get(m.subjectId.toString()) === 'mathematics',
    ).length;

    const unlockedAchIds = new Set(existingUserAchs.map((ua) => ua.achievementId.toString()));
    const unlockedAchCodes = new Set(
      achievements
        .filter((a) => unlockedAchIds.has(a._id.toString()))
        .map((a) => a.code),
    );

    const qualifyingAchs = achievements.filter((ach) => {
      if (unlockedAchIds.has(ach._id.toString())) return false;
      if (ach.code === 'FIRST_STEPS' && completedCount >= 1) return true;
      if (ach.code === 'CURIOUS_MIND' && completedCount >= 10) return true;
      if (ach.code === 'SCIENCE_EXPLORER' && scienceCount >= 5) return true;
      if (ach.code === 'PROBLEM_SOLVER' && mathCount >= 5) return true;
      if (ach.code === 'INNOVATION_STAR' && progress.level >= 3) return true;
      if (ach.code === 'OPPORTUNITY_SEEKER' && completedSubjectSlugs.size >= 2) return true;
      return false;
    });

    const newlyUnlockedAchievements: string[] = [];
    const mergedUserAchs = [...existingUserAchs];

    if (qualifyingAchs.length > 0) {
      const createdResults = await Promise.all(
        qualifyingAchs.map((ach) =>
          UserAchievementModel.create({
            userId: studentId,
            achievementId: ach._id,
            unlockedAt: new Date(),
          })
            .then((created) => ({ ach, created }))
            .catch((err) => {
              if (err?.code === 11000) return { ach, created: null };
              throw err;
            }),
        ),
      );

      const activityWrites: Promise<unknown>[] = [];
      for (const { ach, created } of createdResults) {
        if (created) {
          unlockedAchCodes.add(ach.code);
          newlyUnlockedAchievements.push(ach.title);
          mergedUserAchs.push({
            achievementId: ach._id,
            unlockedAt: created.unlockedAt,
            claimed: created.claimed,
          });
          activityWrites.push(
            this.recordActivity({
              studentId,
              activityType: 'achievement_unlocked',
              description: `Unlocked achievement: ${ach.title}`,
              referenceId: ach._id.toString(),
            }),
          );
        }
      }
      if (activityWrites.length > 0) {
        await Promise.all(activityWrites);
      }
    }

    // Evaluate avatar items
    let currentAvatar = avatar;
    if (!currentAvatar) {
      try {
        currentAvatar = await StudentAvatarModel.create({
          studentId,
          appearance: DEFAULT_AVATAR_APPEARANCE,
          equippedItems: DEFAULT_EQUIPPED_ITEMS,
          unlockedItemKeys: allItems
            .filter((i) => i.unlockType === 'free')
            .map((i) => i.itemKey),
        });
      } catch (err: unknown) {
        const mongoErr = err as { code?: number };
        if (mongoErr?.code === 11000) {
          currentAvatar = await StudentAvatarModel.findOne({ studentId });
        } else {
          throw err;
        }
      }
      if (!currentAvatar) {
        throw new AppError('Failed to initialize student avatar', 500, 'AVATAR_INIT_FAILED');
      }
    }

    const unlockedSet = new Set(currentAvatar.unlockedItemKeys);
    const newlyUnlockedItems: string[] = [];

    for (const item of allItems) {
      if (unlockedSet.has(item.itemKey)) continue;

      let qualifies = false;
      if (item.unlockType === 'free') qualifies = true;
      if (item.unlockType === 'level' && progress.level >= (item.unlockRequirement.minLevel ?? 1)) {
        qualifies = true;
      }
      if (item.unlockType === 'xp' && progress.totalXp >= (item.unlockRequirement.minXp ?? 0)) {
        qualifies = true;
      }
      if (
        item.unlockType === 'milestone' &&
        completedCount >= (item.unlockRequirement.minMissions ?? 1)
      ) {
        qualifies = true;
      }
      if (
        item.unlockType === 'achievement' &&
        item.unlockRequirement.achievementCode &&
        unlockedAchCodes.has(item.unlockRequirement.achievementCode)
      ) {
        qualifies = true;
      }

      if (qualifies) {
        unlockedSet.add(item.itemKey);
        newlyUnlockedItems.push(item.name);
      }
    }

    if (newlyUnlockedItems.length > 0 || unlockedSet.size !== currentAvatar.unlockedItemKeys.length) {
      currentAvatar.unlockedItemKeys = Array.from(unlockedSet);
      await currentAvatar.save();
      if (newlyUnlockedItems.length > 0) {
        await this.recordActivity({
          studentId,
          activityType: 'avatar_unlocked',
          description: `Unlocked avatar gear: ${newlyUnlockedItems.join(', ')}`,
        });
      }
    }

    return {
      avatar: currentAvatar,
      newlyUnlockedAchievements,
      newlyUnlockedItems,
      userAchievements: mergedUserAchs,
      allItems,
    };
  }

  async onMissionStarted(studentId: string, missionId: string, subjectId: Types.ObjectId) {
    const [profile, subject, mission] = await Promise.all([
      this.getOrCreateProfile(studentId),
      SubjectModel.findById(subjectId).select('slug name').lean(),
      MissionModel.findById(missionId).select('title').lean(),
    ]);

    if (subject?.slug) {
      profile.lastVisitedSubjectSlug = subject.slug;
    }
    profile.lastAttemptedMissionId = missionId;
    await profile.save();

    await this.recordActivity({
      studentId,
      activityType: 'mission_started',
      description: `Started mission: ${mission?.title ?? 'Quest'}`,
      referenceId: missionId,
    });
  }

  async onMissionCompleted(input: {
    studentId: string;
    missionId: string;
    missionTitle: string;
    subjectId: Types.ObjectId;
    xpAwarded: number;
    leveledUp: boolean;
    newLevel: number;
  }) {
    const [profile, subject, dailyQuest] = await Promise.all([
      this.getOrCreateProfile(input.studentId),
      SubjectModel.findById(input.subjectId).select('slug name').lean(),
      this.getOrCreateDailyQuest(input.studentId),
    ]);

    if (subject?.slug) {
      profile.lastVisitedSubjectSlug = subject.slug;
    }
    profile.lastAttemptedMissionId = input.missionId;
    await profile.save();

    await this.recordActivity({
      studentId: input.studentId,
      activityType: 'mission_completed',
      description: `Completed ${input.missionTitle}${subject ? ` in ${subject.name}` : ''}`,
      referenceId: input.missionId,
      xpDelta: input.xpAwarded,
    });

    if (input.leveledUp) {
      await this.recordActivity({
        studentId: input.studentId,
        activityType: 'level_up',
        description: `Reached Level ${input.newLevel}!`,
      });
    }

    if (!dailyQuest.completed) {
      dailyQuest.currentCount = Math.min(dailyQuest.targetCount, dailyQuest.currentCount + 1);
      if (dailyQuest.currentCount >= dailyQuest.targetCount) {
        dailyQuest.completed = true;
        dailyQuest.completedAt = new Date();
        await dailyQuest.save();

        await xpService.awardXp({
          userId: input.studentId,
          amount: dailyQuest.xpReward,
          sourceType: 'streak_bonus',
          sourceId: dailyQuest._id.toString(),
          idempotencyKey: `daily-quest:${input.studentId}:${dailyQuest.dateKey}`,
          description: `Daily Quest complete: ${dailyQuest.title}`,
        });

        await this.recordActivity({
          studentId: input.studentId,
          activityType: 'daily_quest_completed',
          description: `Completed Daily Quest: ${dailyQuest.title}`,
          referenceId: dailyQuest._id.toString(),
          xpDelta: dailyQuest.xpReward,
        });
      } else {
        await dailyQuest.save();
      }
    }

    await this.evaluateAndUnlockRewards(input.studentId);
  }

  async getDashboard(studentId: string) {
    await ensureStudentDefaultsSeeded();

    const [
      profile,
      progress,
      subjectDocs,
      subjectMaps,
      publishedMissions,
      missionRecords,
      dailyQuest,
      activities,
      achievementDocs,
      existingUserAchs,
      allItems,
      avatarDoc,
      streakSummary,
    ] = await Promise.all([
      this.getOrCreateProfile(studentId),
      xpService.getOrCreateProgress(studentId),
      SubjectModel.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
      SubjectMapModel.find({ isPublished: true }).sort({ version: -1 }).lean(),
      MissionModel.find({ isPublished: true })
        .sort({ sequence: 1 })
        .select('_id title slug subjectId difficulty xpReward missionType estimatedDurationMinutes prerequisites')
        .lean(),
      StudentMissionProgressModel.find({ studentId }).lean(),
      this.getOrCreateDailyQuest(studentId),
      StudentActivityModel.find({ studentId }).sort({ createdAt: -1 }).limit(12).lean(),
      AchievementModel.find({ isActive: true }).lean(),
      UserAchievementModel.find({ userId: studentId }).lean(),
      AvatarItemModel.find({ isActive: true }).lean(),
      StudentAvatarModel.findOne({ studentId }),
      streakService.getStreakSummary(studentId).catch(() => null),
    ]);

    const completedRecords = missionRecords.filter((m) => m.status === 'COMPLETED');
    const inProgressRecord = missionRecords.find((m) => m.status === 'IN_PROGRESS');

    const rewardEval = await this.evaluateAndUnlockRewards(studentId, {
      progress,
      completedMissions: completedRecords,
      subjects: subjectDocs,
      achievements: achievementDocs,
      existingUserAchs,
      allItems,
      avatar: avatarDoc,
    });

    const mapBySubject = new Map<string, (typeof subjectMaps)[number]>();
    for (const m of subjectMaps) {
      const key = m.subjectId.toString();
      if (!mapBySubject.has(key)) mapBySubject.set(key, m);
    }

    const totalBySubject = new Map<string, number>();
    for (const mission of publishedMissions) {
      const key = mission.subjectId.toString();
      totalBySubject.set(key, (totalBySubject.get(key) ?? 0) + 1);
    }

    const completedBySubject = new Map<string, number>();
    for (const rec of completedRecords) {
      const key = rec.subjectId.toString();
      completedBySubject.set(key, (completedBySubject.get(key) ?? 0) + 1);
    }

    const subjects = subjectDocs.map((subject) => {
      const idStr = subject._id.toString();
      const activeMap = mapBySubject.get(idStr);
      const totalMissions = totalBySubject.get(idStr) ?? 0;
      const completedMissions = completedBySubject.get(idStr) ?? 0;
      const completionPercentage =
        totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

      return {
        id: idStr,
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        icon: subject.icon,
        map: activeMap
          ? {
              id: activeMap._id.toString(),
              mapName: activeMap.mapName,
              mapSlug: activeMap.mapSlug,
              previewAsset: activeMap.previewAsset,
              theme: activeMap.theme,
              version: activeMap.version,
            }
          : null,
        totalMissions,
        completedMissions,
        completionPercentage,
      };
    });

    const userAchMap = new Map(
      rewardEval.userAchievements.map((ua) => [ua.achievementId.toString(), ua]),
    );
    const achievements = achievementDocs.map((ach) => {
      const unlocked = userAchMap.get(ach._id.toString());
      return {
        id: ach._id.toString(),
        code: ach.code,
        title: ach.title,
        description: ach.description,
        category: ach.category,
        xpBonus: ach.xpBonus,
        iconUrl: ach.iconUrl,
        unlocked: Boolean(unlocked),
        unlockedAt: unlocked?.unlockedAt ?? null,
        claimed: unlocked?.claimed ?? false,
      };
    });
    const unlockedAchievements = achievements.filter((a) => a.unlocked);

    const completedIds = new Set(completedRecords.map((m) => m.missionId.toString()));

    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const missionById = new Map(publishedMissions.map((m) => [m._id.toString(), m]));

    // Recommended next mission: in-progress first, then first unlocked available mission
    const inProgressMissionDoc = inProgressRecord
      ? missionById.get(inProgressRecord.missionId.toString())
      : undefined;
    const lastAttemptedMissionDoc = profile.lastAttemptedMissionId
      ? missionById.get(profile.lastAttemptedMissionId)
      : undefined;

    const recommendedMissionDoc =
      inProgressMissionDoc ??
      publishedMissions.find((m) => {
        if (completedIds.has(m._id.toString())) return false;
        return m.prerequisites.every((p) => completedIds.has(p.toString()));
      }) ??
      publishedMissions[0] ??
      null;

    const formatMissionSummary = (m?: (typeof publishedMissions)[number] | null) => {
      if (!m) return null;
      const subj = subjectById.get(m.subjectId.toString());
      return {
        id: m._id.toString(),
        title: m.title,
        difficulty: m.difficulty,
        xpReward: m.xpReward,
        subjectSlug: subj?.slug ?? 'chemistry',
        subjectName: subj?.name ?? 'Chemistry',
        mapName: subj?.map?.mapName ?? 'World Map',
      };
    };

    const totalLearningMinutes = completedRecords.reduce((sum, rec) => {
      const m = missionById.get(rec.missionId.toString());
      return sum + (m?.estimatedDurationMinutes ?? 10);
    }, 0);

    const completedExperiments = completedRecords.filter((rec) => {
      const m = missionById.get(rec.missionId.toString());
      return m?.missionType === 'Virtual experiment';
    }).length;

    const currentLevelXp = progress.totalXp % XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - currentLevelXp;

    return {
      profile: {
        studentId: profile.studentId,
        displayName: profile.displayName,
        classGrade: profile.classGrade,
        school: profile.school,
        schoolLocation: profile.schoolLocation ?? '',
        preferredLanguage: profile.preferredLanguage,
        timezone: profile.timezone ?? 'UTC',
        activeTitle: profile.activeTitle ?? null,
        conqueredSubjects: profile.conqueredSubjects ?? [],
        interests: profile.interests,
        learningPreferences: profile.learningPreferences,
        accessibilitySettings: profile.accessibilitySettings,
        leaderboardOptOut: Boolean(profile.leaderboardOptOut),
        showSchoolOnLeaderboard: Boolean(profile.showSchoolOnLeaderboard),
      },
      avatar: {
        appearance: rewardEval.avatar.appearance,
        equippedItems: rewardEval.avatar.equippedItems,
        unlockedItemKeys: rewardEval.avatar.unlockedItemKeys,
        updatedAt: rewardEval.avatar.updatedAt,
      },
      xp: {
        totalXp: progress.totalXp,
        level: progress.level,
        currentLevelXp,
        xpPerLevel: XP_PER_LEVEL,
        xpToNextLevel,
        progressPercentage: Math.round((currentLevelXp / XP_PER_LEVEL) * 100),
      },
      statistics: {
        totalXp: progress.totalXp,
        level: progress.level,
        completedMissions: completedRecords.length,
        totalMissions: publishedMissions.length,
        totalLearningMinutes,
        completedExperiments,
        competitionsParticipated: 0,
        achievementsEarned: unlockedAchievements.length,
        totalAchievements: achievements.length,
        currentStreakDays: streakSummary?.currentStreakDays ?? progress.currentStreakDays,
        longestStreakDays: streakSummary?.longestStreakDays ?? progress.longestStreakDays,
      },
      streak: streakSummary,
      subjectProgress: subjects.map((s) => ({
        ...s,
        levelLabel:
          s.completionPercentage >= 80
            ? 'Mastery'
            : s.completionPercentage >= 40
              ? 'Explorer'
              : 'Initiate',
      })),
      continueAdventure: {
        lastVisitedSubjectSlug:
          profile.lastVisitedSubjectSlug ??
          formatMissionSummary(recommendedMissionDoc)?.subjectSlug ??
          subjects[0]?.slug ??
          'chemistry',
        lastAttemptedMission: formatMissionSummary(lastAttemptedMissionDoc),
        inProgressMission: formatMissionSummary(inProgressMissionDoc),
        recommendedNextMission: formatMissionSummary(recommendedMissionDoc),
      },
      dailyQuest: {
        id: dailyQuest._id.toString(),
        dateKey: dailyQuest.dateKey,
        questKey: dailyQuest.questKey,
        title: dailyQuest.title,
        description: dailyQuest.description,
        targetCount: dailyQuest.targetCount,
        currentCount: dailyQuest.currentCount,
        xpReward: dailyQuest.xpReward,
        completed: dailyQuest.completed,
        completedAt: dailyQuest.completedAt ?? null,
      },
      achievements: achievements.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.title,
        description: a.description,
        category: a.category,
        xpBonus: a.xpBonus,
        icon: a.iconUrl ?? 'award',
        unlocked: a.unlocked,
        earnedAt: a.unlockedAt,
        unlockCondition: a.description,
      })),
      recentActivity: activities.map((act) => ({
        id: act._id.toString(),
        activityType: act.activityType,
        description: act.description,
        referenceId: act.referenceId ?? null,
        xpDelta: act.xpDelta ?? null,
        createdAt: act.createdAt,
      })),
    };
  }

  async getAvatarState(studentId: string) {
    const evalResult = await this.evaluateAndUnlockRewards(studentId);
    const items = evalResult.allItems as Array<{
      _id: Types.ObjectId;
      itemKey: string;
      name: string;
      category: string;
      subCategory?: string;
      assetReference: string;
      description: string;
      subjectSlug?: string;
      rarity?: string;
      unlockType: string;
      unlockRequirement: Record<string, unknown>;
    }>;
    const unlockedSet = new Set(evalResult.avatar.unlockedItemKeys);

    return {
      avatar: {
        appearance: evalResult.avatar.appearance,
        equippedItems: evalResult.avatar.equippedItems,
        unlockedItemKeys: evalResult.avatar.unlockedItemKeys,
        activeOutfitId: evalResult.avatar.activeOutfitId ?? null,
        updatedAt: evalResult.avatar.updatedAt,
      },
      items: items.map((item) => ({
        id: item._id.toString(),
        itemKey: item.itemKey,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory ?? null,
        assetReference: item.assetReference,
        description: item.description,
        subjectSlug: item.subjectSlug ?? null,
        rarity: item.rarity ?? 'common',
        unlockType: item.unlockType,
        unlockRequirement: item.unlockRequirement,
        unlocked: unlockedSet.has(item.itemKey),
      })),
    };
  }

  async updateAvatar(
    studentId: string,
    payload: {
      appearance?: Partial<AvatarAppearanceConfig>;
      equippedItems?: Partial<AvatarEquippedItemsConfig>;
      activeOutfitId?: string | null;
    },
  ) {
    const evalResult = await this.evaluateAndUnlockRewards(studentId);
    const avatar = evalResult.avatar;
    const unlockedSet = new Set(avatar.unlockedItemKeys);

    const allItems = await AvatarItemModel.find({ isActive: true }).lean();
    const itemByKey = new Map(allItems.map((i) => [i.itemKey, i]));

    const validateAndAssign = (
      category: string,
      itemKey: string,
      apply: (val: string) => void,
    ) => {
      const item = itemByKey.get(itemKey);
      if (!item || item.category !== category) {
        throw new AppError(`Invalid avatar item "${itemKey}" for ${category}`, 400, 'INVALID_AVATAR_ITEM');
      }
      if (!unlockedSet.has(itemKey)) {
        throw new AppError(
          `Avatar item "${item.name}" is locked (${item.unlockRequirement.label})`,
          403,
          'AVATAR_ITEM_LOCKED',
        );
      }
      apply(itemKey);
    };

    if (payload.appearance) {
      for (const [k, v] of Object.entries(payload.appearance)) {
        if (typeof v === 'string') {
          validateAndAssign(k, v, (val) => {
            (avatar.appearance as unknown as Record<string, string>)[k] = val;
          });
        }
      }
      // Compatibility rule: equipping separates clears full-body costume unless costume itself was set
      if (
        !payload.appearance.costume &&
        (payload.appearance.outfit || payload.appearance.jacket || payload.appearance.bottoms)
      ) {
        avatar.appearance.costume = 'costume-none';
      }
    }

    if (payload.equippedItems) {
      for (const [k, v] of Object.entries(payload.equippedItems)) {
        if (typeof v === 'string') {
          validateAndAssign(k, v, (val) => {
            (avatar.equippedItems as unknown as Record<string, string>)[k] = val;
          });
        }
      }
    }

    if (payload.activeOutfitId !== undefined) {
      avatar.activeOutfitId = payload.activeOutfitId;
    } else {
      avatar.activeOutfitId = null;
    }

    await avatar.save();
    await this.recordActivity({
      studentId,
      activityType: 'avatar_updated',
      description: 'Customized student avatar appearance',
    });

    return {
      appearance: avatar.appearance,
      equippedItems: avatar.equippedItems,
      unlockedItemKeys: avatar.unlockedItemKeys,
      activeOutfitId: avatar.activeOutfitId ?? null,
      updatedAt: avatar.updatedAt,
    };
  }

  async listSavedOutfits(studentId: string) {
    const outfits = await SavedOutfitModel.find({ studentId }).sort({ createdAt: -1 }).lean();
    return outfits.map((o) => ({
      id: o._id.toString(),
      outfitName: o.outfitName,
      appearance: o.appearance,
      equippedItems: o.equippedItems,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  }

  async createSavedOutfit(
    studentId: string,
    payload: {
      outfitName: string;
      appearance?: Record<string, string>;
      equippedItems?: Record<string, string>;
    },
  ) {
    const existingCount = await SavedOutfitModel.countDocuments({ studentId });
    if (existingCount >= 15) {
      throw new AppError('Maximum of 15 saved outfits reached', 400, 'MAX_OUTFITS_REACHED');
    }

    const evalResult = await this.evaluateAndUnlockRewards(studentId);
    const unlockedSet = new Set(evalResult.avatar.unlockedItemKeys);

    const nextAppearance = { ...DEFAULT_AVATAR_APPEARANCE, ...evalResult.avatar.appearance, ...payload.appearance };
    const nextEquipped = { ...DEFAULT_EQUIPPED_ITEMS, ...evalResult.avatar.equippedItems, ...payload.equippedItems };

    for (const val of [...Object.values(nextAppearance), ...Object.values(nextEquipped)]) {
      if (typeof val === 'string' && !unlockedSet.has(val)) {
        throw new AppError(`Cannot save locked item "${val}" in outfit`, 403, 'AVATAR_ITEM_LOCKED');
      }
    }

    const created = await SavedOutfitModel.create({
      studentId,
      outfitName: payload.outfitName.trim(),
      appearance: nextAppearance,
      equippedItems: nextEquipped,
    });

    return {
      id: created._id.toString(),
      outfitName: created.outfitName,
      appearance: created.appearance,
      equippedItems: created.equippedItems,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateSavedOutfit(
    studentId: string,
    outfitId: string,
    payload: { outfitName?: string; equip?: boolean },
  ) {
    if (!Types.ObjectId.isValid(outfitId)) {
      throw new AppError('Invalid outfit ID', 400, 'INVALID_OUTFIT_ID');
    }
    const outfit = await SavedOutfitModel.findOne({ _id: outfitId, studentId });
    if (!outfit) {
      throw new AppError('Saved outfit not found', 404, 'OUTFIT_NOT_FOUND');
    }

    if (payload.outfitName) {
      outfit.outfitName = payload.outfitName.trim();
      await outfit.save();
    }

    if (payload.equip) {
      await this.updateAvatar(studentId, {
        appearance: outfit.appearance,
        equippedItems: outfit.equippedItems,
        activeOutfitId: outfit._id.toString(),
      });
    }

    return {
      id: outfit._id.toString(),
      outfitName: outfit.outfitName,
      appearance: outfit.appearance,
      equippedItems: outfit.equippedItems,
      createdAt: outfit.createdAt,
      updatedAt: outfit.updatedAt,
    };
  }

  async deleteSavedOutfit(studentId: string, outfitId: string) {
    if (!Types.ObjectId.isValid(outfitId)) {
      throw new AppError('Invalid outfit ID', 400, 'INVALID_OUTFIT_ID');
    }
    const deleted = await SavedOutfitModel.findOneAndDelete({ _id: outfitId, studentId });
    if (!deleted) {
      throw new AppError('Saved outfit not found', 404, 'OUTFIT_NOT_FOUND');
    }
    await StudentAvatarModel.updateOne(
      { studentId, activeOutfitId: outfitId },
      { $set: { activeOutfitId: null } },
    );
    return { deleted: true, id: outfitId };
  }

  async updateProfile(
    studentId: string,
    payload: {
      displayName?: string;
      classGrade?: string;
      school?: string;
      schoolLocation?: string;
      preferredLanguage?: string;
      timezone?: string;
      interests?: string[];
      learningPreferences?: Partial<{
        pace: 'relaxed' | 'balanced' | 'fast';
        visualMode: 'illustrated' | 'compact';
        audioHints: boolean;
      }>;
      accessibilitySettings?: Partial<{
        highContrast: boolean;
        reducedMotion: boolean;
        fontSize: 'small' | 'medium' | 'large';
      }>;
      leaderboardOptOut?: boolean;
      showSchoolOnLeaderboard?: boolean;
    },
  ) {
    const profile = await this.getOrCreateProfile(studentId);

    if (payload.displayName !== undefined) {
      profile.displayName = payload.displayName.trim();
      if (Types.ObjectId.isValid(studentId)) {
        await UserModel.updateOne(
          { _id: studentId },
          { $set: { name: profile.displayName } },
        );
      }
    }
    if (payload.classGrade !== undefined) {
      profile.classGrade = payload.classGrade.trim();
      if (Types.ObjectId.isValid(studentId)) {
        await UserModel.updateOne(
          { _id: studentId },
          { $set: { grade: profile.classGrade } },
        );
      }
    }
    if (payload.school !== undefined) profile.school = payload.school.trim();
    if (payload.schoolLocation !== undefined) {
      profile.schoolLocation = payload.schoolLocation.trim();
    }
    if (payload.preferredLanguage !== undefined) {
      profile.preferredLanguage = payload.preferredLanguage.trim();
    }
    if (payload.timezone !== undefined) {
      profile.timezone = normalizeTimezone(payload.timezone.trim());
      await StudentStreakModel.updateOne(
        { studentId },
        { $set: { timezone: profile.timezone } },
      );
    }
    if (payload.interests !== undefined) {
      profile.interests = payload.interests.map((i) => i.trim()).filter(Boolean).slice(0, 12);
    }
    if (payload.learningPreferences) {
      profile.learningPreferences = {
        ...profile.learningPreferences,
        ...payload.learningPreferences,
      };
    }
    if (payload.accessibilitySettings) {
      profile.accessibilitySettings = {
        ...profile.accessibilitySettings,
        ...payload.accessibilitySettings,
      };
    }
    if (payload.leaderboardOptOut !== undefined) {
      profile.leaderboardOptOut = payload.leaderboardOptOut;
    }
    if (payload.showSchoolOnLeaderboard !== undefined) {
      profile.showSchoolOnLeaderboard = payload.showSchoolOnLeaderboard;
    }

    await profile.save();
    await this.recordActivity({
      studentId,
      activityType: 'profile_updated',
      description: 'Updated student profile preferences',
    });

    return {
      studentId: profile.studentId,
      displayName: profile.displayName,
      classGrade: profile.classGrade,
      school: profile.school,
      schoolLocation: profile.schoolLocation ?? '',
      preferredLanguage: profile.preferredLanguage,
      timezone: profile.timezone ?? 'UTC',
      interests: profile.interests,
      learningPreferences: profile.learningPreferences,
      accessibilitySettings: profile.accessibilitySettings,
      leaderboardOptOut: Boolean(profile.leaderboardOptOut),
      showSchoolOnLeaderboard: Boolean(profile.showSchoolOnLeaderboard),
    };
  }

  async getAchievements(studentId: string) {
    await this.evaluateAndUnlockRewards(studentId);
    const list = await rewardService.listAchievementsForUser(studentId);
    return list.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.title,
      description: a.description,
      category: a.category,
      xpBonus: a.xpBonus,
      icon: a.iconUrl ?? 'award',
      unlocked: a.unlocked,
      earnedAt: a.unlockedAt,
      unlockCondition: a.description,
    }));
  }

  async getRecentActivity(studentId: string, limit = 20) {
    const items = await StudentActivityModel.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(Math.min(50, Math.max(1, limit)))
      .lean();

    return items.map((act) => ({
      id: act._id.toString(),
      activityType: act.activityType,
      description: act.description,
      referenceId: act.referenceId ?? null,
      xpDelta: act.xpDelta ?? null,
      createdAt: act.createdAt,
    }));
  }
}

export const studentDashboardService = new StudentDashboardService();
