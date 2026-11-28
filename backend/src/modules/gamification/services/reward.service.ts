import { Types } from 'mongoose';
import { AppError } from '../../../middleware/errorHandler';
import { AchievementModel } from '../models/Achievement.model';
import { UserAchievementModel } from '../models/UserAchievement.model';
import { xpService } from './xp.service';

/**
 * Service managing achievements, unlocked rewards, and XP reward claims.
 */
export class RewardService {
  async listAchievementsForUser(userId: string) {
    const [achievements, userAchievements] = await Promise.all([
      AchievementModel.find({ isActive: true }).lean(),
      UserAchievementModel.find({ userId }).lean(),
    ]);

    const userMap = new Map(
      userAchievements.map((ua) => [ua.achievementId.toString(), ua]),
    );

    return achievements.map((ach) => {
      const unlocked = userMap.get(ach._id.toString());
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
  }

  async claimAchievementReward(userId: string, achievementId: string) {
    const achievement = await AchievementModel.findById(achievementId).lean();
    if (!achievement || !achievement.isActive) {
      throw new AppError('Achievement not found', 404, 'ACHIEVEMENT_NOT_FOUND');
    }

    const userAchievement = await UserAchievementModel.findOne({
      userId,
      achievementId: new Types.ObjectId(achievementId),
    });

    if (!userAchievement) {
      throw new AppError('Achievement not unlocked yet', 400, 'ACHIEVEMENT_LOCKED');
    }

    if (userAchievement.claimed) {
      throw new AppError('Achievement reward already claimed', 409, 'REWARD_ALREADY_CLAIMED');
    }

    userAchievement.claimed = true;
    userAchievement.claimedAt = new Date();
    await userAchievement.save();

    const xpResult = await xpService.awardXp({
      userId,
      amount: achievement.xpBonus,
      sourceType: 'achievement',
      sourceId: achievementId,
      idempotencyKey: `achievement:${userId}:${achievementId}`,
      description: `Claimed achievement: ${achievement.title}`,
    });

    return {
      achievementId,
      xpAwarded: xpResult.xpAwarded,
      totalXp: xpResult.progress.totalXp,
      level: xpResult.progress.level,
    };
  }
}

export const rewardService = new RewardService();
