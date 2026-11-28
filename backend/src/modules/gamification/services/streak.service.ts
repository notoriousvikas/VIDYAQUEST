import { Types } from 'mongoose';
import { AppError } from '../../../middleware/errorHandler';
import { StudentActivityModel } from '../../users/models/StudentActivity.model';
import {
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
  StudentAvatarModel,
} from '../../users/models/StudentAvatar.model';
import { StudentProfileModel } from '../../users/models/StudentProfile.model';
import { AchievementModel } from '../models/Achievement.model';
import {
  DailyLearningActivityModel,
  EligibleLearningActivityType,
} from '../models/DailyLearningActivity.model';
import { LearningActivityReceiptModel } from '../models/LearningActivityReceipt.model';
import { PlayerProgressModel } from '../models/PlayerProgress.model';
import { IStudentStreak, StudentStreakModel } from '../models/StudentStreak.model';
import { UserAchievementModel } from '../models/UserAchievement.model';
import {
  FlameTier,
  getFlameTierForStreak,
  MAX_STREAK_FREEZES,
  STREAK_MILESTONES,
  StreakMilestoneReward,
} from './streakRewards.config';
import { xpService } from './xp.service';

const DAY_MS = 86_400_000;
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ELIGIBLE_ACTIVITY_TYPES = new Set<EligibleLearningActivityType>([
  'lesson',
  'quiz',
  'chapter',
  'virtual_lab',
  'challenge',
]);

// Per-student async mutex to serialize concurrent streak updates safely
const studentLocks = new Map<string, Promise<unknown>>();

async function withStudentLock<T>(studentId: string, fn: () => Promise<T>): Promise<T> {
  const prev = studentLocks.get(studentId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => gate);
  studentLocks.set(studentId, chained);

  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (studentLocks.get(studentId) === chained) {
      studentLocks.delete(studentId);
    }
  }
}

export function normalizeTimezone(tz?: string): string {
  if (!tz || typeof tz !== 'string') return 'UTC';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

export function getLocalDateKey(date: Date, timezone = 'UTC'): string {
  const safeTz = normalizeTimezone(timezone);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function parseDateKeyUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

export function diffCalendarDays(fromKey: string, toKey: string): number {
  return Math.round((parseDateKeyUtcMs(toKey) - parseDateKeyUtcMs(fromKey)) / DAY_MS);
}

export function addCalendarDays(dateKey: string, delta: number): string {
  const d = new Date(parseDateKeyUtcMs(dateKey) + delta * DAY_MS);
  return d.toISOString().slice(0, 10);
}

export function getMondayToSundayWeekKeys(todayKey: string): Array<{ dateKey: string; dayLabel: string }> {
  const todayMs = parseDateKeyUtcMs(todayKey);
  const utcDay = new Date(todayMs).getUTCDay(); // 0=Sun, 1=Mon...6=Sat
  const offsetFromMonday = utcDay === 0 ? 6 : utcDay - 1;
  const mondayKey = addCalendarDays(todayKey, -offsetFromMonday);
  return WEEKDAY_LABELS.map((dayLabel, idx) => ({
    dateKey: addCalendarDays(mondayKey, idx),
    dayLabel,
  }));
}

export interface RecordStreakActivityInput {
  studentId: string;
  activityType: EligibleLearningActivityType;
  activityId: string;
  title?: string;
  now?: Date;
}

export interface RecordStreakActivityResult {
  counted: boolean;
  duplicate: boolean;
  streakExtended: boolean;
  freezeUsed: boolean;
  freezeUsedDateKey: string | null;
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  availableFreezes: number;
  flameTier: FlameTier;
  newlyClaimedMilestones: StreakMilestoneReward[];
}

export interface WeeklyCalendarDayView {
  dateKey: string;
  dayLabel: string;
  status: 'completed' | 'freeze_used' | 'today_pending' | 'missed' | 'upcoming';
  activitiesCount: number;
}

export interface StreakSummaryView {
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
  weeklyCalendar: WeeklyCalendarDayView[];
  nextMilestone: {
    days: number;
    title: string;
    rewardLabel: string;
    daysRemaining: number;
    progressPercentage: number;
  } | null;
  claimedMilestones: number[];
}

export class StreakService {
  async getOrCreateStreak(studentId: string, now = new Date()): Promise<IStudentStreak> {
    let streak = await StudentStreakModel.findOne({ studentId });
    if (!streak) {
      const profile = await StudentProfileModel.findOne({ studentId }).select('timezone').lean();
      const timezone = normalizeTimezone(profile?.timezone);
      try {
        streak = await StudentStreakModel.create({
          studentId,
          timezone,
          availableFreezes: 1,
          totalFreezesEarned: 1,
        });
      } catch (err: unknown) {
        const mongoErr = err as { code?: number };
        if (mongoErr?.code === 11000) {
          streak = await StudentStreakModel.findOne({ studentId });
        } else {
          throw err;
        }
      }
      if (!streak) {
        throw new AppError('Failed to initialize student streak', 500, 'STREAK_INIT_FAILED');
      }
    }

    // Keep timezone synced with profile if profile was updated
    const profile = await StudentProfileModel.findOne({ studentId }).select('timezone').lean();
    if (profile?.timezone) {
      const normalized = normalizeTimezone(profile.timezone);
      if (normalized !== streak.timezone) {
        streak.timezone = normalized;
        await streak.save();
      }
    }

    // Ensure PlayerProgress is synced
    void now;
    return streak;
  }

  private async syncPlayerProgress(
    studentId: string,
    currentStreakDays: number,
    longestStreakDays: number,
    now: Date,
  ) {
    await PlayerProgressModel.findOneAndUpdate(
      { userId: studentId },
      {
        $set: {
          currentStreakDays,
          longestStreakDays,
          lastActivityDate: now,
        },
        $setOnInsert: {
          totalXp: 0,
          level: 1,
        },
      },
      { upsert: true },
    );
  }

  private async evaluateAndClaimMilestones(
    studentId: string,
    streak: IStudentStreak,
  ): Promise<StreakMilestoneReward[]> {
    const claimedSet = new Set(streak.claimedMilestones);
    const newlyClaimed: StreakMilestoneReward[] = [];

    for (const milestone of STREAK_MILESTONES) {
      if (streak.currentStreakDays < milestone.days) continue;
      if (claimedSet.has(milestone.days)) continue;

      claimedSet.add(milestone.days);
      newlyClaimed.push(milestone);

      if (milestone.xp > 0) {
        await xpService.awardXp({
          userId: studentId,
          amount: milestone.xp,
          sourceType: 'streak_bonus',
          sourceId: `streak-${milestone.days}`,
          idempotencyKey: `streak-milestone:${studentId}:${milestone.days}`,
          description: `Streak Milestone (${milestone.days} days): ${milestone.title}`,
        });
      }

      if (milestone.freezeBonus > 0) {
        const room = Math.max(0, MAX_STREAK_FREEZES - streak.availableFreezes);
        const granted = Math.min(room, milestone.freezeBonus);
        streak.availableFreezes += granted;
        streak.totalFreezesEarned += granted;
      }

      if (milestone.achievementCode) {
        const ach = await AchievementModel.findOne({ code: milestone.achievementCode }).lean();
        if (ach) {
          await UserAchievementModel.create({
            userId: studentId,
            achievementId: ach._id,
            unlockedAt: new Date(),
          }).catch((err: unknown) => {
            const mongoErr = err as { code?: number };
            if (mongoErr?.code !== 11000) throw err;
          });
        }
      }

      if (milestone.avatarItemKey) {
        await StudentAvatarModel.findOneAndUpdate(
          { studentId },
          {
            $addToSet: { unlockedItemKeys: milestone.avatarItemKey },
            $setOnInsert: {
              appearance: DEFAULT_AVATAR_APPEARANCE,
              equippedItems: DEFAULT_EQUIPPED_ITEMS,
            },
          },
          { upsert: true },
        );
      }

      await StudentActivityModel.create({
        studentId,
        activityType: 'streak_milestone',
        description: `Reached ${milestone.days}-day learning streak! (${milestone.rewardLabel})`,
        xpDelta: milestone.xp > 0 ? milestone.xp : undefined,
      }).catch(() => undefined);
    }

    if (newlyClaimed.length > 0) {
      streak.claimedMilestones = Array.from(claimedSet).sort((a, b) => a - b);
    }

    return newlyClaimed;
  }

  async recordEligibleActivity(input: RecordStreakActivityInput): Promise<RecordStreakActivityResult> {
    if (!ELIGIBLE_ACTIVITY_TYPES.has(input.activityType)) {
      throw new AppError(
        `Activity type "${input.activityType}" is not eligible for streak credit`,
        400,
        'INELIGIBLE_STREAK_ACTIVITY',
      );
    }
    if (!input.activityId || !input.activityId.trim()) {
      throw new AppError('activityId is required', 400, 'INVALID_ACTIVITY_ID');
    }

    const now = input.now ?? new Date();
    const activityKey = `${input.activityType}:${input.activityId.trim()}`;

    return withStudentLock(input.studentId, async () => {
      const streak = await this.getOrCreateStreak(input.studentId, now);
      const todayKey = getLocalDateKey(now, streak.timezone);

      // Strict backend deduplication: repeating an already completed activity never counts
      try {
        await LearningActivityReceiptModel.create({
          studentId: input.studentId,
          activityKey,
          activityType: input.activityType,
          activityId: input.activityId.trim(),
          dateKey: todayKey,
        });
      } catch (err: unknown) {
        const mongoErr = err as { code?: number };
        if (mongoErr?.code === 11000) {
          return {
            counted: false,
            duplicate: true,
            streakExtended: false,
            freezeUsed: false,
            freezeUsedDateKey: null,
            currentStreakDays: streak.currentStreakDays,
            longestStreakDays: streak.longestStreakDays,
            totalActiveDays: streak.totalActiveDays,
            availableFreezes: streak.availableFreezes,
            flameTier: getFlameTierForStreak(streak.currentStreakDays),
            newlyClaimedMilestones: [],
          };
        }
        throw err;
      }

      let streakExtended = false;
      let freezeUsed = false;
      let freezeUsedDateKey: string | null = null;

      if (!streak.lastActiveDateKey) {
        // First eligible activity ever
        streak.currentStreakDays = 1;
        streak.longestStreakDays = Math.max(streak.longestStreakDays, 1);
        streak.totalActiveDays = 1;
        streak.lastActiveDateKey = todayKey;
        streakExtended = true;
      } else {
        const diff = diffCalendarDays(streak.lastActiveDateKey, todayKey);
        if (diff <= 0) {
          // Same calendar day (or clock skew): does not increment streak
          streakExtended = false;
        } else if (diff === 1) {
          // Consecutive calendar day
          streak.currentStreakDays += 1;
          streak.totalActiveDays += 1;
          streak.lastActiveDateKey = todayKey;
          streakExtended = true;
        } else if (diff === 2 && streak.availableFreezes > 0 && streak.currentStreakDays > 0) {
          // Missed exactly 1 day and freeze is available: protect missed day automatically
          const missedKey = addCalendarDays(streak.lastActiveDateKey, 1);
          await DailyLearningActivityModel.findOneAndUpdate(
            { studentId: input.studentId, dateKey: missedKey },
            {
              $setOnInsert: {
                studentId: input.studentId,
                dateKey: missedKey,
                status: 'freeze_used',
                activities: [],
                xpAwarded: 0,
              },
            },
            { upsert: true },
          );
          streak.availableFreezes -= 1;
          streak.totalFreezesUsed += 1;
          streak.lastFreezeUsedDateKey = missedKey;
          streak.currentStreakDays += 1;
          streak.totalActiveDays += 1;
          streak.lastActiveDateKey = todayKey;
          freezeUsed = true;
          freezeUsedDateKey = missedKey;
          streakExtended = true;
        } else {
          // Streak broken: restart at 1
          streak.currentStreakDays = 1;
          streak.totalActiveDays += 1;
          streak.lastActiveDateKey = todayKey;
          streakExtended = true;
        }
      }

      if (streak.currentStreakDays > streak.longestStreakDays) {
        streak.longestStreakDays = streak.currentStreakDays;
      }

      // Record activity in today's DailyLearningActivity document
      await DailyLearningActivityModel.findOneAndUpdate(
        { studentId: input.studentId, dateKey: todayKey },
        {
          $set: { status: 'completed' },
          $push: {
            activities: {
              activityType: input.activityType,
              activityId: input.activityId.trim(),
              title: input.title,
              completedAt: now,
            },
          },
        },
        { upsert: true },
      );

      const newlyClaimedMilestones = await this.evaluateAndClaimMilestones(input.studentId, streak);
      await streak.save();
      await this.syncPlayerProgress(
        input.studentId,
        streak.currentStreakDays,
        streak.longestStreakDays,
        now,
      );

      return {
        counted: true,
        duplicate: false,
        streakExtended,
        freezeUsed,
        freezeUsedDateKey,
        currentStreakDays: streak.currentStreakDays,
        longestStreakDays: streak.longestStreakDays,
        totalActiveDays: streak.totalActiveDays,
        availableFreezes: streak.availableFreezes,
        flameTier: getFlameTierForStreak(streak.currentStreakDays),
        newlyClaimedMilestones,
      };
    });
  }

  async useStreakFreeze(studentId: string, now = new Date()): Promise<{
    freezeUsed: boolean;
    protectedDateKey: string;
    summary: StreakSummaryView;
  }> {
    return withStudentLock(studentId, async () => {
      const streak = await this.getOrCreateStreak(studentId, now);
      const todayKey = getLocalDateKey(now, streak.timezone);

      if (streak.availableFreezes <= 0) {
        throw new AppError('No streak freezes available', 400, 'NO_FREEZES_AVAILABLE');
      }
      if (!streak.lastActiveDateKey || streak.currentStreakDays <= 0) {
        throw new AppError('No active streak to protect with a freeze', 400, 'NO_ACTIVE_STREAK');
      }

      const diff = diffCalendarDays(streak.lastActiveDateKey, todayKey);
      if (diff <= 1) {
        throw new AppError(
          'Your streak is already safe for today; no missed day to freeze',
          400,
          'FREEZE_NOT_NEEDED',
        );
      }
      if (diff > 2) {
        throw new AppError(
          'More than one calendar day was missed; streak freeze can only protect one missed day',
          400,
          'STREAK_ALREADY_BROKEN',
        );
      }

      const missedKey = addCalendarDays(streak.lastActiveDateKey, 1);
      await DailyLearningActivityModel.findOneAndUpdate(
        { studentId, dateKey: missedKey },
        {
          $setOnInsert: {
            studentId,
            dateKey: missedKey,
            status: 'freeze_used',
            activities: [],
            xpAwarded: 0,
          },
        },
        { upsert: true },
      );

      streak.availableFreezes -= 1;
      streak.totalFreezesUsed += 1;
      streak.lastFreezeUsedDateKey = missedKey;
      streak.lastActiveDateKey = missedKey;
      await streak.save();

      await StudentActivityModel.create({
        studentId,
        activityType: 'streak_freeze_used',
        description: `Used a Streak Freeze to protect ${missedKey}`,
      }).catch(() => undefined);

      const summary = await this.getStreakSummary(studentId, now);
      return {
        freezeUsed: true,
        protectedDateKey: missedKey,
        summary,
      };
    });
  }

  async getStreakSummary(studentId: string, now = new Date()): Promise<StreakSummaryView> {
    const streak = await this.getOrCreateStreak(studentId, now);
    const todayKey = getLocalDateKey(now, streak.timezone);

    const diff = streak.lastActiveDateKey
      ? diffCalendarDays(streak.lastActiveDateKey, todayKey)
      : null;

    const learnedToday = diff === 0;
    const canUseFreezeForYesterday =
      diff === 2 && streak.currentStreakDays > 0 && streak.availableFreezes > 0;

    // Effective streak visible right now
    let effectiveStreak = streak.currentStreakDays;
    if (diff !== null) {
      if (diff > 2 || (diff === 2 && streak.availableFreezes <= 0)) {
        effectiveStreak = 0;
      }
    }

    const atRisk = !learnedToday && effectiveStreak > 0;

    const weekDays = getMondayToSundayWeekKeys(todayKey);
    const weekKeys = weekDays.map((w) => w.dateKey);
    const weekDocs = await DailyLearningActivityModel.find({
      studentId,
      dateKey: { $in: weekKeys },
    }).lean();

    const docByKey = new Map(weekDocs.map((d) => [d.dateKey, d]));

    const weeklyCalendar: WeeklyCalendarDayView[] = weekDays.map(({ dateKey, dayLabel }) => {
      const doc = docByKey.get(dateKey);
      if (doc) {
        return {
          dateKey,
          dayLabel,
          status: doc.status === 'freeze_used' ? 'freeze_used' : 'completed',
          activitiesCount: doc.activities?.length ?? 0,
        };
      }
      const dayDiff = diffCalendarDays(todayKey, dateKey);
      if (dayDiff === 0) {
        return { dateKey, dayLabel, status: 'today_pending', activitiesCount: 0 };
      }
      if (dayDiff > 0) {
        return { dateKey, dayLabel, status: 'upcoming', activitiesCount: 0 };
      }
      return { dateKey, dayLabel, status: 'missed', activitiesCount: 0 };
    });

    const nextM = STREAK_MILESTONES.find((m) => effectiveStreak < m.days) ?? null;
    const prevThreshold = nextM
      ? (STREAK_MILESTONES.filter((m) => m.days < nextM.days).pop()?.days ?? 0)
      : 100;

    const nextMilestone = nextM
      ? {
          days: nextM.days,
          title: nextM.title,
          rewardLabel: nextM.rewardLabel,
          daysRemaining: Math.max(0, nextM.days - effectiveStreak),
          progressPercentage: Math.min(
            100,
            Math.max(
              0,
              Math.round(
                ((effectiveStreak - prevThreshold) / Math.max(1, nextM.days - prevThreshold)) * 100,
              ),
            ),
          ),
        }
      : null;

    return {
      currentStreakDays: effectiveStreak,
      longestStreakDays: streak.longestStreakDays,
      totalActiveDays: streak.totalActiveDays,
      learnedToday,
      atRisk,
      canUseFreezeForYesterday,
      availableFreezes: streak.availableFreezes,
      maxFreezes: MAX_STREAK_FREEZES,
      totalFreezesUsed: streak.totalFreezesUsed,
      lastFreezeUsedDateKey: streak.lastFreezeUsedDateKey,
      lastActiveDateKey: streak.lastActiveDateKey,
      timezone: streak.timezone,
      todayDateKey: todayKey,
      flameTier: getFlameTierForStreak(effectiveStreak),
      weeklyCalendar,
      nextMilestone,
      claimedMilestones: streak.claimedMilestones,
    };
  }

  async getStreakHistory(studentId: string, limitDays = 30) {
    const safeLimit = Math.min(90, Math.max(1, limitDays));
    const docs = await DailyLearningActivityModel.find({ studentId })
      .sort({ dateKey: -1 })
      .limit(safeLimit)
      .lean();

    return docs.map((d) => ({
      dateKey: d.dateKey,
      status: d.status,
      activitiesCount: d.activities?.length ?? 0,
      activities: (d.activities ?? []).map((a) => ({
        activityType: a.activityType,
        activityId: a.activityId,
        title: a.title ?? null,
        completedAt: a.completedAt,
      })),
    }));
  }

  async getStreakRewards(studentId: string, now = new Date()) {
    const streak = await this.getOrCreateStreak(studentId, now);
    const summary = await this.getStreakSummary(studentId, now);
    const claimedSet = new Set(streak.claimedMilestones);

    return STREAK_MILESTONES.map((m) => ({
      days: m.days,
      title: m.title,
      xp: m.xp,
      freezeBonus: m.freezeBonus,
      achievementCode: m.achievementCode ?? null,
      avatarItemKey: m.avatarItemKey ?? null,
      rewardLabel: m.rewardLabel,
      flameTier: m.flameTier,
      claimed: claimedSet.has(m.days),
      unlocked: summary.currentStreakDays >= m.days || claimedSet.has(m.days),
    }));
  }
}

export const streakService = new StreakService();
