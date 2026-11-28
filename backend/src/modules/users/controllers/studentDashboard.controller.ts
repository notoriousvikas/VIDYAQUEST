import { NextFunction, Request, Response } from 'express';
import { subjectConquerorService } from '../../gamification/services/subjectConqueror.service';
import { studentDashboardService } from '../services/studentDashboard.service';

export async function getStudentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.getDashboard(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStudentAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.getAvatarState(req.user!.id);
    res.json({ success: true, data: data.avatar });
  } catch (err) {
    next(err);
  }
}

export async function getStudentAvatarItems(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.getAvatarState(req.user!.id);
    res.json({ success: true, data: data.items });
  } catch (err) {
    next(err);
  }
}

export async function patchStudentAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.updateAvatar(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStudentAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.getAchievements(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStudentConquerors(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await subjectConquerorService.listConqueredForStudent(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSavedOutfits(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.listSavedOutfits(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function postSavedOutfit(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.createSavedOutfit(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function patchSavedOutfit(req: Request, res: Response, next: NextFunction) {
  try {
    const outfitId = String(req.params.outfitId);
    const data = await studentDashboardService.updateSavedOutfit(req.user!.id, outfitId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteSavedOutfit(req: Request, res: Response, next: NextFunction) {
  try {
    const outfitId = String(req.params.outfitId);
    const data = await studentDashboardService.deleteSavedOutfit(req.user!.id, outfitId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStudentActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
    const data = await studentDashboardService.getRecentActivity(
      req.user!.id,
      Number.isFinite(limit) ? limit : 20,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function patchStudentProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentDashboardService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
