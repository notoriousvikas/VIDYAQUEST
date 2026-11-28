import mongoose from 'mongoose';
import { AppError } from '../../../middleware/errorHandler';
import { MissionModel } from '../../gamification/models/Mission.model';
import { studentMapService } from '../../gamification/services/studentMap.service';
import { LabAttemptModel } from '../models/LabAttempt.model';
import { labRegistryService } from './labRegistry.service';

export interface CompleteLabInput {
  missionId?: string;
  completedSteps: number[];
  observations: string[];
  answers: Record<string, number>;
}

export class LabExecutionService {
  private async findMissionByIdOrSlug(missionIdOrSlug: string) {
    if (mongoose.Types.ObjectId.isValid(missionIdOrSlug)) {
      const byId = await MissionModel.findById(missionIdOrSlug).lean();
      if (byId) return byId;
    }
    const bySlug = await MissionModel.findOne({
      slug: missionIdOrSlug.trim().toLowerCase(),
    }).lean();
    if (!bySlug) {
      throw new AppError('Level not found', 404, 'MISSION_NOT_FOUND');
    }
    return bySlug;
  }

  async resolveLabForMission(studentId: string, missionIdOrSlug: string) {
    const missionDoc = await this.findMissionByIdOrSlug(missionIdOrSlug);
    const missionDetails = await studentMapService.getMissionDetailsForStudent(
      studentId,
      String(missionDoc._id),
    );

    const labEntry = await labRegistryService.resolveLabForMission(
      missionDoc.slug,
      missionDoc.contentReference,
    );

    if (!labEntry) {
      return {
        mission: missionDetails,
        lab: null,
        attempt: null,
      };
    }

    const attempt = await LabAttemptModel.findOne({
      studentId,
      labId: labEntry.labId,
      missionId: missionDoc._id,
    }).lean();

    return {
      mission: missionDetails,
      lab: labRegistryService.sanitizeForStudent(labEntry),
      attempt: attempt
        ? {
            status: attempt.status,
            completedSteps: attempt.completedSteps,
            observations: attempt.observations,
            score: attempt.score,
            xpAwarded: attempt.xpAwarded,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt ?? null,
          }
        : null,
    };
  }

  async startLabAttempt(studentId: string, labId: string, missionId?: string) {
    const lab = await labRegistryService.getEnabledLabById(labId);

    let resolvedMissionId: string;
    if (missionId) {
      const missionDoc = await this.findMissionByIdOrSlug(missionId);
      resolvedMissionId = String(missionDoc._id);
      await studentMapService.startMission(studentId, resolvedMissionId);
    } else {
      const fallbackSlug = lab.associatedMissionSlugs[0];
      if (!fallbackSlug) {
        throw new AppError('No level associated with this lab', 400, 'LAB_NO_MISSION');
      }
      const missionDoc = await this.findMissionByIdOrSlug(fallbackSlug);
      resolvedMissionId = String(missionDoc._id);
      await studentMapService.startMission(studentId, resolvedMissionId);
    }

    const attempt = await LabAttemptModel.findOneAndUpdate(
      {
        studentId,
        labId: lab.labId,
        missionId: resolvedMissionId,
      },
      {
        $setOnInsert: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          completedSteps: [],
          observations: [],
          answers: {},
          score: 0,
          xpAwarded: 0,
        },
      },
      { upsert: true, new: true },
    ).lean();

    return {
      labId: lab.labId,
      missionId: resolvedMissionId,
      status: attempt.status,
      startedAt: attempt.startedAt,
    };
  }

  async completeLabExperiment(
    studentId: string,
    labId: string,
    input: CompleteLabInput,
  ) {
    const lab = await labRegistryService.getEnabledLabById(labId);

    const missionDoc = input.missionId
      ? await this.findMissionByIdOrSlug(input.missionId)
      : lab.associatedMissionSlugs[0]
        ? await this.findMissionByIdOrSlug(lab.associatedMissionSlugs[0])
        : null;

    if (!missionDoc) {
      throw new AppError('No level associated with this lab', 400, 'LAB_NO_MISSION');
    }

    const missionId = String(missionDoc._id);

    // Validate completion criteria server-side
    const uniqueSteps = Array.from(new Set(input.completedSteps)).filter(
      (idx) => idx >= 0 && idx < Math.max(lab.instructions.length, 10),
    );
    const minSteps = lab.completionCriteria.minStepsCompleted;
    if (uniqueSteps.length < minSteps) {
      throw new AppError(
        `Please complete at least ${minSteps} experiment step(s) before submitting.`,
        400,
        'LAB_STEPS_INCOMPLETE',
      );
    }

    const cleanObservations = input.observations
      .map((obs) => obs.trim())
      .filter((obs) => obs.length > 0);
    const minObs = lab.completionCriteria.minObservations;
    if (cleanObservations.length < minObs) {
      throw new AppError(
        `Please record at least ${minObs} observation(s) before submitting.`,
        400,
        'LAB_OBSERVATIONS_REQUIRED',
      );
    }

    const questions = lab.completionCriteria.verificationQuestions;
    let correctCount = 0;
    if (questions.length > 0) {
      for (const q of questions) {
        const chosen = input.answers[q.id];
        if (typeof chosen !== 'number' || chosen < 0 || chosen >= q.options.length) {
          throw new AppError(
            'Please answer all verification check questions before submitting.',
            400,
            'LAB_VERIFICATION_INCOMPLETE',
          );
        }
        if (chosen === q.correctIndex) {
          correctCount += 1;
        }
      }
      if (correctCount === 0 && questions.length > 0) {
        throw new AppError(
          'Review your experiment observations and try the verification check again.',
          400,
          'LAB_VERIFICATION_FAILED',
        );
      }
    }

    // Compute authoritative server score (60-100)
    const stepRatio =
      lab.instructions.length > 0
        ? Math.min(1, uniqueSteps.length / lab.instructions.length)
        : 1;
    const questionRatio =
      questions.length > 0 ? correctCount / questions.length : 1;
    const computedScore = Math.max(
      60,
      Math.min(100, Math.round(60 + stepRatio * 15 + questionRatio * 25)),
    );

    // Delegate XP, stars, streak, level rewards & idempotency to existing studentMapService
    const completionResult = await studentMapService.completeMission(
      studentId,
      missionId,
      computedScore,
    );

    const now = new Date();
    const attempt = await LabAttemptModel.findOneAndUpdate(
      {
        studentId,
        labId: lab.labId,
        missionId: missionDoc._id,
      },
      {
        $set: {
          status: 'COMPLETED',
          completedSteps: uniqueSteps,
          observations: cleanObservations,
          answers: input.answers,
        },
        $max: {
          score: computedScore,
          xpAwarded: completionResult.xpAwarded,
        },
        $setOnInsert: {
          startedAt: now,
        },
        $min: {
          completedAt: now,
        },
      },
      { upsert: true, new: true },
    ).lean();

    return {
      labId: lab.labId,
      missionId,
      score: computedScore,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      attempt: {
        status: attempt.status,
        completedSteps: attempt.completedSteps,
        observations: attempt.observations,
        score: attempt.score,
        xpAwarded: attempt.xpAwarded,
        completedAt: attempt.completedAt ?? now,
      },
      completionResult,
    };
  }
}

export const labExecutionService = new LabExecutionService();
