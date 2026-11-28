import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubjectModel } from '../../catalog/models/Subject.model';
import { AvatarItemModel } from '../../users/models/AvatarItem.model';
import { StudentActivityModel } from '../../users/models/StudentActivity.model';
import { StudentAvatarModel } from '../../users/models/StudentAvatar.model';
import { StudentProfileModel } from '../../users/models/StudentProfile.model';
import { AchievementModel } from '../models/Achievement.model';
import { MissionModel } from '../models/Mission.model';
import { StudentMissionProgressModel } from '../models/StudentMissionProgress.model';
import { SubjectConquerorModel } from '../models/SubjectConqueror.model';
import { UserAchievementModel } from '../models/UserAchievement.model';
import { SubjectConquerorService } from '../services/subjectConqueror.service';
import { xpService } from '../services/xp.service';

describe('SubjectConquerorService', () => {
  const service = new SubjectConquerorService();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not trigger conqueror event until all published map levels are completed', async () => {
    const m1 = new Types.ObjectId();
    const m2 = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const mapId = new Types.ObjectId();

    vi.spyOn(MissionModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: m1 }, { _id: m2 }]),
    } as never);
    vi.spyOn(StudentMissionProgressModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ missionId: m1 }]),
    } as never);
    vi.spyOn(SubjectModel, 'findById').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ slug: 'mathematics', name: 'Mathematics' }),
    } as never);

    const res = await service.checkAndAwardConqueror('stu-1', subjectId, mapId, 'Number Kingdom');
    expect(res).toBeNull();
  });

  it('awards configured conqueror title, XP, achievement, and 3D avatar rewards once only', async () => {
    const m1 = new Types.ObjectId();
    const m2 = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const mapId = new Types.ObjectId();

    vi.spyOn(MissionModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: m1 }, { _id: m2 }]),
    } as never);
    vi.spyOn(StudentMissionProgressModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ missionId: m1 }, { missionId: m2 }]),
    } as never);
    vi.spyOn(SubjectModel, 'findById').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ slug: 'mathematics', name: 'Mathematics' }),
    } as never);

    let created = false;
    vi.spyOn(SubjectConquerorModel, 'create').mockImplementation((async (doc: unknown) => {
      if (created) {
        const err = new Error('Duplicate key') as Error & { code?: number };
        err.code = 11000;
        throw err;
      }
      created = true;
      return doc;
    }) as never);

    const awardXpSpy = vi.spyOn(xpService, 'awardXp').mockResolvedValue({
      progress: {} as never,
      xpAwarded: 300,
      leveledUp: true,
    });
    vi.spyOn(AchievementModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: new Types.ObjectId(), code: 'CONQUEROR_MATHEMATICS' }),
    } as never);
    vi.spyOn(UserAchievementModel, 'create').mockResolvedValue({} as never);
    const avatarSpy = vi.spyOn(StudentAvatarModel, 'findOneAndUpdate').mockResolvedValue({} as never);
    const profileSpy = vi.spyOn(StudentProfileModel, 'updateOne').mockResolvedValue({} as never);
    vi.spyOn(StudentActivityModel, 'create').mockResolvedValue({} as never);
    vi.spyOn(AvatarItemModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { itemKey: 'headwear-crown-math', name: 'Golden Math Crown', category: 'headwear', rarity: 'legendary' },
      ]),
    } as never);

    const first = await service.checkAndAwardConqueror('stu-1', subjectId, mapId, 'Number Kingdom');
    expect(first).not.toBeNull();
    expect(first?.conquerorTitle).toBe('Math King');
    expect(first?.crownItemKey).toBe('headwear-crown-math');
    expect(first?.xpBonus).toBe(300);
    expect(awardXpSpy).toHaveBeenCalledTimes(1);
    expect(avatarSpy).toHaveBeenCalledTimes(1);
    expect(profileSpy).toHaveBeenCalledTimes(1);

    // Second call (duplicate / replay) must return null and award 0 extra XP
    const second = await service.checkAndAwardConqueror('stu-1', subjectId, mapId, 'Number Kingdom');
    expect(second).toBeNull();
    expect(awardXpSpy).toHaveBeenCalledTimes(1);
  });
});
