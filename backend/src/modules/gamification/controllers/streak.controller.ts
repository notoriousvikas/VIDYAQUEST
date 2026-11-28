import { NextFunction, Request, Response } from 'express';
import { streakService } from '../services/streak.service';

export async function getStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await streakService.getStreakSummary(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStreakHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const daysParam = typeof req.query.days === 'string' ? Number(req.query.days) : 30;
    const limitDays = Number.isFinite(daysParam) ? daysParam : 30;
    const data = await streakService.getStreakHistory(req.user!.id, limitDays);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStreakRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await streakService.getStreakRewards(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function useStreakFreeze(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await streakService.useStreakFreeze(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
