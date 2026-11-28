import { AppError } from '../../../middleware/errorHandler';
import { SubjectModel } from '../../catalog/models/Subject.model';
import {
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
  StudentAvatarModel,
} from '../../users/models/StudentAvatar.model';
import { StudentProfileModel } from '../../users/models/StudentProfile.model';
import { AchievementModel } from '../models/Achievement.model';
import { PlayerProgressModel } from '../models/PlayerProgress.model';
import { StudentMissionProgressModel } from '../models/StudentMissionProgress.model';
import { UserAchievementModel } from '../models/UserAchievement.model';
import { XPTransactionModel } from '../models/XPTransaction.model';

export type LeaderboardType = 'global' | 'school' | 'class' | 'subject';
export type LeaderboardPeriod = 'all-time' | 'weekly' | 'monthly';
export type LeaderboardSubjectSlug = 'chemistry' | 'physics' | 'biology' | 'mathematics' | 'coding';

export interface LeaderboardAvatarView {
  appearance: {
    skinTone: string;
    hairstyle: string;
    hairColor: string;
    face: string;
    eyes: string;
    outfit: string;
    shoes: string;
  };
  equippedItems: {
    headwear: string;
    glasses: string;
    backpack: string;
    badge: string;
    accessory: string;
  };
}

export interface LeaderboardBadgeView {
  code: string;
  title: string;
  iconUrl?: string;
}

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
  avatar: LeaderboardAvatarView;
  topBadge: LeaderboardBadgeView | null;
  isCurrentUser: boolean;
}

export interface LeaderboardPage {
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

export interface LeaderboardMeSummary {
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
  avatar: LeaderboardAvatarView;
  achievements: Array<{
    code: string;
    title: string;
    description: string;
    iconUrl?: string;
    unlockedAt: Date;
  }>;
}

export interface LeaderboardFilterOptions {
  type?: LeaderboardType;
  period?: LeaderboardPeriod;
  subject?: LeaderboardSubjectSlug;
  page?: number;
  limit?: number;
  requesterId?: string;
}

interface RankedCandidate {
  studentId: string;
  xp: number;
  totalXp: number;
  level: number;
  completedMissions: number;
  currentStreakDays: number;
  achievedAt: number;
  displayName: string;
  classGrade: string;
  school: string;
  schoolLocation: string;
  showSchoolOnLeaderboard: boolean;
}

/**
 * Computes UTC start timestamp for weekly (Monday 00:00 UTC) or monthly (1st 00:00 UTC) periods.
 */
export function getPeriodStartUtc(period: LeaderboardPeriod, now = new Date()): Date | null {
  if (period === 'all-time') return null;
  if (period === 'monthly') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  }
  // Weekly: ISO week starting Monday 00:00:00.000 UTC
  const day = now.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = day === 0 ? 6 : day - 1;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0, 0),
  );
}

const DEFAULT_AVATAR: LeaderboardAvatarView = {
  appearance: { ...DEFAULT_AVATAR_APPEARANCE },
  equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
};

export class LeaderboardService {
  private async computeRankedCandidates(
    options: Required<Pick<LeaderboardFilterOptions, 'type' | 'period'>> & {
      subject?: LeaderboardSubjectSlug;
      requesterId?: string;
    },
  ): Promise<{ candidates: RankedCandidate[]; scopeHint?: string }> {
    const { type, period, subject, requesterId } = options;

    if (type === 'subject' && !subject) {
      throw new AppError('Subject is required for subject leaderboard', 400, 'SUBJECT_REQUIRED');
    }

    let requesterProfile: { school?: string; classGrade?: string } | null = null;
    if ((type === 'school' || type === 'class') && requesterId) {
      requesterProfile = await StudentProfileModel.findOne({ studentId: requesterId })
        .select('school classGrade')
        .lean();
    }

    if (type === 'school') {
      const schoolName = requesterProfile?.school?.trim();
      if (!schoolName) {
        return {
          candidates: [],
          scopeHint: 'Add your school in Profile & Preferences to see your School Leaderboard.',
        };
      }
    }

    if (type === 'class') {
      const classGrade = requesterProfile?.classGrade?.trim();
      if (!classGrade) {
        return {
          candidates: [],
          scopeHint: 'Set your class/grade in Profile & Preferences to see your Class Leaderboard.',
        };
      }
    }

    const profileFilter: Record<string, unknown> = { leaderboardOptOut: { $ne: true } };
    if (type === 'school' && requesterProfile?.school) {
      const escaped = requesterProfile.school.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      profileFilter.school = { $regex: new RegExp(`^${escaped}$`, 'i') };
    } else if (type === 'class' && requesterProfile?.classGrade) {
      const escaped = requesterProfile.classGrade.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      profileFilter.classGrade = { $regex: new RegExp(`^${escaped}$`, 'i') };
    }

    const [eligibleProfiles, optedOutProfiles] = await Promise.all([
      StudentProfileModel.find(profileFilter)
        .select('studentId displayName classGrade school schoolLocation showSchoolOnLeaderboard')
        .lean(),
      type === 'global' || type === 'subject'
        ? StudentProfileModel.find({ leaderboardOptOut: true }).select('studentId').lean()
        : Promise.resolve([]),
    ]);

    const profileById = new Map(eligibleProfiles.map((p) => [p.studentId, p]));
    const optedOutSet = new Set(optedOutProfiles.map((p) => p.studentId));
    const scopedIds = eligibleProfiles.map((p) => p.studentId);

    const periodStart = getPeriodStartUtc(period);
    const useTransactionAggregation = type === 'subject' || periodStart !== null;

    let subjectDocId: unknown = null;
    if (type === 'subject' && subject) {
      const subj = await SubjectModel.findOne({ slug: subject }).select('_id').lean();
      subjectDocId = subj?._id ?? null;
    }

    const candidates: RankedCandidate[] = [];

    if (!useTransactionAggregation) {
      // All-time Global, School, or Class
      const progressQuery =
        type === 'global'
          ? { userId: { $nin: Array.from(optedOutSet) } }
          : { userId: { $in: scopedIds } };

      const [progressDocs, missionCounts] = await Promise.all([
        PlayerProgressModel.find(progressQuery)
          .select('userId totalXp level currentStreakDays updatedAt')
          .lean(),
        StudentMissionProgressModel.aggregate<{ _id: string; count: number }>([
          {
            $match:
              type === 'global'
                ? { status: 'COMPLETED', studentId: { $nin: Array.from(optedOutSet) } }
                : { status: 'COMPLETED', studentId: { $in: scopedIds } },
          },
          { $group: { _id: '$studentId', count: { $sum: 1 } } },
        ]),
      ]);

      const countMap = new Map(missionCounts.map((m) => [m._id, m.count]));

      for (const prog of progressDocs) {
        const prof = profileById.get(prog.userId);
        if ((type === 'school' || type === 'class') && !prof) continue;

        candidates.push({
          studentId: prog.userId,
          xp: prog.totalXp,
          totalXp: prog.totalXp,
          level: prog.level,
          completedMissions: countMap.get(prog.userId) ?? 0,
          currentStreakDays: prog.currentStreakDays,
          achievedAt: new Date(prog.updatedAt).getTime(),
          displayName: prof?.displayName ?? 'Young Explorer',
          classGrade: prof?.classGrade ?? '',
          school: prof?.school ?? '',
          schoolLocation: prof?.schoolLocation ?? '',
          showSchoolOnLeaderboard: Boolean(prof?.showSchoolOnLeaderboard),
        });
      }
    } else {
      // Period (weekly/monthly) and/or Subject leaderboard via XPTransactionModel aggregation
      const txMatch: Record<string, unknown> = {};
      if (periodStart) {
        txMatch.createdAt = { $gte: periodStart };
      }
      if (type === 'subject' && subject) {
        txMatch.subjectSlug = subject;
      }
      if (type === 'school' || type === 'class') {
        txMatch.userId = { $in: scopedIds };
      } else if (optedOutSet.size > 0) {
        txMatch.userId = { $nin: Array.from(optedOutSet) };
      }

      const txAgg = await XPTransactionModel.aggregate<{
        _id: string;
        xp: number;
        achievedAt: Date;
      }>([
        { $match: txMatch },
        {
          $group: {
            _id: '$userId',
            xp: { $sum: '$amount' },
            achievedAt: { $max: '$createdAt' },
          },
        },
        { $match: { xp: { $gt: 0 } } },
      ]);

      const userIds = txAgg.map((row) => row._id);
      if (userIds.length > 0) {
        const missionMatch: Record<string, unknown> = {
          studentId: { $in: userIds },
          status: 'COMPLETED',
        };
        if (type === 'subject' && subjectDocId) {
          missionMatch.subjectId = subjectDocId;
        }

        const [progressDocs, extraProfiles, missionCounts] = await Promise.all([
          PlayerProgressModel.find({ userId: { $in: userIds } })
            .select('userId totalXp level currentStreakDays')
            .lean(),
          type === 'global' || type === 'subject'
            ? StudentProfileModel.find({
                studentId: { $in: userIds },
                leaderboardOptOut: { $ne: true },
              })
                .select('studentId displayName classGrade school schoolLocation showSchoolOnLeaderboard')
                .lean()
            : Promise.resolve([]),
          StudentMissionProgressModel.aggregate<{ _id: string; count: number }>([
            { $match: missionMatch },
            { $group: { _id: '$studentId', count: { $sum: 1 } } },
          ]),
        ]);

        const progressMap = new Map(progressDocs.map((p) => [p.userId, p]));
        const countMap = new Map(missionCounts.map((m) => [m._id, m.count]));
        for (const prof of extraProfiles) {
          profileById.set(prof.studentId, prof);
        }

        for (const row of txAgg) {
          const prof = profileById.get(row._id);
          if ((type === 'school' || type === 'class') && !prof) continue;
          const prog = progressMap.get(row._id);

          candidates.push({
            studentId: row._id,
            xp: row.xp,
            totalXp: prog?.totalXp ?? row.xp,
            level: prog?.level ?? 1,
            completedMissions: countMap.get(row._id) ?? 0,
            currentStreakDays: prog?.currentStreakDays ?? 0,
            achievedAt: new Date(row.achievedAt).getTime(),
            displayName: prof?.displayName ?? 'Young Explorer',
            classGrade: prof?.classGrade ?? '',
            school: prof?.school ?? '',
            schoolLocation: prof?.schoolLocation ?? '',
            showSchoolOnLeaderboard: Boolean(prof?.showSchoolOnLeaderboard),
          });
        }
      }
    }

    // Tie-breaking rules:
    // 1. Higher XP
    // 2. More completed missions
    // 3. Earlier achievement of the tied XP total
    // 4. Deterministic studentId
    candidates.sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.completedMissions !== a.completedMissions) {
        return b.completedMissions - a.completedMissions;
      }
      if (a.achievedAt !== b.achievedAt) return a.achievedAt - b.achievedAt;
      return a.studentId.localeCompare(b.studentId);
    });

    return { candidates };
  }

  private async enrichEntries(
    slice: RankedCandidate[],
    startRank: number,
    type: LeaderboardType,
    requesterId?: string,
  ): Promise<LeaderboardEntry[]> {
    if (slice.length === 0) return [];

    const studentIds = slice.map((c) => c.studentId);
    const [avatars, userAchievements, achievements] = await Promise.all([
      StudentAvatarModel.find({ studentId: { $in: studentIds } })
        .select('studentId appearance equippedItems')
        .lean(),
      UserAchievementModel.find({ userId: { $in: studentIds } })
        .sort({ unlockedAt: -1 })
        .select('userId achievementId')
        .lean(),
      AchievementModel.find({ isActive: true }).select('_id code title iconUrl').lean(),
    ]);

    const avatarById = new Map(avatars.map((a) => [a.studentId, a]));
    const achById = new Map(achievements.map((a) => [a._id.toString(), a]));
    const topBadgeByUser = new Map<string, LeaderboardBadgeView>();

    for (const ua of userAchievements) {
      if (topBadgeByUser.has(ua.userId)) continue;
      const ach = achById.get(ua.achievementId.toString());
      if (ach) {
        topBadgeByUser.set(ua.userId, {
          code: ach.code,
          title: ach.title,
          iconUrl: ach.iconUrl,
        });
      }
    }

    return slice.map((c, idx) => {
      const av = avatarById.get(c.studentId);
      const allowSchool = type === 'school' || c.showSchoolOnLeaderboard;
      const allowClass = type === 'class' || type === 'school';

      return {
        rank: startRank + idx,
        studentId: c.studentId,
        userId: c.studentId,
        displayName: c.displayName,
        xp: c.xp,
        totalXp: c.totalXp,
        level: c.level,
        completedMissions: c.completedMissions,
        currentStreakDays: c.currentStreakDays,
        classGrade: allowClass && c.classGrade ? c.classGrade : undefined,
        school: allowSchool && c.school ? c.school : undefined,
        schoolLocation: allowSchool && c.schoolLocation ? c.schoolLocation : undefined,
        avatar: av
          ? {
              appearance: av.appearance,
              equippedItems: av.equippedItems,
            }
          : DEFAULT_AVATAR,
        topBadge: topBadgeByUser.get(c.studentId) ?? null,
        isCurrentUser: Boolean(requesterId && requesterId === c.studentId),
      };
    });
  }

  async getLeaderboard(options: LeaderboardFilterOptions): Promise<LeaderboardPage> {
    const type: LeaderboardType = options.type ?? 'global';
    const period: LeaderboardPeriod = options.period ?? 'all-time';
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const { candidates, scopeHint } = await this.computeRankedCandidates({
      type,
      period,
      subject: options.subject,
      requesterId: options.requesterId,
    });

    const total = candidates.length;
    const slice = candidates.slice(skip, skip + limit);
    const items = await this.enrichEntries(slice, skip + 1, type, options.requesterId);

    return {
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
      type,
      period,
      subject: options.subject,
      scopeHint,
    };
  }

  async getTopPlayers(page = 1, limit = 20): Promise<LeaderboardPage> {
    return this.getLeaderboard({ type: 'global', period: 'all-time', page, limit });
  }

  async getMyRank(
    studentId: string,
    options: Omit<LeaderboardFilterOptions, 'page' | 'limit' | 'requesterId'> = {},
  ): Promise<LeaderboardMeSummary> {
    const type: LeaderboardType = options.type ?? 'global';
    const period: LeaderboardPeriod = options.period ?? 'all-time';
    const weekStart = getPeriodStartUtc('weekly')!;

    const [profile, progress, completedMissions, weeklyAgg, rankedResult] = await Promise.all([
      StudentProfileModel.findOne({ studentId })
        .select('leaderboardOptOut bestGlobalRank school classGrade')
        .lean(),
      PlayerProgressModel.findOne({ userId: studentId }).select('totalXp level').lean(),
      StudentMissionProgressModel.countDocuments({ studentId, status: 'COMPLETED' }),
      XPTransactionModel.aggregate<{ _id: string; xp: number }>([
        { $match: { userId: studentId, createdAt: { $gte: weekStart } } },
        { $group: { _id: '$userId', xp: { $sum: '$amount' } } },
      ]),
      this.computeRankedCandidates({
        type,
        period,
        subject: options.subject,
        requesterId: studentId,
      }),
    ]);

    const { candidates, scopeHint } = rankedResult;
    const optedOut = Boolean(profile?.leaderboardOptOut);
    const totalXp = progress?.totalXp ?? 0;
    const level = progress?.level ?? 1;
    const weeklyXp = weeklyAgg[0]?.xp ?? 0;

    const index = optedOut ? -1 : candidates.findIndex((c) => c.studentId === studentId);
    const rank = index >= 0 ? index + 1 : null;
    const periodXp = index >= 0 ? candidates[index].xp : 0;

    let xpToNextRank = 0;
    if (!optedOut) {
      if (index > 0) {
        xpToNextRank = Math.max(0, candidates[index - 1].xp - candidates[index].xp + 1);
      } else if (index === -1 && candidates.length > 0) {
        const lastXp = candidates[candidates.length - 1].xp;
        xpToNextRank = Math.max(1, lastXp - periodXp + 1);
      }
    }

    let personalBestRank = profile?.bestGlobalRank ?? null;
    if (
      type === 'global' &&
      period === 'all-time' &&
      rank !== null &&
      (personalBestRank === null || rank < personalBestRank)
    ) {
      personalBestRank = rank;
      await StudentProfileModel.updateOne(
        { studentId },
        { $set: { bestGlobalRank: rank } },
      ).catch(() => undefined);
    }

    return {
      rank,
      totalXp,
      periodXp,
      weeklyXp,
      level,
      completedMissions,
      participatingStudents: candidates.length,
      xpToNextRank,
      personalBestRank,
      optedOut,
      type,
      period,
      subject: options.subject,
      scopeHint,
    };
  }

  async getPlayerRank(userId: string) {
    return this.getMyRank(userId, { type: 'global', period: 'all-time' });
  }

  async getPublicStudentDetails(
    targetStudentId: string,
    requesterId?: string,
  ): Promise<PublicLeaderboardProfile> {
    const [profile, progress, avatar, completedMissions, userAchs, allAchs] = await Promise.all([
      StudentProfileModel.findOne({ studentId: targetStudentId })
        .select(
          'studentId displayName classGrade school schoolLocation leaderboardOptOut showSchoolOnLeaderboard',
        )
        .lean(),
      PlayerProgressModel.findOne({ userId: targetStudentId })
        .select('totalXp level currentStreakDays')
        .lean(),
      StudentAvatarModel.findOne({ studentId: targetStudentId })
        .select('appearance equippedItems')
        .lean(),
      StudentMissionProgressModel.countDocuments({
        studentId: targetStudentId,
        status: 'COMPLETED',
      }),
      UserAchievementModel.find({ userId: targetStudentId }).sort({ unlockedAt: -1 }).lean(),
      AchievementModel.find({ isActive: true }).lean(),
    ]);

    const isSelf = requesterId === targetStudentId;
    if (profile?.leaderboardOptOut && !isSelf) {
      throw new AppError('This student profile is private', 404, 'PROFILE_PRIVATE');
    }

    if (!profile && !progress) {
      throw new AppError('Student not found on leaderboard', 404, 'STUDENT_NOT_FOUND');
    }

    const achMap = new Map(allAchs.map((a) => [a._id.toString(), a]));
    const unlockedAchievements = userAchs
      .map((ua) => {
        const ach = achMap.get(ua.achievementId.toString());
        if (!ach) return null;
        return {
          code: ach.code,
          title: ach.title,
          description: ach.description,
          iconUrl: ach.iconUrl,
          unlockedAt: ua.unlockedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      studentId: targetStudentId,
      displayName: profile?.displayName ?? 'Young Explorer',
      level: progress?.level ?? 1,
      totalXp: progress?.totalXp ?? 0,
      completedMissions,
      currentStreakDays: progress?.currentStreakDays ?? 0,
      classGrade: profile?.classGrade || undefined,
      school:
        (profile?.showSchoolOnLeaderboard || isSelf) && profile?.school
          ? profile.school
          : undefined,
      schoolLocation:
        (profile?.showSchoolOnLeaderboard || isSelf) && profile?.schoolLocation
          ? profile.schoolLocation
          : undefined,
      avatar: avatar
        ? {
            appearance: avatar.appearance,
            equippedItems: avatar.equippedItems,
          }
        : DEFAULT_AVATAR,
      achievements: unlockedAchievements,
    };
  }
}

export const leaderboardService = new LeaderboardService();
