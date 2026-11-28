import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../middleware/errorHandler';
import {
  LeaderboardPeriod,
  LeaderboardSubjectSlug,
  LeaderboardType,
  leaderboardService,
} from '../services/leaderboard.service';

export async function getLeaderboard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const type = (req.query.type as LeaderboardType) ?? 'global';
    const period = (req.query.period as LeaderboardPeriod) ?? 'all-time';
    const subject = req.query.subject as LeaderboardSubjectSlug | undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const leaderboard = await leaderboardService.getLeaderboard({
      type,
      period,
      subject,
      page,
      limit,
      requesterId: req.user?.id,
    });

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
}

export async function getMyRank(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const type = (req.query.type as LeaderboardType) ?? 'global';
    const period = (req.query.period as LeaderboardPeriod) ?? 'all-time';
    const subject = req.query.subject as LeaderboardSubjectSlug | undefined;

    const rank = await leaderboardService.getMyRank(req.user.id, {
      type,
      period,
      subject,
    });
    res.json({ success: true, data: rank });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboardStudentDetails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const details = await leaderboardService.getPublicStudentDetails(
      String(req.params.studentId),
      req.user?.id,
    );
    res.json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
}
