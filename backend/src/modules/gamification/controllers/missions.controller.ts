import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../middleware/errorHandler';
import { missionService } from '../services/mission.service';

export async function listMissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const missions = await missionService.listActiveMissions(req.user.id);
    res.json({ success: true, data: missions });
  } catch (error) {
    next(error);
  }
}

export async function completeMission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const missionId = String(req.params.missionId);
    const result = await missionService.completeMission(req.user.id, missionId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
