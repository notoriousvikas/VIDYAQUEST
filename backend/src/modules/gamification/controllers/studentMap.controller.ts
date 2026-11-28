import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../middleware/errorHandler';
import { studentMapService } from '../services/studentMap.service';

function getStudentId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return req.user.id;
}

export async function listStudentSubjects(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subjects = await studentMapService.listSubjectsWithProgress(getStudentId(req));
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectMap(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const map = await studentMapService.getSubjectMapForStudent(
      getStudentId(req),
      String(req.params.subjectId),
    );
    res.json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const progress = await studentMapService.getStudentSubjectProgress(
      getStudentId(req),
      String(req.params.subjectId),
    );
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
}

export async function getDefaultMap(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const map = await studentMapService.getDefaultStudentMap(getStudentId(req));
    res.json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
}

export async function getZoneDetails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const zone = await studentMapService.getZoneDetailsForStudent(
      getStudentId(req),
      String(req.params.zoneId),
    );
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
}

export async function getMissionDetails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const mission = await studentMapService.getMissionDetailsForStudent(
      getStudentId(req),
      String(req.params.missionId),
    );
    res.json({ success: true, data: mission });
  } catch (error) {
    next(error);
  }
}

export async function startMission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await studentMapService.startMission(
      getStudentId(req),
      String(req.params.missionId),
    );
    res.json({ success: true, data: result });
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
    const score = typeof req.body?.score === 'number' ? req.body.score : 100;
    const result = await studentMapService.completeMission(
      getStudentId(req),
      String(req.params.missionId),
      score,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getOverallMapProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const progress = await studentMapService.getOverallStudentMapProgress(getStudentId(req));
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
}

export async function adminUpsertZone(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const zone = await studentMapService.upsertZone(req.body);
    res.status(200).json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
}

export async function adminUpsertMission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const mission = await studentMapService.upsertMission(req.body);
    res.status(200).json({ success: true, data: mission });
  } catch (error) {
    next(error);
  }
}
