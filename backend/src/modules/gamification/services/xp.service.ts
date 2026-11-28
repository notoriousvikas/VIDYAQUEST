import { Types } from 'mongoose';
import { AppError } from '../../../middleware/errorHandler';
import { IPlayerProgress, PlayerProgressModel } from '../models/PlayerProgress.model';
import { XPSourceType, XPTransactionModel } from '../models/XPTransaction.model';

export const XP_PER_LEVEL = 100;

/**
 * Pure domain calculation for player level from total XP.
 */
export function calculateLevelFromXp(totalXp: number): number {
  if (totalXp < 0) return 1;
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export interface AwardXpInput {
  userId: string;
  amount: number;
  sourceType: XPSourceType;
  sourceId?: string;
  subjectId?: Types.ObjectId | string;
  subjectSlug?: string;
  idempotencyKey?: string;
  description: string;
}

export interface AwardXpResult {
  progress: IPlayerProgress;
  xpAwarded: number;
  leveledUp: boolean;
}

/**
 * Service managing player XP, level progression, and XP transaction ledger.
 */
export class XpService {
  async getOrCreateProgress(userId: string): Promise<IPlayerProgress> {
    let progress = await PlayerProgressModel.findOne({ userId });
    if (!progress) {
      progress = await PlayerProgressModel.create({ userId });
    }
    return progress;
  }

  async awardXp(input: AwardXpInput): Promise<AwardXpResult> {
    if (input.amount <= 0) {
      throw new AppError('XP amount must be positive', 400, 'INVALID_XP_AMOUNT');
    }

    if (input.idempotencyKey) {
      try {
        await XPTransactionModel.create({
          userId: input.userId,
          amount: input.amount,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          subjectId: input.subjectId,
          subjectSlug: input.subjectSlug?.toLowerCase(),
          idempotencyKey: input.idempotencyKey,
          description: input.description,
        });
      } catch (err: unknown) {
        const mongoErr = err as { code?: number };
        if (mongoErr?.code === 11000) {
          const progress = await this.getOrCreateProgress(input.userId);
          return {
            progress,
            xpAwarded: 0,
            leveledUp: false,
          };
        }
        throw err;
      }
    } else {
      await XPTransactionModel.create({
        userId: input.userId,
        amount: input.amount,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        subjectId: input.subjectId,
        subjectSlug: input.subjectSlug?.toLowerCase(),
        description: input.description,
      });
    }

    const progress = await this.getOrCreateProgress(input.userId);
    const previousLevel = progress.level;

    progress.totalXp += input.amount;
    progress.level = calculateLevelFromXp(progress.totalXp);
    progress.lastActivityDate = new Date();
    await progress.save();

    return {
      progress,
      xpAwarded: input.amount,
      leveledUp: progress.level > previousLevel,
    };
  }

  async getRecentTransactions(userId: string, limit = 20) {
    return XPTransactionModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  }
}

export const xpService = new XpService();
