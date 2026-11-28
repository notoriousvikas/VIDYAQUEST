import { describe, expect, it, vi, beforeEach } from 'vitest';
import path from 'path';
import { labRegistryService } from '../services/labRegistry.service';
import { labExecutionService } from '../services/labExecution.service';
import { MissionModel } from '../../gamification/models/Mission.model';
import { LabAttemptModel } from '../models/LabAttempt.model';
import { studentMapService } from '../../gamification/services/studentMap.service';

describe('LabRegistryService', () => {
  it('loads enabled labs from /lab/labs.manifest.json and strips correctIndex', async () => {
    const labs = await labRegistryService.listEnabledLabs();
    expect(labs.length).toBeGreaterThanOrEqual(4);

    const titration = labs.find((l) => l.labId === 'chem-acid-base-titration');
    expect(titration).toBeDefined();
    expect(titration?.assetUrl).toContain('/api/v1/labs/assets/chem-acid-base-titration/');
    const firstQuestion = titration?.completionCriteria.verificationQuestions[0] as
      | Record<string, unknown>
      | undefined;
    expect(firstQuestion).toBeDefined();
    expect(firstQuestion?.correctIndex).toBeUndefined();
  });

  it('resolves the correct lab for associated mission slugs and returns null when none exists', async () => {
    const chem1 = await labRegistryService.resolveLabForMission('chem-1');
    expect(chem1?.labId).toBe('chem-acids-bases-properties');

    const chem2 = await labRegistryService.resolveLabForMission('chem-2');
    expect(chem2?.labId).toBe('chem-acid-base-titration');

    const bio1 = await labRegistryService.resolveLabForMission('bio-1');
    expect(bio1?.labId).toBe('bio-leaf-stomata-mount');

    const bio2 = await labRegistryService.resolveLabForMission('bio-2');
    expect(bio2?.labId).toBe('bio-human-heart-3d');

    const none = await labRegistryService.resolveLabForMission('chem-6');
    expect(none).toBeNull();
  });

  it('blocks directory traversal in resolveAssetFilePath and resolves valid HTML asset', async () => {
    await expect(
      labRegistryService.resolveAssetFilePath('chem-acid-base-titration', '../backend/package.json'),
    ).rejects.toMatchObject({ statusCode: 403 });

    const validPath = await labRegistryService.resolveAssetFilePath('chem-acid-base-titration');
    expect(path.basename(validPath)).toBe('vidyaquest_3d_acid_base_titration_lab.html');
  });
});

describe('LabExecutionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects completion when required steps or observations are missing', async () => {
    vi.spyOn(MissionModel, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        slug: 'chem-6',
        isPublished: true,
      }),
    } as never);

    await expect(
      labExecutionService.completeLabExperiment(
        '507f1f77bcf86cd799439012',
        'chem-acids-bases-properties',
        {
          missionId: '507f1f77bcf86cd799439011',
          completedSteps: [0],
          observations: ['Blue litmus turned red'],
          answers: { q1: 1, q2: 0 },
        },
      ),
    ).rejects.toMatchObject({ code: 'LAB_STEPS_INCOMPLETE' });
  });

  it('validates criteria, computes authoritative score, and delegates to studentMapService.completeMission', async () => {
    vi.spyOn(MissionModel, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        slug: 'chem-6',
        isPublished: true,
      }),
    } as never);

    const completeSpy = vi
      .spyOn(studentMapService, 'completeMission')
      .mockResolvedValue({
        missionId: '507f1f77bcf86cd799439011',
        alreadyCompleted: false,
        xpAwarded: 160,
        leveledUp: false,
        starsEarned: 3,
        score: 100,
        streakUpdate: null,
        conquerorEvent: null,
        unlockedClothingRewards: [],
        map: {} as never,
      });

    vi.spyOn(LabAttemptModel, 'findOneAndUpdate').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        status: 'COMPLETED',
        completedSteps: [0, 1, 2, 3],
        observations: ['Blue litmus turned red in HCl'],
        score: 100,
        xpAwarded: 160,
        completedAt: new Date(),
      }),
    } as never);

    const result = await labExecutionService.completeLabExperiment(
      '507f1f77bcf86cd799439012',
      'chem-acids-bases-properties',
      {
        missionId: '507f1f77bcf86cd799439011',
        completedSteps: [0, 1, 2, 3],
        observations: ['Blue litmus turned red in HCl'],
        answers: { q1: 1, q2: 0 },
      },
    );

    expect(result.score).toBe(100);
    expect(result.correctAnswers).toBe(2);
    expect(completeSpy).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439011',
      100,
    );
  });
});
