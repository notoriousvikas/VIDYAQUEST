import fs from 'fs';
import path from 'path';
import { AppError } from '../../../middleware/errorHandler';
import { labRegistryService } from '../../labs/services/labRegistry.service';
import {
  CodingChallenge,
  CodingLevel,
  PublicCodingChallenge,
} from '../models/CodingTypes';

interface CachedCurriculum {
  levels: CodingLevel[];
  levelById: Map<string, CodingLevel>;
  challengeById: Map<string, CodingChallenge>;
  challengesByLevel: Map<string, CodingChallenge[]>;
}

let cachedCurriculum: CachedCurriculum | null = null;

export class CodingContentService {
  private getCodingLevelsDir(): string {
    return path.join(labRegistryService.getLabRootDir(), 'coding', 'levels');
  }

  private async loadCurriculum(): Promise<CachedCurriculum> {
    if (cachedCurriculum) return cachedCurriculum;

    const levelsDir = this.getCodingLevelsDir();
    if (!fs.existsSync(levelsDir)) {
      throw new AppError(
        'Coding curriculum directory not found',
        500,
        'CODING_CONTENT_MISSING',
      );
    }

    const entries = await fs.promises.readdir(levelsDir, { withFileTypes: true });
    const levelDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('level-'))
      .map((e) => e.name)
      .sort((a, b) => {
        const numA = parseInt(a.replace('level-', ''), 10) || 0;
        const numB = parseInt(b.replace('level-', ''), 10) || 0;
        return numA - numB;
      });

    const levels: CodingLevel[] = [];
    const levelById = new Map<string, CodingLevel>();
    const challengeById = new Map<string, CodingChallenge>();
    const challengesByLevel = new Map<string, CodingChallenge[]>();

    for (const dirName of levelDirs) {
      const levelDir = path.join(levelsDir, dirName);
      const levelJsonPath = path.join(levelDir, 'level.json');
      if (!fs.existsSync(levelJsonPath)) continue;

      const rawLevel = await fs.promises.readFile(levelJsonPath, 'utf-8');
      const level = JSON.parse(rawLevel) as CodingLevel;
      levels.push(level);
      levelById.set(level.levelId, level);
      levelById.set(level.missionSlug, level);
      levelById.set(level.labId, level);

      const challengesDir = path.join(levelDir, 'challenges');
      const levelChallenges: CodingChallenge[] = [];
      if (fs.existsSync(challengesDir)) {
        const challengeFiles = (await fs.promises.readdir(challengesDir))
          .filter((f) => f.endsWith('.json'))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        for (const file of challengeFiles) {
          const rawChallenge = await fs.promises.readFile(
            path.join(challengesDir, file),
            'utf-8',
          );
          const challenge = JSON.parse(rawChallenge) as CodingChallenge;
          levelChallenges.push(challenge);
          challengeById.set(challenge.id, challenge);
        }
      }

      levelChallenges.sort((a, b) => a.order - b.order);
      challengesByLevel.set(level.levelId, levelChallenges);
    }

    cachedCurriculum = {
      levels,
      levelById,
      challengeById,
      challengesByLevel,
    };
    return cachedCurriculum;
  }

  sanitizeChallengeForStudent(ch: CodingChallenge): PublicCodingChallenge {
    const { hiddenTestCases, ...rest } = ch;
    return {
      ...rest,
      hiddenTestCaseCount: hiddenTestCases.length,
    };
  }

  async listLevels(): Promise<CodingLevel[]> {
    const data = await this.loadCurriculum();
    return data.levels;
  }

  async getLevelWithChallenges(levelIdOrSlug: string): Promise<{
    level: CodingLevel;
    challenges: PublicCodingChallenge[];
  }> {
    const data = await this.loadCurriculum();
    const level = data.levelById.get(levelIdOrSlug.trim().toLowerCase());
    if (!level) {
      throw new AppError('Coding level not found', 404, 'CODING_LEVEL_NOT_FOUND');
    }
    const challenges = (data.challengesByLevel.get(level.levelId) ?? []).map((c) =>
      this.sanitizeChallengeForStudent(c),
    );
    return { level, challenges };
  }

  async getChallengeById(challengeId: string): Promise<CodingChallenge> {
    const data = await this.loadCurriculum();
    const challenge = data.challengeById.get(challengeId.trim());
    if (!challenge) {
      throw new AppError(
        'Coding challenge not found',
        404,
        'CODING_CHALLENGE_NOT_FOUND',
      );
    }
    return challenge;
  }

  async getPublicChallengeById(challengeId: string): Promise<PublicCodingChallenge> {
    const ch = await this.getChallengeById(challengeId);
    return this.sanitizeChallengeForStudent(ch);
  }

  async getLevelById(levelId: string): Promise<CodingLevel> {
    const data = await this.loadCurriculum();
    const level = data.levelById.get(levelId.trim().toLowerCase());
    if (!level) {
      throw new AppError('Coding level not found', 404, 'CODING_LEVEL_NOT_FOUND');
    }
    return level;
  }
}

export const codingContentService = new CodingContentService();
