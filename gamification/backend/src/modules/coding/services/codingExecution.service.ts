import { AppError } from '../../../middleware/errorHandler';
import { MissionModel } from '../../gamification/models/Mission.model';
import { studentMapService } from '../../gamification/services/studentMap.service';
import { xpService } from '../../gamification/services/xp.service';
import { CodingProgressModel } from '../models/CodingProgress.model';
import {
  CodingSubmissionModel,
  CodingSubmissionStatus,
} from '../models/CodingSubmission.model';
import { CodingLanguage } from '../models/CodingTypes';
import { codingContentService } from './codingContent.service';
import { onlineCompilerService } from './onlineCompiler.service';

const RUN_RATE_LIMIT_MAX = 25;
const RATE_WINDOW_MS = 60_000;
const requestTimestampsByStudent = new Map<string, number[]>();

function assertWithinRateLimit(studentId: string): void {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const recent = (requestTimestampsByStudent.get(studentId) ?? []).filter(
    (ts) => ts > windowStart,
  );
  if (recent.length >= RUN_RATE_LIMIT_MAX) {
    throw new AppError(
      'Too many code executions in a short time. Please wait a few seconds and try again.',
      429,
      'CODING_RATE_LIMITED',
    );
  }
  recent.push(now);
  requestTimestampsByStudent.set(studentId, recent);
}

/**
 * Normalizes stdout for fair comparison without collapsing meaningful internal spacing.
 * - Converts CRLF to LF
 * - Trims trailing whitespace at the end of each line
 * - Trims leading/trailing blank lines
 */
export function normalizeProgramOutput(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n').map((line) => line.replace(/[ \t]+$/g, ''));
  while (lines.length > 0 && lines[0] === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

export interface PublicTestResult {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: string;
  error?: string;
}

export class CodingExecutionService {
  async runCode(params: {
    studentId: string;
    challengeId: string;
    language: CodingLanguage;
    code: string;
    customInput?: string;
  }) {
    assertWithinRateLimit(params.studentId);

    const challenge = await codingContentService.getChallengeById(params.challengeId);
    const inputToUse =
      params.customInput !== undefined
        ? params.customInput
        : (challenge.publicTestCases[0]?.input ?? '');

    const result = await onlineCompilerService.execute({
      language: params.language,
      code: params.code,
      input: inputToUse,
    });

    const expected =
      params.customInput === undefined ? challenge.publicTestCases[0]?.expectedOutput : undefined;
    const matchesSample =
      expected !== undefined && result.status === 'SUCCESS'
        ? normalizeProgramOutput(result.output) === normalizeProgramOutput(expected)
        : undefined;

    return {
      challengeId: challenge.id,
      language: params.language,
      inputUsed: inputToUse,
      status: result.status,
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      time: result.time,
      memory: result.memory,
      matchesSample,
    };
  }

  async submitSolution(params: {
    studentId: string;
    challengeId: string;
    language: CodingLanguage;
    code: string;
  }) {
    assertWithinRateLimit(params.studentId);

    const challenge = await codingContentService.getChallengeById(params.challengeId);
    const level = await codingContentService.getLevelById(challenge.levelId);

    const publicResults: PublicTestResult[] = [];
    let hiddenPassedCount = 0;
    const hiddenTotalCount = challenge.hiddenTestCases.length;

    let overallStatus: CodingSubmissionStatus = 'ACCEPTED';
    let lastMeta: { time?: string; memory?: string; exitCode?: number | null } = {};
    let firstErrorMessage = '';

    // Evaluate public test cases
    for (const tc of challenge.publicTestCases) {
      const exec = await onlineCompilerService.execute({
        language: params.language,
        code: params.code,
        input: tc.input,
      });
      lastMeta = { time: exec.time, memory: exec.memory, exitCode: exec.exitCode };

      const normalizedActual = normalizeProgramOutput(exec.output);
      const normalizedExpected = normalizeProgramOutput(tc.expectedOutput);
      const passed = exec.status === 'SUCCESS' && normalizedActual === normalizedExpected;

      if (!passed && overallStatus === 'ACCEPTED') {
        if (exec.status === 'COMPILATION_ERROR') overallStatus = 'COMPILATION_ERROR';
        else if (exec.status === 'RUNTIME_ERROR') overallStatus = 'RUNTIME_ERROR';
        else if (exec.status === 'TIMEOUT') overallStatus = 'TIMEOUT';
        else if (exec.status === 'PROVIDER_ERROR') overallStatus = 'PROVIDER_ERROR';
        else overallStatus = 'WRONG_ANSWER';
        firstErrorMessage = exec.error;
      }

      publicResults.push({
        id: tc.id,
        description: tc.description,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: exec.output,
        passed,
        status: exec.status,
        error: exec.error || undefined,
      });

      // Short-circuit on compilation or provider error
      if (exec.status === 'COMPILATION_ERROR' || exec.status === 'PROVIDER_ERROR') {
        break;
      }
    }

    // Evaluate hidden test cases (only if no compilation/provider error yet)
    if (overallStatus !== 'COMPILATION_ERROR' && overallStatus !== 'PROVIDER_ERROR') {
      for (const htc of challenge.hiddenTestCases) {
        const exec = await onlineCompilerService.execute({
          language: params.language,
          code: params.code,
          input: htc.input,
        });
        lastMeta = { time: exec.time, memory: exec.memory, exitCode: exec.exitCode };

        const normalizedActual = normalizeProgramOutput(exec.output);
        const normalizedExpected = normalizeProgramOutput(htc.expectedOutput);
        const passed = exec.status === 'SUCCESS' && normalizedActual === normalizedExpected;

        if (passed) {
          hiddenPassedCount += 1;
        } else if (overallStatus === 'ACCEPTED') {
          if (exec.status === 'COMPILATION_ERROR') overallStatus = 'COMPILATION_ERROR';
          else if (exec.status === 'RUNTIME_ERROR') overallStatus = 'RUNTIME_ERROR';
          else if (exec.status === 'TIMEOUT') overallStatus = 'TIMEOUT';
          else if (exec.status === 'PROVIDER_ERROR') overallStatus = 'PROVIDER_ERROR';
          else overallStatus = 'WRONG_ANSWER';
          if (!firstErrorMessage && exec.error) firstErrorMessage = exec.error;
        }
      }
    }

    const publicPassedCount = publicResults.filter((r) => r.passed).length;
    const totalTests = challenge.publicTestCases.length + hiddenTotalCount;
    const passedTests = publicPassedCount + hiddenPassedCount;

    const submission = await CodingSubmissionModel.create({
      studentId: params.studentId,
      challengeId: challenge.id,
      levelId: level.levelId,
      language: params.language,
      status: overallStatus,
      passedTests,
      totalTests,
      executionMeta: lastMeta,
    });

    let xpAwarded = 0;
    let leveledUp = false;
    let levelCompleted = false;
    let missionCompletionResult: unknown = null;

    if (overallStatus === 'ACCEPTED') {
      const progress = await CodingProgressModel.findOneAndUpdate(
        { studentId: params.studentId, levelId: level.levelId },
        {
          $setOnInsert: {
            studentId: params.studentId,
            levelId: level.levelId,
            missionSlug: level.missionSlug,
          },
          $addToSet: {
            completedChallengeIds: challenge.id,
            [`completedByLanguage.${params.language}`]: challenge.id,
          },
        },
        { upsert: true, new: true },
      );

      // Award challenge XP idempotently (no XP farming)
      const xpRes = await xpService.awardXp({
        userId: params.studentId,
        amount: challenge.xpReward,
        sourceType: 'mission',
        sourceId: challenge.id,
        subjectSlug: 'coding',
        idempotencyKey: `coding_challenge:${params.studentId}:${challenge.id}`,
        description: `Solved coding challenge: ${challenge.title}`,
      });
      xpAwarded += xpRes.xpAwarded;
      leveledUp = xpRes.leveledUp;

      // Check if all challenges in this level are completed
      const completedSet = new Set(progress.completedChallengeIds);
      const allCompleted = level.challengeIds.every((cid) => completedSet.has(cid));

      if (allCompleted) {
        levelCompleted = true;
        if (!progress.levelBonusAwarded) {
          progress.levelBonusAwarded = true;
          progress.completedAt = new Date();
          await progress.save();

          const missionDoc = await MissionModel.findOne({ slug: level.missionSlug }).lean();
          if (missionDoc) {
            try {
              const comp = await studentMapService.completeMission(
                params.studentId,
                String(missionDoc._id),
                100,
              );
              xpAwarded += comp.xpAwarded;
              leveledUp = leveledUp || comp.leveledUp;
              missionCompletionResult = comp;
            } catch {
              // If prerequisite mission wasn't completed yet, still award level bonus XP safely
              const bonusRes = await xpService.awardXp({
                userId: params.studentId,
                amount: level.completionBonusXp,
                sourceType: 'mission',
                sourceId: level.levelId,
                subjectSlug: 'coding',
                idempotencyKey: `coding_level:${params.studentId}:${level.levelId}`,
                description: `Completed coding level: ${level.title}`,
              });
              xpAwarded += bonusRes.xpAwarded;
              leveledUp = leveledUp || bonusRes.leveledUp;
            }
          }
        }
      }
    }

    return {
      submissionId: String(submission._id),
      challengeId: challenge.id,
      levelId: level.levelId,
      language: params.language,
      status: overallStatus,
      passedTests,
      totalTests,
      publicResults,
      hiddenPassedCount,
      hiddenTotalCount,
      error: firstErrorMessage || undefined,
      executionMeta: lastMeta,
      xpAwarded,
      leveledUp,
      levelCompleted,
      missionCompletionResult,
    };
  }

  async getStudentProgress(studentId: string) {
    const [levels, records] = await Promise.all([
      codingContentService.listLevels(),
      CodingProgressModel.find({ studentId }).lean(),
    ]);

    const byLevel = new Map(records.map((r) => [r.levelId, r]));
    return levels.map((lvl) => {
      const rec = byLevel.get(lvl.levelId);
      const completedIds = rec?.completedChallengeIds ?? [];
      return {
        levelId: lvl.levelId,
        levelNumber: lvl.levelNumber,
        title: lvl.title,
        completedChallengeIds: completedIds,
        completedCount: completedIds.length,
        totalChallenges: lvl.challengeIds.length,
        completedByLanguage: rec?.completedByLanguage ?? {
          python: [],
          javascript: [],
          java: [],
        },
        levelCompleted: Boolean(rec?.levelBonusAwarded),
        completedAt: rec?.completedAt ?? null,
      };
    });
  }

  async getLevelProgress(studentId: string, levelId: string) {
    const level = await codingContentService.getLevelById(levelId);
    const rec = await CodingProgressModel.findOne({
      studentId,
      levelId: level.levelId,
    }).lean();

    const completedIds = rec?.completedChallengeIds ?? [];
    return {
      levelId: level.levelId,
      levelNumber: level.levelNumber,
      title: level.title,
      completedChallengeIds: completedIds,
      completedCount: completedIds.length,
      totalChallenges: level.challengeIds.length,
      completedByLanguage: rec?.completedByLanguage ?? {
        python: [],
        javascript: [],
        java: [],
      },
      levelCompleted: Boolean(rec?.levelBonusAwarded),
      completedAt: rec?.completedAt ?? null,
    };
  }
}

export const codingExecutionService = new CodingExecutionService();
