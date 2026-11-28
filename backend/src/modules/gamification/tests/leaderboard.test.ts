import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubjectModel } from '../../catalog/models/Subject.model';
import { StudentAvatarModel } from '../../users/models/StudentAvatar.model';
import { StudentProfileModel } from '../../users/models/StudentProfile.model';
import { AchievementModel } from '../models/Achievement.model';
import { PlayerProgressModel } from '../models/PlayerProgress.model';
import { StudentMissionProgressModel } from '../models/StudentMissionProgress.model';
import { UserAchievementModel } from '../models/UserAchievement.model';
import { XPTransactionModel } from '../models/XPTransaction.model';
import { getPeriodStartUtc, LeaderboardService } from '../services/leaderboard.service';
import { XpService } from '../services/xp.service';

function mockLeanChain<T>(value: T) {
  return {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

describe('LeaderboardService & XP Integrity', () => {
  const service = new LeaderboardService();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('computes UTC weekly (Monday 00:00) and monthly (1st 00:00) period boundaries', () => {
    const sampleDate = new Date('2026-11-26T14:35:00.000Z'); // Thursday
    const weekStart = getPeriodStartUtc('weekly', sampleDate);
    const monthStart = getPeriodStartUtc('monthly', sampleDate);
    const allTime = getPeriodStartUtc('all-time', sampleDate);

    expect(weekStart?.toISOString()).toBe('2026-11-23T00:00:00.000Z');
    expect(monthStart?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(allTime).toBeNull();
  });

  it('orders global rankings by XP, then completed missions, then earlier achievement time, and excludes opted-out students', async () => {
    const profiles = [
      {
        studentId: 'stu-a',
        displayName: 'Aarav',
        classGrade: 'Grade 8',
        school: 'Vidya Public',
        showSchoolOnLeaderboard: true,
      },
      {
        studentId: 'stu-b',
        displayName: 'Bhavna',
        classGrade: 'Grade 8',
        school: 'Vidya Public',
        showSchoolOnLeaderboard: false,
      },
      {
        studentId: 'stu-c',
        displayName: 'Chirag',
        classGrade: 'Grade 9',
        school: 'Other School',
        showSchoolOnLeaderboard: true,
      },
    ];

    vi.spyOn(StudentProfileModel, 'find').mockImplementation((filter?: Record<string, unknown>) => {
      if (filter && filter.leaderboardOptOut === true) {
        return mockLeanChain([{ studentId: 'stu-opted-out' }]) as never;
      }
      return mockLeanChain(profiles) as never;
    });

    vi.spyOn(PlayerProgressModel, 'find').mockReturnValue(
      mockLeanChain([
        // Tied at 200 XP: stu-b has more completed missions (4 vs 2), so stu-b beats stu-a
        {
          userId: 'stu-a',
          totalXp: 200,
          level: 3,
          currentStreakDays: 2,
          updatedAt: new Date('2026-11-20T10:00:00Z'),
        },
        {
          userId: 'stu-b',
          totalXp: 200,
          level: 3,
          currentStreakDays: 5,
          updatedAt: new Date('2026-11-22T10:00:00Z'),
        },
        {
          userId: 'stu-c',
          totalXp: 350,
          level: 4,
          currentStreakDays: 7,
          updatedAt: new Date('2026-11-21T10:00:00Z'),
        },
      ]) as never,
    );

    vi.spyOn(StudentMissionProgressModel, 'aggregate').mockResolvedValue([
      { _id: 'stu-a', count: 2 },
      { _id: 'stu-b', count: 4 },
      { _id: 'stu-c', count: 5 },
    ] as never);

    vi.spyOn(StudentAvatarModel, 'find').mockReturnValue(mockLeanChain([]) as never);
    vi.spyOn(UserAchievementModel, 'find').mockReturnValue(mockLeanChain([]) as never);
    vi.spyOn(AchievementModel, 'find').mockReturnValue(mockLeanChain([]) as never);

    const page1 = await service.getLeaderboard({
      type: 'global',
      period: 'all-time',
      page: 1,
      limit: 2,
      requesterId: 'stu-a',
    });

    expect(page1.total).toBe(3);
    expect(page1.hasMore).toBe(true);
    expect(page1.items.map((i) => i.studentId)).toEqual(['stu-c', 'stu-b']);
    expect(page1.items[0].rank).toBe(1);
    expect(page1.items[0].school).toBe('Other School');
    expect(page1.items[1].school).toBeUndefined(); // showSchoolOnLeaderboard is false

    const page2 = await service.getLeaderboard({
      type: 'global',
      period: 'all-time',
      page: 2,
      limit: 2,
      requesterId: 'stu-a',
    });
    expect(page2.hasMore).toBe(false);
    expect(page2.items[0].studentId).toBe('stu-a');
    expect(page2.items[0].rank).toBe(3);
    expect(page2.items[0].isCurrentUser).toBe(true);
  });

  it('uses subject-specific XP and weekly/monthly transactions for subject and period leaderboards', async () => {
    const chemId = new Types.ObjectId();
    vi.spyOn(SubjectModel, 'findOne').mockReturnValue(mockLeanChain({ _id: chemId }) as never);
    vi.spyOn(StudentProfileModel, 'find').mockImplementation((filter?: Record<string, unknown>) => {
      if (filter && filter.leaderboardOptOut === true) {
        return mockLeanChain([]) as never;
      }
      return mockLeanChain([
        {
          studentId: 'stu-1',
          displayName: 'Chem Whiz',
          classGrade: 'Grade 8',
          school: 'Vidya Public',
          showSchoolOnLeaderboard: false,
        },
      ]) as never;
    });

    const aggSpy = vi.spyOn(XPTransactionModel, 'aggregate').mockResolvedValue([
      { _id: 'stu-1', xp: 150, achievedAt: new Date('2026-11-25T09:00:00Z') },
    ] as never);

    vi.spyOn(PlayerProgressModel, 'find').mockReturnValue(
      mockLeanChain([{ userId: 'stu-1', totalXp: 500, level: 6, currentStreakDays: 3 }]) as never,
    );
    vi.spyOn(StudentMissionProgressModel, 'aggregate').mockResolvedValue([
      { _id: 'stu-1', count: 3 },
    ] as never);
    vi.spyOn(StudentAvatarModel, 'find').mockReturnValue(mockLeanChain([]) as never);
    vi.spyOn(UserAchievementModel, 'find').mockReturnValue(mockLeanChain([]) as never);
    vi.spyOn(AchievementModel, 'find').mockReturnValue(mockLeanChain([]) as never);

    const res = await service.getLeaderboard({
      type: 'subject',
      period: 'weekly',
      subject: 'chemistry',
      page: 1,
      limit: 20,
      requesterId: 'stu-1',
    });

    expect(aggSpy).toHaveBeenCalledTimes(1);
    const pipeline = aggSpy.mock.calls[0][0] as Array<{ $match?: Record<string, unknown> }>;
    expect(pipeline[0].$match?.subjectSlug).toBe('chemistry');
    expect(pipeline[0].$match?.createdAt).toBeDefined();

    expect(res.items[0].xp).toBe(150);
    expect(res.items[0].totalXp).toBe(500);
  });

  it('returns sensible empty-state rank summary for a new student with zero XP', async () => {
    vi.spyOn(StudentProfileModel, 'findOne').mockReturnValue(
      mockLeanChain({ leaderboardOptOut: false, bestGlobalRank: undefined }) as never,
    );
    vi.spyOn(PlayerProgressModel, 'findOne').mockReturnValue(mockLeanChain(null) as never);
    vi.spyOn(StudentMissionProgressModel, 'countDocuments').mockResolvedValue(0 as never);
    vi.spyOn(XPTransactionModel, 'aggregate').mockResolvedValue([] as never);
    vi.spyOn(StudentProfileModel, 'find').mockReturnValue(mockLeanChain([]) as never);
    vi.spyOn(PlayerProgressModel, 'find').mockReturnValue(mockLeanChain([]) as never);
    vi.spyOn(StudentMissionProgressModel, 'aggregate').mockResolvedValue([] as never);

    const me = await service.getMyRank('new-student', { type: 'global', period: 'all-time' });

    expect(me.rank).toBeNull();
    expect(me.totalXp).toBe(0);
    expect(me.participatingStudents).toBe(0);
    expect(me.optedOut).toBe(false);
  });

  it('blocks public profile access for opted-out students', async () => {
    vi.spyOn(StudentProfileModel, 'findOne').mockReturnValue(
      mockLeanChain({
        studentId: 'stu-private',
        displayName: 'Hidden',
        leaderboardOptOut: true,
      }) as never,
    );
    vi.spyOn(PlayerProgressModel, 'findOne').mockReturnValue(mockLeanChain(null) as never);
    vi.spyOn(StudentAvatarModel, 'findOne').mockReturnValue(mockLeanChain(null) as never);
    vi.spyOn(StudentMissionProgressModel, 'countDocuments').mockResolvedValue(0 as never);
    vi.spyOn(UserAchievementModel, 'find').mockReturnValue(mockLeanChain([]) as never);
    vi.spyOn(AchievementModel, 'find').mockReturnValue(mockLeanChain([]) as never);

    await expect(
      service.getPublicStudentDetails('stu-private', 'other-student'),
    ).rejects.toThrow('This student profile is private');
  });

  it('prevents duplicate XP awards when idempotencyKey collides (11000)', async () => {
    const xpService = new XpService();
    vi.spyOn(XPTransactionModel, 'create').mockRejectedValue({ code: 11000 });
    vi.spyOn(PlayerProgressModel, 'findOne').mockResolvedValue({
      userId: 'stu-1',
      totalXp: 100,
      level: 2,
    } as never);

    const result = await xpService.awardXp({
      userId: 'stu-1',
      amount: 50,
      sourceType: 'node_completion',
      sourceId: 'mission-1',
      subjectSlug: 'chemistry',
      idempotencyKey: 'mission:stu-1:mission-1',
      description: 'Duplicate mission completion',
    });

    expect(result.xpAwarded).toBe(0);
    expect(result.leveledUp).toBe(false);
    expect(result.progress.totalXp).toBe(100);
  });
});
