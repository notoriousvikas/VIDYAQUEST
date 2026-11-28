import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../middleware/errorHandler';
import { mapService } from '../services/map.service';

export async function listWorlds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const worlds = await mapService.listPublishedWorlds();
    res.json({ success: true, data: worlds });
  } catch (error) {
    next(error);
  }
}

export async function getWorldMap(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const worldId = String(req.params.worldId);
    const worldMap = await mapService.getWorldMapForPlayer(worldId, req.user.id);
    res.json({ success: true, data: worldMap });
  } catch (error) {
    next(error);
  }
}

export async function completeNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const nodeId = String(req.params.nodeId);
    const result = await mapService.completeNode(nodeId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
