import { Types } from 'mongoose';
import { SubjectModel } from '../../catalog/models/Subject.model';
import { AvatarItemModel } from '../../users/models/AvatarItem.model';
import { StudentActivityModel } from '../../users/models/StudentActivity.model';
import {
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
  StudentAvatarModel,
} from '../../users/models/StudentAvatar.model';
import { StudentProfileModel } from '../../users/models/StudentProfile.model';
import { AchievementModel } from '../models/Achievement.model';
import { MissionModel } from '../models/Mission.model';
import { StudentMissionProgressModel } from '../models/StudentMissionProgress.model';
import { SubjectConquerorModel } from '../models/SubjectConqueror.model';
import { UserAchievementModel } from '../models/UserAchievement.model';
import { getSubjectConquerorConfig } from './subjectConqueror.config';
import { xpService } from './xp.service';

export interface ConquerorEventPayload {
  triggered: boolean;
  subjectSlug: string;
  subjectName: string;
  kingdomName: string;
  conquerorTitle: string;
  crownItemKey: string;
  xpBonus: number;
  achievementCode: string;
  accentColor: string;
  unlockedRewards: Array<{
    itemKey: string;
    name: string;
    category: string;
    rarity: string;
  }>;
}

export class SubjectConquerorService {
  async checkAndAwardConqueror(
    studentId: string,
    subjectId: Types.ObjectId,
    mapId: Types.ObjectId,
    mapName: string,
  ): Promise<ConquerorEventPayload | null> {
    const [publishedMissions, completedMissions, subject] = await Promise.all([
      MissionModel.find({ mapId, isPublished: true }).select('_id').lean(),
      StudentMissionProgressModel.find({
        studentId,
        mapId,
        status: 'COMPLETED',
      })
        .select('missionId')
        .lean(),
      SubjectModel.findById(subjectId).select('slug name').lean(),
    ]);

    if (!subject || publishedMissions.length === 0) return null;

    const completedSet = new Set(completedMissions.map((m) => m.missionId.toString()));
    const allCompleted = publishedMissions.every((m) => completedSet.has(m._id.toString()));
    if (!allCompleted) return null;

    const subjectSlug = subject.slug.toLowerCase();
    const config = getSubjectConquerorConfig(subjectSlug);
    const titleAwarded = config?.conquerorTitle ?? `${subject.name} Conqueror`;
    const crownItemKey = config?.crownItemKey ?? 'headwear-crown';
    const rewardItemKeys = config?.rewardItemKeys ?? [crownItemKey];
    const xpBonus = config?.xpBonus ?? 300;
    const achievementCode = config?.achievementCode ?? `CONQUEROR_${subjectSlug.toUpperCase()}`;

    // Atomic once-only guard via unique { studentId, subjectSlug } index
    try {
      await SubjectConquerorModel.create({
        studentId,
        subjectSlug,
        subjectName: subject.name,
        mapName,
        titleAwarded,
        crownItemKey,
        unlockedItemKeys: rewardItemKeys,
        xpBonusAwarded: xpBonus,
        achievementCode,
        conqueredAt: new Date(),
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr?.code === 11000) {
        // Already conquered previously — never trigger twice
        return null;
      }
      throw err;
    }

    // Award bonus XP idempotently
    await xpService.awardXp({
      userId: studentId,
      amount: xpBonus,
      sourceType: 'achievement',
      sourceId: `conqueror:${subjectSlug}`,
      subjectId,
      subjectSlug,
      idempotencyKey: `conqueror:${studentId}:${subjectSlug}`,
      description: `Conquered ${mapName} (${subject.name}) — Earned title: ${titleAwarded}!`,
    });

    // Unlock Conqueror Achievement
    const ach = await AchievementModel.findOne({ code: achievementCode }).lean();
    if (ach) {
      await UserAchievementModel.create({
        userId: studentId,
        achievementId: ach._id,
        unlockedAt: new Date(),
        claimed: true,
        claimedAt: new Date(),
      }).catch((err: unknown) => {
        const mongoErr = err as { code?: number };
        if (mongoErr?.code !== 11000) throw err;
      });
    }

    // Unlock 3D Avatar Rewards
    await StudentAvatarModel.findOneAndUpdate(
      { studentId },
      {
        $addToSet: { unlockedItemKeys: { $each: rewardItemKeys } },
        $setOnInsert: {
          appearance: DEFAULT_AVATAR_APPEARANCE,
          equippedItems: DEFAULT_EQUIPPED_ITEMS,
        },
      },
      { upsert: true },
    );

    // Update Student Profile with conquered subject & title
    await StudentProfileModel.updateOne(
      { studentId },
      {
        $addToSet: { conqueredSubjects: subjectSlug },
        $set: { activeTitle: titleAwarded },
      },
    );

    await StudentActivityModel.create({
      studentId,
      activityType: 'subject_conquered',
      description: `Conquered ${mapName}! Earned title "${titleAwarded}" and royal gear.`,
      referenceId: subjectSlug,
      xpDelta: xpBonus,
    }).catch(() => undefined);

    const unlockedItemDocs = await AvatarItemModel.find({
      itemKey: { $in: rewardItemKeys },
    })
      .select('itemKey name category rarity')
      .lean();

    return {
      triggered: true,
      subjectSlug,
      subjectName: subject.name,
      kingdomName: mapName,
      conquerorTitle: titleAwarded,
      crownItemKey,
      xpBonus,
      achievementCode,
      accentColor: config?.accentColor ?? '#f59e0b',
      unlockedRewards: unlockedItemDocs.map((item) => ({
        itemKey: item.itemKey,
        name: item.name,
        category: item.category,
        rarity: item.rarity ?? 'legendary',
      })),
    };
  }

  async listConqueredForStudent(studentId: string) {
    const records = await SubjectConquerorModel.find({ studentId })
      .sort({ conqueredAt: -1 })
      .lean();

    return records.map((r) => ({
      subjectSlug: r.subjectSlug,
      subjectName: r.subjectName,
      mapName: r.mapName,
      titleAwarded: r.titleAwarded,
      crownItemKey: r.crownItemKey,
      unlockedItemKeys: r.unlockedItemKeys,
      xpBonusAwarded: r.xpBonusAwarded,
      achievementCode: r.achievementCode,
      conqueredAt: r.conqueredAt,
    }));
  }
}

export const subjectConquerorService = new SubjectConquerorService();
