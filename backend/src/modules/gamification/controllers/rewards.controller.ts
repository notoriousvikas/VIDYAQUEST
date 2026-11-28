import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../middleware/errorHandler';
import { rewardService } from '../services/reward.service';

export async function listRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const rewards = await rewardService.listAchievementsForUser(req.user.id);
    res.json({ success: true, data: rewards });
  } catch (error) {
    next(error);
  }
}

export async function claimReward(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const achievementId = String(req.params.achievementId);
    const result = await rewardService.claimAchievementReward(req.user.id, achievementId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
