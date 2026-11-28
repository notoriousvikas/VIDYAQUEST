import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentActivityModel } from '../../users/models/StudentActivity.model';
import { StudentAvatarModel } from '../../users/models/StudentAvatar.model';
import { StudentProfileModel } from '../../users/models/StudentProfile.model';
import { AchievementModel } from '../models/Achievement.model';
import { DailyLearningActivityModel } from '../models/DailyLearningActivity.model';
import { LearningActivityReceiptModel } from '../models/LearningActivityReceipt.model';
import { PlayerProgressModel } from '../models/PlayerProgress.model';
import { StudentStreakModel } from '../models/StudentStreak.model';
import {
  diffCalendarDays,
  getLocalDateKey,
  getMondayToSundayWeekKeys,
  StreakService,
} from '../services/streak.service';
import { xpService } from '../services/xp.service';

interface InMemoryStreakState {
  studentId: string;
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  lastActiveDateKey: string | null;
  availableFreezes: number;
  totalFreezesEarned: number;
  totalFreezesUsed: number;
  lastFreezeUsedDateKey: string | null;
  claimedMilestones: number[];
  timezone: string;
  save: () => Promise<InMemoryStreakState>;
}

function setupInMemoryStreakMocks(initial?: Partial<InMemoryStreakState>) {
  const receipts = new Set<string>();
  const dailyDocs = new Map<string, { status: string; activities: unknown[] }>();
  let streakDoc: InMemoryStreakState = {
    studentId: 'stu-1',
    currentStreakDays: 0,
    longestStreakDays: 0,
    totalActiveDays: 0,
    lastActiveDateKey: null,
    availableFreezes: 1,
    totalFreezesEarned: 1,
    totalFreezesUsed: 0,
    lastFreezeUsedDateKey: null,
    claimedMilestones: [],
    timezone: 'UTC',
    ...initial,
    save: async () => streakDoc,
  };

  vi.spyOn(StudentProfileModel, 'findOne').mockReturnValue({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue({ timezone: streakDoc.timezone }),
  } as never);

  vi.spyOn(StudentStreakModel, 'findOne').mockImplementation((async () => streakDoc) as never);
  vi.spyOn(StudentStreakModel, 'create').mockImplementation((async () => streakDoc) as never);

  vi.spyOn(LearningActivityReceiptModel, 'create').mockImplementation(
    (async (doc: { activityKey: string }) => {
      if (receipts.has(doc.activityKey)) {
        const err = new Error('Duplicate key') as Error & { code?: number };
        err.code = 11000;
        throw err;
      }
      receipts.add(doc.activityKey);
      return doc;
    }) as never,
  );

  vi.spyOn(DailyLearningActivityModel, 'findOneAndUpdate').mockImplementation(
    (async (
      filter: { dateKey: string },
      update: { $set?: { status?: string }; $setOnInsert?: { status?: string }; $push?: { activities?: unknown } },
    ) => {
      const existing = dailyDocs.get(filter.dateKey) ?? {
        status: update.$setOnInsert?.status ?? 'completed',
        activities: [],
      };
      if (update.$set?.status) existing.status = update.$set.status;
      if (update.$push?.activities) existing.activities.push(update.$push.activities);
      dailyDocs.set(filter.dateKey, existing);
      return existing;
    }) as never,
  );

  vi.spyOn(DailyLearningActivityModel, 'find').mockImplementation(
    ((filter: { dateKey?: { $in?: string[] } }) => {
      const keys = filter.dateKey?.$in ?? [];
      const rows = keys
        .filter((k) => dailyDocs.has(k))
        .map((k) => ({ dateKey: k, ...dailyDocs.get(k)! }));
      return { lean: vi.fn().mockResolvedValue(rows) };
    }) as never,
  );

  vi.spyOn(PlayerProgressModel, 'findOneAndUpdate').mockResolvedValue({} as never);
  vi.spyOn(StudentAvatarModel, 'findOneAndUpdate').mockResolvedValue({} as never);
  vi.spyOn(AchievementModel, 'findOne').mockReturnValue({
    lean: vi.fn().mockResolvedValue(null),
  } as never);
  vi.spyOn(StudentActivityModel, 'create').mockResolvedValue({} as never);

  const awardXpSpy = vi.spyOn(xpService, 'awardXp').mockResolvedValue({
    progress: {} as never,
    xpAwarded: 30,
    leveledUp: false,
  });

  return { streakDoc, receipts, dailyDocs, awardXpSpy };
}

describe('Daily Learning Streak System', () => {
  const service = new StreakService();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('computes local calendar dates accurately across timezones and Monday-Sunday weeks', () => {
    // 2026-11-26T01:00:00Z is Nov 26 in Asia/Kolkata (+05:30) but Nov 25 in America/New_York (-05:00)
    const utcMoment = new Date('2026-11-26T01:00:00.000Z');
    expect(getLocalDateKey(utcMoment, 'Asia/Kolkata')).toBe('2026-11-26');
    expect(getLocalDateKey(utcMoment, 'America/New_York')).toBe('2026-11-25');
    expect(diffCalendarDays('2026-11-25', '2026-11-26')).toBe(1);

    const week = getMondayToSundayWeekKeys('2026-11-26'); // Thursday
    expect(week).toHaveLength(7);
    expect(week[0]).toEqual({ dateKey: '2026-11-23', dayLabel: 'Mon' });
    expect(week[6]).toEqual({ dateKey: '2026-11-29', dayLabel: 'Sun' });
  });

  it('increments streak on consecutive days, ignores same-day multiples, and claims 3-day milestone once', async () => {
    const { awardXpSpy } = setupInMemoryStreakMocks({ timezone: 'Asia/Kolkata' });

    const day1 = await service.recordEligibleActivity({
      studentId: 'stu-1',
      activityType: 'lesson',
      activityId: 'm1',
      now: new Date('2026-11-24T10:00:00+05:30'),
    });
    expect(day1.currentStreakDays).toBe(1);
    expect(day1.totalActiveDays).toBe(1);

    // Same day second distinct activity -> still streak 1
    const day1Second = await service.recordEligibleActivity({
      studentId: 'stu-1',
      activityType: 'quiz',
      activityId: 'm2',
      now: new Date('2026-11-24T18:00:00+05:30'),
    });
    expect(day1Second.counted).toBe(true);
    expect(day1Second.streakExtended).toBe(false);
    expect(day1Second.currentStreakDays).toBe(1);

    // Duplicate activity -> rejected idempotently
    const dup = await service.recordEligibleActivity({
      studentId: 'stu-1',
      activityType: 'lesson',
      activityId: 'm1',
      now: new Date('2026-11-25T09:00:00+05:30'),
    });
    expect(dup.duplicate).toBe(true);
    expect(dup.counted).toBe(false);
    expect(dup.currentStreakDays).toBe(1);

    // Day 2 & Day 3 -> hits 3-day milestone (30 XP)
    await service.recordEligibleActivity({
      studentId: 'stu-1',
      activityType: 'virtual_lab',
      activityId: 'm3',
      now: new Date('2026-11-25T10:00:00+05:30'),
    });
    const day3 = await service.recordEligibleActivity({
      studentId: 'stu-1',
      activityType: 'challenge',
      activityId: 'm4',
      now: new Date('2026-11-26T10:00:00+05:30'),
    });

    expect(day3.currentStreakDays).toBe(3);
    expect(day3.longestStreakDays).toBe(3);
    expect(day3.newlyClaimedMilestones.map((m) => m.days)).toEqual([3]);
    expect(awardXpSpy).toHaveBeenCalledTimes(1);
  });

  it('uses a streak freeze to protect one missed day and breaks streak when freezes are exhausted', async () => {
    setupInMemoryStreakMocks({
      currentStreakDays: 4,
      longestStreakDays: 4,
      totalActiveDays: 4,
      lastActiveDateKey: '2026-11-20',
      availableFreezes: 1,
      timezone: 'UTC',
    });

    // Return on Nov 22 (missed Nov 21) -> consumes 1 freeze and extends streak to 5
    const protectedRes = await service.recordEligibleActivity({
      studentId: 'stu-1',
      activityType: 'lesson',
      activityId: 'm-after-freeze',
      now: new Date('2026-11-22T12:00:00Z'),
    });
    expect(protectedRes.freezeUsed).toBe(true);
    expect(protectedRes.freezeUsedDateKey).toBe('2026-11-21');
    expect(protectedRes.currentStreakDays).toBe(5);
    expect(protectedRes.availableFreezes).toBe(0);

    // Miss Nov 23 with 0 freezes left, return Nov 24 -> streak resets to 1, longest stays 5
    const brokenRes = await service.recordEligibleActivity({
      studentId: 'stu-1',
      activityType: 'lesson',
      activityId: 'm-after-break',
      now: new Date('2026-11-24T12:00:00Z'),
    });
    expect(brokenRes.freezeUsed).toBe(false);
    expect(brokenRes.currentStreakDays).toBe(1);
    expect(brokenRes.longestStreakDays).toBe(5);
  });

  it('prevents unlimited manual freeze usage when no missed day or no freezes remain', async () => {
    setupInMemoryStreakMocks({
      currentStreakDays: 3,
      longestStreakDays: 3,
      lastActiveDateKey: '2026-11-24',
      availableFreezes: 1,
      timezone: 'UTC',
    });

    // Manual freeze on Nov 26 (missed Nov 25) succeeds
    const manualRes = await service.useStreakFreeze('stu-1', new Date('2026-11-26T10:00:00Z'));
    expect(manualRes.freezeUsed).toBe(true);
    expect(manualRes.protectedDateKey).toBe('2026-11-25');

    // Second manual freeze attempt fails with NO_FREEZES_AVAILABLE
    await expect(
      service.useStreakFreeze('stu-1', new Date('2026-11-26T11:00:00Z')),
    ).rejects.toThrow('No streak freezes available');
  });

  it('serializes concurrent activity requests safely for the same student', async () => {
    setupInMemoryStreakMocks({
      currentStreakDays: 2,
      longestStreakDays: 2,
      totalActiveDays: 2,
      lastActiveDateKey: '2026-11-25',
      timezone: 'UTC',
    });

    const now = new Date('2026-11-26T10:00:00Z');
    const results = await Promise.all([
      service.recordEligibleActivity({
        studentId: 'stu-1',
        activityType: 'lesson',
        activityId: 'c1',
        now,
      }),
      service.recordEligibleActivity({
        studentId: 'stu-1',
        activityType: 'quiz',
        activityId: 'c2',
        now,
      }),
      service.recordEligibleActivity({
        studentId: 'stu-1',
        activityType: 'lesson',
        activityId: 'c1',
        now,
      }),
    ]);

    const finalStreak = Math.max(...results.map((r) => r.currentStreakDays));
    expect(finalStreak).toBe(3);
    const totalMilestonesClaimed = results.reduce(
      (sum, r) => sum + r.newlyClaimedMilestones.length,
      0,
    );
    expect(totalMilestonesClaimed).toBe(1);
  });
});
