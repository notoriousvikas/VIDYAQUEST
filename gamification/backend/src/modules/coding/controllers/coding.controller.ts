import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../middleware/errorHandler';
import { codingContentService } from '../services/codingContent.service';
import { codingExecutionService } from '../services/codingExecution.service';
import { codingMentorService } from '../services/codingMentor.service';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return userId;
}

export async function listCodingLevels(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const levels = await codingContentService.listLevels();
    res.json({ success: true, data: levels });
  } catch (err) {
    next(err);
  }
}

export async function getCodingLevel(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await codingContentService.getLevelWithChallenges(
      String(req.params.levelId),
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getCodingChallenge(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const challenge = await codingContentService.getPublicChallengeById(
      String(req.params.challengeId),
    );
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
}

export async function runCodingCode(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = requireUserId(req);
    const { challengeId, language, code, customInput } = req.body;
    const result = await codingExecutionService.runCode({
      studentId,
      challengeId,
      language,
      code,
      customInput,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function submitCodingSolution(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = requireUserId(req);
    const { challengeId, language, code } = req.body;
    const result = await codingExecutionService.submitSolution({
      studentId,
      challengeId,
      language,
      code,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCodingProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = requireUserId(req);
    const progress = await codingExecutionService.getStudentProgress(studentId);
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export async function getCodingLevelProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = requireUserId(req);
    const progress = await codingExecutionService.getLevelProgress(
      studentId,
      String(req.params.levelId),
    );
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

export async function requestCodingHint(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = requireUserId(req);
    const { challengeId, language, code, hintLevel, errorOutput, question } = req.body;
    const hint = await codingMentorService.getHint({
      studentId,
      challengeId,
      language,
      code,
      hintLevel,
      errorOutput,
      question,
    });
    res.json({ success: true, data: hint });
  } catch (err) {
    next(err);
  }
}
