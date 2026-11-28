import { Types } from 'mongoose';
import { AppError } from '../../../middleware/errorHandler';
import { SubjectModel } from '../../catalog/models/Subject.model';
import { IMapLocation, MapLocationModel } from '../models/MapLocation.model';
import { IMission, MissionModel } from '../models/Mission.model';
import {
  IStudentMissionProgress,
  StudentMissionProgressModel,
  StudentMissionStatus,
} from '../models/StudentMissionProgress.model';
import { StudentZoneProgressModel, StudentZoneStatus } from '../models/StudentZoneProgress.model';
import { ISubjectMap, SubjectMapModel } from '../models/SubjectMap.model';
import { studentDashboardService } from '../../users/services/studentDashboard.service';
import { AvatarItemModel } from '../../users/models/AvatarItem.model';
import {
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
  StudentAvatarModel,
} from '../../users/models/StudentAvatar.model';
import { EligibleLearningActivityType } from '../models/DailyLearningActivity.model';
import { LevelRewardClaimModel } from '../models/LevelRewardClaim.model';
import { LevelRewardConfigModel } from '../models/LevelRewardConfig.model';
import { ensureLevelRewardsSeeded } from './seedLevelRewards.service';
import { streakService } from './streak.service';
import { ConquerorEventPayload, subjectConquerorService } from './subjectConqueror.service';
import { xpService } from './xp.service';

export interface MissionView {
  id: string;
  slug: string;
  title: string;
  description: string;
  locationId: string;
  locationName: string;
  missionType: IMission['missionType'];
  difficulty: IMission['difficulty'];
  xpReward: number;
  prerequisites: string[];
  sequence: number;
  estimatedDurationMinutes: number;
  learningObjectives: string[];
  positionX: number;
  positionY: number;
  status: StudentMissionStatus;
  attempts: number;
  bestScore: number;
  stars: 0 | 1 | 2 | 3;
}

export interface ZoneView {
  id: string;
  name: string;
  slug: string;
  locationType: string;
  positionX: number;
  positionY: number;
  accentColor: string;
  displayOrder: number;
  description: string;
  status: StudentZoneStatus;
  totalMissions: number;
  completedMissions: number;
  completionPercentage: number;
}

function computeStars(score: number): 1 | 2 | 3 {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  return 1;
}

export class StudentMapService {
  private async resolveSubject(subjectIdOrSlug: string) {
    const query = Types.ObjectId.isValid(subjectIdOrSlug)
      ? { _id: new Types.ObjectId(subjectIdOrSlug), isActive: true }
      : { slug: subjectIdOrSlug.toLowerCase(), isActive: true };

    const subject = await SubjectModel.findOne(query).lean();
    if (!subject) {
      throw new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND');
    }
    return subject;
  }

  private async getPublishedMapForSubject(subjectId: Types.ObjectId): Promise<ISubjectMap> {
    const map = await SubjectMapModel.findOne({ subjectId, isPublished: true })
      .sort({ version: -1 })
      .lean();
    if (!map) {
      throw new AppError('Published map not found for this subject', 404, 'MAP_NOT_FOUND');
    }
    return map as unknown as ISubjectMap;
  }

  private computeMissionStatus(
    mission: IMission,
    allMapMissions: IMission[],
    progressMap: Map<string, IStudentMissionProgress>,
    completedMissionIds: Set<string>,
  ): StudentMissionStatus {
    const record = progressMap.get(mission._id.toString());
    if (record?.status === 'COMPLETED') return 'COMPLETED';

    const prereqsMet = mission.prerequisites.every((prereqId) =>
      completedMissionIds.has(prereqId.toString()),
    );
    const previousInSequenceCompleted = allMapMissions
      .filter((other) => other.sequence < mission.sequence)
      .every((other) => completedMissionIds.has(other._id.toString()));

    if (!prereqsMet || !previousInSequenceCompleted) return 'LOCKED';

    if (record?.status === 'IN_PROGRESS') return 'IN_PROGRESS';
    return 'AVAILABLE';
  }

  private async assertSequentialUnlocked(studentId: string, mission: IMission): Promise<void> {
    const priorMissions = await MissionModel.find({
      mapId: mission.mapId,
      isPublished: true,
      sequence: { $lt: mission.sequence },
    })
      .select('_id')
      .lean();

    const requiredIds = new Set<string>([
      ...mission.prerequisites.map((p) => p.toString()),
      ...priorMissions.map((p) => p._id.toString()),
    ]);

    if (requiredIds.size === 0) return;

    const completedCount = await StudentMissionProgressModel.countDocuments({
      studentId,
      missionId: { $in: Array.from(requiredIds) },
      status: 'COMPLETED',
    });

    if (completedCount < requiredIds.size) {
      throw new AppError(
        `Level ${mission.sequence} is locked; complete previous levels in sequence first`,
        403,
        'MISSION_LOCKED',
      );
    }
  }

  async listSubjectsWithProgress(studentId: string) {
    const subjects = await SubjectModel.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    const subjectIds = subjects.map((s) => s._id);
    const [maps, missions, completedRecords] = await Promise.all([
      SubjectMapModel.find({ subjectId: { $in: subjectIds }, isPublished: true })
        .sort({ version: -1 })
        .lean(),
      MissionModel.find({ subjectId: { $in: subjectIds }, isPublished: true })
        .select('_id subjectId mapId')
        .lean(),
      StudentMissionProgressModel.find({
        studentId,
        subjectId: { $in: subjectIds },
        status: 'COMPLETED',
      })
        .select('subjectId missionId')
        .lean(),
    ]);

    const mapBySubject = new Map<string, (typeof maps)[number]>();
    for (const m of maps) {
      const key = m.subjectId.toString();
      if (!mapBySubject.has(key)) mapBySubject.set(key, m);
    }

    const totalBySubject = new Map<string, number>();
    for (const mission of missions) {
      const key = mission.subjectId.toString();
      totalBySubject.set(key, (totalBySubject.get(key) ?? 0) + 1);
    }

    const completedBySubject = new Map<string, number>();
    for (const rec of completedRecords) {
      const key = rec.subjectId.toString();
      completedBySubject.set(key, (completedBySubject.get(key) ?? 0) + 1);
    }

    return subjects.map((subject) => {
      const idStr = subject._id.toString();
      const activeMap = mapBySubject.get(idStr);
      const totalMissions = totalBySubject.get(idStr) ?? 0;
      const completedMissions = completedBySubject.get(idStr) ?? 0;
      const completionPercentage =
        totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

      return {
        id: idStr,
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        icon: subject.icon,
        map: activeMap
          ? {
              id: activeMap._id.toString(),
              mapName: activeMap.mapName,
              mapSlug: activeMap.mapSlug,
              previewAsset: activeMap.previewAsset,
              theme: activeMap.theme,
              version: activeMap.version,
            }
          : null,
        totalMissions,
        completedMissions,
        completionPercentage,
      };
    });
  }

  async getSubjectMapForStudent(studentId: string, subjectIdOrSlug: string) {
    const subject = await this.resolveSubject(subjectIdOrSlug);
    const map = await this.getPublishedMapForSubject(subject._id as Types.ObjectId);

    const [locations, missions, progressRecords, playerProgress] = await Promise.all([
      MapLocationModel.find({ mapId: map._id, isActive: true }).sort({ displayOrder: 1 }).lean(),
      MissionModel.find({ mapId: map._id, isPublished: true }).sort({ sequence: 1 }).lean(),
      StudentMissionProgressModel.find({ studentId, mapId: map._id }).lean(),
      xpService.getOrCreateProgress(studentId),
    ]);

    const progressMap = new Map<string, IStudentMissionProgress>();
    const completedMissionIds = new Set<string>();
    for (const rec of progressRecords) {
      progressMap.set(rec.missionId.toString(), rec as unknown as IStudentMissionProgress);
      if (rec.status === 'COMPLETED') {
        completedMissionIds.add(rec.missionId.toString());
      }
    }

    const locationNameMap = new Map<string, string>(
      locations.map((loc) => [loc._id.toString(), loc.name]),
    );

    const typedMissions = missions as unknown as IMission[];
    const missionViews: MissionView[] = missions.map((m) => {
      const rec = progressMap.get(m._id.toString());
      const status = this.computeMissionStatus(
        m as unknown as IMission,
        typedMissions,
        progressMap,
        completedMissionIds,
      );
      return {
        id: m._id.toString(),
        slug: m.slug,
        title: m.title,
        description: m.description,
        locationId: m.locationId.toString(),
        locationName: locationNameMap.get(m.locationId.toString()) ?? 'Unknown Zone',
        missionType: m.missionType,
        difficulty: m.difficulty,
        xpReward: m.xpReward,
        prerequisites: m.prerequisites.map((p) => p.toString()),
        sequence: m.sequence,
        estimatedDurationMinutes: m.estimatedDurationMinutes,
        learningObjectives: m.learningObjectives,
        positionX: m.positionX,
        positionY: m.positionY,
        status,
        attempts: rec?.attempts ?? 0,
        bestScore: rec?.bestScore ?? 0,
        stars: (rec?.stars ?? 0) as 0 | 1 | 2 | 3,
      };
    });

    const zones: ZoneView[] = locations.map((loc) => {
      const zoneMissions = missionViews.filter((m) => m.locationId === loc._id.toString());
      const completedCount = zoneMissions.filter((m) => m.status === 'COMPLETED').length;
      const totalCount = zoneMissions.length;
      const hasUnlockedMission = zoneMissions.some((m) => m.status !== 'LOCKED');

      let zoneStatus: StudentZoneStatus = 'LOCKED';
      if (totalCount > 0 && completedCount === totalCount) {
        zoneStatus = 'COMPLETED';
      } else if (hasUnlockedMission || loc.unlockRequirements.length === 0) {
        zoneStatus = 'UNLOCKED';
      }

      return {
        id: loc._id.toString(),
        name: loc.name,
        slug: loc.slug,
        locationType: loc.locationType,
        positionX: loc.positionX,
        positionY: loc.positionY,
        accentColor: loc.accentColor,
        displayOrder: loc.displayOrder,
        description: loc.description,
        status: zoneStatus,
        totalMissions: totalCount,
        completedMissions: completedCount,
        completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      };
    });

    const totalMissions = missionViews.length;
    const completedMissions = missionViews.filter((m) => m.status === 'COMPLETED').length;
    const currentMission =
      missionViews.find((m) => m.status === 'IN_PROGRESS') ??
      missionViews.find((m) => m.status === 'AVAILABLE') ??
      missionViews[missionViews.length - 1] ??
      null;

    return {
      subject: {
        id: subject._id.toString(),
        name: subject.name,
        slug: subject.slug,
        icon: subject.icon,
      },
      map: {
        id: map._id.toString(),
        mapName: map.mapName,
        mapSlug: map.mapSlug,
        theme: map.theme,
        backgroundAsset: map.backgroundAsset,
        previewAsset: map.previewAsset,
        mapConfiguration: map.mapConfiguration,
        version: map.version,
      },
      zones,
      missions: missionViews,
      progress: {
        totalMissions,
        completedMissions,
        completionPercentage:
          totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
        currentMissionId: currentMission?.id ?? null,
        totalXp: playerProgress.totalXp,
        level: playerProgress.level,
      },
    };
  }

  async getStudentSubjectProgress(studentId: string, subjectIdOrSlug: string) {
    const mapData = await this.getSubjectMapForStudent(studentId, subjectIdOrSlug);
    return {
      subject: mapData.subject,
      progress: mapData.progress,
      zones: mapData.zones.map((z) => ({
        id: z.id,
        name: z.name,
        status: z.status,
        completedMissions: z.completedMissions,
        totalMissions: z.totalMissions,
        completionPercentage: z.completionPercentage,
      })),
    };
  }

  async getDefaultStudentMap(studentId: string) {
    const firstSubject = await SubjectModel.findOne({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
    if (!firstSubject) {
      throw new AppError('No active subjects configured', 404, 'NO_SUBJECTS');
    }
    return this.getSubjectMapForStudent(studentId, firstSubject._id.toString());
  }

  async getZoneDetailsForStudent(studentId: string, zoneId: string) {
    const zone = await MapLocationModel.findById(zoneId).lean();
    if (!zone || !zone.isActive) {
      throw new AppError('Zone not found', 404, 'ZONE_NOT_FOUND');
    }
    const map = await SubjectMapModel.findById(zone.mapId).lean();
    if (!map) {
      throw new AppError('Map not found', 404, 'MAP_NOT_FOUND');
    }
    const mapData = await this.getSubjectMapForStudent(studentId, map.subjectId.toString());
    const zoneView = mapData.zones.find((z) => z.id === zoneId);
    const zoneMissions = mapData.missions.filter((m) => m.locationId === zoneId);

    return {
      zone: zoneView,
      missions: zoneMissions,
    };
  }

  async getMissionDetailsForStudent(studentId: string, missionId: string) {
    const mission = await MissionModel.findById(missionId).lean();
    if (!mission || !mission.isPublished) {
      throw new AppError('Mission not found', 404, 'MISSION_NOT_FOUND');
    }

    const mapData = await this.getSubjectMapForStudent(studentId, mission.subjectId.toString());
    const missionView = mapData.missions.find((m) => m.id === missionId);
    if (!missionView) {
      throw new AppError('Mission not found in map', 404, 'MISSION_NOT_FOUND');
    }
    return missionView;
  }

  async startMission(studentId: string, missionId: string) {
    const mission = await MissionModel.findById(missionId).lean();
    if (!mission || !mission.isPublished) {
      throw new AppError('Mission not found', 404, 'MISSION_NOT_FOUND');
    }

    await this.assertSequentialUnlocked(studentId, mission as unknown as IMission);

    const existing = await StudentMissionProgressModel.findOne({ studentId, missionId });
    if (existing && existing.status === 'COMPLETED') {
      existing.attempts += 1;
      await existing.save();
      return {
        missionId,
        status: existing.status,
        attempts: existing.attempts,
        startedAt: existing.startedAt,
      };
    }

    const updated = await StudentMissionProgressModel.findOneAndUpdate(
      { studentId, missionId },
      {
        $set: {
          subjectId: mission.subjectId,
          mapId: mission.mapId,
          status: 'IN_PROGRESS',
        },
        $setOnInsert: {
          startedAt: new Date(),
          bestScore: 0,
          stars: 0,
          xpAwarded: 0,
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true },
    );

    await studentDashboardService.onMissionStarted(studentId, missionId, mission.subjectId);

    return {
      missionId,
      status: updated.status,
      attempts: updated.attempts,
      startedAt: updated.startedAt,
    };
  }

  async completeMission(studentId: string, missionId: string, submittedScore = 100) {
    const mission = await MissionModel.findById(missionId).lean();
    if (!mission || !mission.isPublished) {
      throw new AppError('Mission not found', 404, 'MISSION_NOT_FOUND');
    }

    // Validate sequential & prerequisite unlocking server-side
    await this.assertSequentialUnlocked(studentId, mission as unknown as IMission);

    const clampedScore = Math.max(0, Math.min(100, Math.round(submittedScore)));
    const earnedStars = computeStars(clampedScore);
    const now = new Date();

    // Atomic check-and-set: only one request can transition a mission from non-COMPLETED to COMPLETED
    // and claim the XP reward, preventing duplicate XP on concurrent or repeated submissions.
    const firstCompletion = await StudentMissionProgressModel.findOneAndUpdate(
      {
        studentId,
        missionId: mission._id,
        status: { $ne: 'COMPLETED' },
      },
      {
        $set: {
          subjectId: mission.subjectId,
          mapId: mission.mapId,
          status: 'COMPLETED',
          completedAt: now,
          xpAwarded: mission.xpReward,
        },
        $max: {
          bestScore: clampedScore,
          stars: earnedStars,
        },
        $min: {
          startedAt: now,
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true },
    ).catch(async (err) => {
      // Handle rare duplicate key race on concurrent upsert: fall back to already-completed path
      if (err?.code === 11000) {
        return null;
      }
      throw err;
    });

    let xpAwarded = 0;
    let leveledUp = false;
    let newLevel = 1;
    let streakUpdate: Awaited<ReturnType<typeof streakService.recordEligibleActivity>> | null = null;
    let conquerorEvent: ConquerorEventPayload | null = null;
    let unlockedClothingRewards: Array<{
      itemKey: string;
      name: string;
      category: string;
      rarity: string;
      subjectSlug: string | null;
    }> = [];

    if (firstCompletion) {
      const subjectDoc = await SubjectModel.findById(mission.subjectId).select('slug').lean();
      const xpResult = await xpService.awardXp({
        userId: studentId,
        amount: mission.xpReward,
        sourceType: 'node_completion',
        sourceId: missionId,
        subjectId: mission.subjectId,
        subjectSlug: subjectDoc?.slug,
        idempotencyKey: `mission:${studentId}:${missionId}`,
        description: `Completed mission: ${mission.title}`,
      });
      xpAwarded = xpResult.xpAwarded;
      leveledUp = xpResult.leveledUp;
      newLevel = xpResult.progress.level;

      const activityType: EligibleLearningActivityType =
        mission.missionType === 'Virtual experiment'
          ? 'virtual_lab'
          : mission.missionType === 'Challenge'
            ? 'challenge'
            : mission.missionType === 'Quiz'
              ? 'quiz'
              : 'lesson';

      streakUpdate = await streakService.recordEligibleActivity({
        studentId,
        activityType,
        activityId: missionId,
        title: mission.title,
      });

      // Idempotent level-based clothing rewards
      await ensureLevelRewardsSeeded();
      const levelCfg = await LevelRewardConfigModel.findOne({
        missionSlug: mission.slug,
        isRewardEnabled: true,
      }).lean();

      if (levelCfg && levelCfg.rewardItemKeys.length > 0 && levelCfg.rewardType !== 'conqueror') {
        let claimedNow = false;
        try {
          await LevelRewardClaimModel.create({
            studentId,
            missionId,
            missionSlug: mission.slug,
            subjectSlug: levelCfg.subjectSlug,
            rewardItemKeys: levelCfg.rewardItemKeys,
            rewardXp: levelCfg.rewardXp,
            claimedAt: now,
          });
          claimedNow = true;
        } catch (err: unknown) {
          const mongoErr = err as { code?: number };
          if (mongoErr?.code !== 11000) throw err;
        }

        if (claimedNow) {
          await StudentAvatarModel.findOneAndUpdate(
            { studentId },
            {
              $addToSet: { unlockedItemKeys: { $each: levelCfg.rewardItemKeys } },
              $setOnInsert: {
                appearance: DEFAULT_AVATAR_APPEARANCE,
                equippedItems: DEFAULT_EQUIPPED_ITEMS,
              },
            },
            { upsert: true },
          );

          if (levelCfg.rewardXp > 0) {
            await xpService.awardXp({
              userId: studentId,
              amount: levelCfg.rewardXp,
              sourceType: 'mission',
              sourceId: missionId,
              subjectId: mission.subjectId,
              subjectSlug: levelCfg.subjectSlug,
              idempotencyKey: `level-reward:${studentId}:${missionId}`,
              description: `Level ${mission.sequence} bonus reward`,
            });
          }

          const rewardDocs = await AvatarItemModel.find({
            itemKey: { $in: levelCfg.rewardItemKeys },
          })
            .select('itemKey name category rarity subjectSlug')
            .lean();

          unlockedClothingRewards = rewardDocs.map((d) => ({
            itemKey: d.itemKey,
            name: d.name,
            category: d.category,
            rarity: d.rarity ?? 'rare',
            subjectSlug: d.subjectSlug ?? levelCfg.subjectSlug,
          }));
        }
      }

      await studentDashboardService.onMissionCompleted({
        studentId,
        missionId,
        missionTitle: mission.title,
        subjectId: mission.subjectId,
        xpAwarded,
        leveledUp,
        newLevel,
      });
    } else {
      // Already completed: update bestScore / stars if improved, but award 0 XP
      await StudentMissionProgressModel.updateOne(
        { studentId, missionId: mission._id },
        {
          $max: { bestScore: clampedScore, stars: earnedStars },
          $inc: { attempts: 1 },
        },
      );
    }

    // Update zone progress record
    const [zoneMissions, completedInZone] = await Promise.all([
      MissionModel.countDocuments({ locationId: mission.locationId, isPublished: true }),
      StudentMissionProgressModel.countDocuments({
        studentId,
        mapId: mission.mapId,
        status: 'COMPLETED',
        missionId: {
          $in: await MissionModel.find({ locationId: mission.locationId, isPublished: true }).distinct('_id'),
        },
      }),
    ]);

    const zoneCompleted = zoneMissions > 0 && completedInZone >= zoneMissions;
    await StudentZoneProgressModel.findOneAndUpdate(
      { studentId, locationId: mission.locationId },
      {
        $set: {
          subjectId: mission.subjectId,
          mapId: mission.mapId,
          status: zoneCompleted ? 'COMPLETED' : 'UNLOCKED',
          completedMissions: completedInZone,
          ...(zoneCompleted ? { completedAt: now } : {}),
        },
        $setOnInsert: { unlockedAt: now },
      },
      { upsert: true },
    );

    const updatedMap = await this.getSubjectMapForStudent(studentId, mission.subjectId.toString());

    if (firstCompletion) {
      conquerorEvent = await subjectConquerorService.checkAndAwardConqueror(
        studentId,
        mission.subjectId,
        mission.mapId,
        updatedMap.map.mapName,
      );
    }

    return {
      missionId,
      alreadyCompleted: !firstCompletion,
      xpAwarded,
      leveledUp,
      starsEarned: earnedStars,
      score: clampedScore,
      streakUpdate,
      conquerorEvent,
      unlockedClothingRewards,
      map: updatedMap,
    };
  }

  async getOverallStudentMapProgress(studentId: string) {
    const [playerProgress, subjects] = await Promise.all([
      xpService.getOrCreateProgress(studentId),
      this.listSubjectsWithProgress(studentId),
    ]);

    return {
      totalXp: playerProgress.totalXp,
      level: playerProgress.level,
      subjects,
    };
  }

  async upsertZone(input: {
    mapId: string;
    name: string;
    slug: string;
    locationType?: string;
    positionX: number;
    positionY: number;
    accentColor?: string;
    displayOrder?: number;
    description?: string;
  }): Promise<IMapLocation> {
    const doc = await MapLocationModel.findOneAndUpdate(
      { mapId: new Types.ObjectId(input.mapId), slug: input.slug.toLowerCase() },
      {
        $set: {
          name: input.name,
          locationType: input.locationType ?? 'zone',
          positionX: input.positionX,
          positionY: input.positionY,
          accentColor: input.accentColor ?? '#eab308',
          displayOrder: input.displayOrder ?? 0,
          description: input.description ?? '',
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
    return doc;
  }

  async upsertMission(input: {
    subjectId: string;
    mapId: string;
    locationId: string;
    slug: string;
    title: string;
    description: string;
    missionType: IMission['missionType'];
    difficulty: IMission['difficulty'];
    xpReward: number;
    prerequisites?: string[];
    sequence: number;
    learningObjectives?: string[];
    positionX: number;
    positionY: number;
    isPublished?: boolean;
  }): Promise<IMission> {
    const doc = await MissionModel.findOneAndUpdate(
      { mapId: new Types.ObjectId(input.mapId), slug: input.slug.toLowerCase() },
      {
        $set: {
          subjectId: new Types.ObjectId(input.subjectId),
          locationId: new Types.ObjectId(input.locationId),
          title: input.title,
          description: input.description,
          missionType: input.missionType,
          difficulty: input.difficulty,
          xpReward: input.xpReward,
          prerequisites: (input.prerequisites ?? []).map((id) => new Types.ObjectId(id)),
          sequence: input.sequence,
          learningObjectives: input.learningObjectives ?? [],
          positionX: input.positionX,
          positionY: input.positionY,
          isPublished: input.isPublished ?? true,
        },
      },
      { upsert: true, new: true },
    );
    return doc;
  }
}

export const studentMapService = new StudentMapService();
