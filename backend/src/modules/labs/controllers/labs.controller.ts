import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { env } from '../../../config/env';
import { AppError } from '../../../middleware/errorHandler';
import { labExecutionService } from '../services/labExecution.service';
import { labRegistryService } from '../services/labRegistry.service';

function getStudentId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return req.user.id;
}

const MIME_BY_EXT: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

export async function listLabs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subjectSlug =
      typeof req.query.subjectSlug === 'string' ? req.query.subjectSlug : undefined;
    const labs = await labRegistryService.listEnabledLabs(subjectSlug);
    res.json({ success: true, data: labs });
  } catch (error) {
    next(error);
  }
}

export async function resolveLabForMission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await labExecutionService.resolveLabForMission(
      getStudentId(req),
      String(req.params.missionId),
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function startLabAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await labExecutionService.startLabAttempt(
      getStudentId(req),
      String(req.params.labId),
      typeof req.body?.missionId === 'string' ? req.body.missionId : undefined,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function completeLabExperiment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
    try {
      const result = await labExecutionService.completeLabExperiment(
        getStudentId(req),
        String(req.params.labId),
        {
          missionId: typeof req.body?.missionId === 'string' ? req.body.missionId : undefined,
          completedSteps: Array.isArray(req.body?.completedSteps) ? req.body.completedSteps : [],
          observations: Array.isArray(req.body?.observations) ? req.body.observations : [],
          answers: req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {},
        },
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
}

export async function serveLabAsset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const labId = String(req.params.labId);
    const wild = req.params[0] ? decodeURIComponent(String(req.params[0])) : undefined;
    const filePath = await labRegistryService.resolveAssetFilePath(labId, wild);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';

    // Allow frontend origin to embed/load lab assets cleanly
    res.removeHeader('X-Frame-Options');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      `frame-ancestors 'self' ${env.CORS_ORIGIN}`,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}
