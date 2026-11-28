import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedOutfitModel } from '../models/SavedOutfit.model';
import {
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
  StudentAvatarModel,
} from '../models/StudentAvatar.model';
import { AvatarItemModel } from '../models/AvatarItem.model';
import { StudentActivityModel } from '../models/StudentActivity.model';
import { StudentDashboardService } from '../services/studentDashboard.service';

describe('Avatar Fashion Studio & Saved Outfits', () => {
  const service = new StudentDashboardService();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects saving an outfit that includes locked clothing items', async () => {
    vi.spyOn(SavedOutfitModel, 'countDocuments').mockResolvedValue(0 as never);
    vi.spyOn(service, 'evaluateAndUnlockRewards').mockResolvedValue({
      avatar: {
        studentId: 'stu-1',
        appearance: { ...DEFAULT_AVATAR_APPEARANCE },
        equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
        unlockedItemKeys: ['skin-warm', 'outfit-basic-tee'],
      } as never,
      newlyUnlockedAchievements: [],
      newlyUnlockedItems: [],
      userAchievements: [],
      allItems: [],
    });

    await expect(
      service.createSavedOutfit('stu-1', {
        outfitName: 'Locked Look',
        appearance: { outfit: 'outfit-royal-locked' },
      }),
    ).rejects.toThrow('Cannot save locked item');
  });

  it('creates, equips, and deletes a saved outfit when all items are owned', async () => {
    const outfitId = new Types.ObjectId();
    vi.spyOn(SavedOutfitModel, 'countDocuments').mockResolvedValue(1 as never);
    vi.spyOn(service, 'evaluateAndUnlockRewards').mockResolvedValue({
      avatar: {
        studentId: 'stu-1',
        appearance: { ...DEFAULT_AVATAR_APPEARANCE },
        equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
        unlockedItemKeys: [
          ...Object.values(DEFAULT_AVATAR_APPEARANCE),
          ...Object.values(DEFAULT_EQUIPPED_ITEMS),
          'outfit-basic-tee',
        ],
        save: vi.fn().mockResolvedValue(undefined),
      } as never,
      newlyUnlockedAchievements: [],
      newlyUnlockedItems: [],
      userAchievements: [],
      allItems: [],
    });

    vi.spyOn(SavedOutfitModel, 'create').mockResolvedValue({
      _id: outfitId,
      studentId: 'stu-1',
      outfitName: 'Casual Explorer',
      appearance: { ...DEFAULT_AVATAR_APPEARANCE, outfit: 'outfit-basic-tee' },
      equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const created = await service.createSavedOutfit('stu-1', {
      outfitName: 'Casual Explorer',
      appearance: { outfit: 'outfit-basic-tee' },
    });
    expect(created.outfitName).toBe('Casual Explorer');
    expect(created.id).toBe(outfitId.toString());

    vi.spyOn(SavedOutfitModel, 'findOneAndDelete').mockResolvedValue({ _id: outfitId } as never);
    vi.spyOn(StudentAvatarModel, 'updateOne').mockResolvedValue({} as never);
    const delRes = await service.deleteSavedOutfit('stu-1', outfitId.toString());
    expect(delRes).toEqual({ deleted: true, id: outfitId.toString() });
  });

  it('clears full-body costume when equipping separate shirt/jacket/bottoms', async () => {
    const avatarDoc = {
      studentId: 'stu-1',
      appearance: { ...DEFAULT_AVATAR_APPEARANCE, costume: 'costume-wizard' },
      equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
      unlockedItemKeys: ['outfit-basic-tee', 'costume-wizard'],
      activeOutfitId: null as string | null,
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(service, 'evaluateAndUnlockRewards').mockResolvedValue({
      avatar: avatarDoc as never,
      newlyUnlockedAchievements: [],
      newlyUnlockedItems: [],
      userAchievements: [],
      allItems: [],
    });
    vi.spyOn(AvatarItemModel, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        { itemKey: 'outfit-basic-tee', name: 'Classic Crew T-Shirt', category: 'outfit', unlockRequirement: { label: 'Starter' } },
      ]),
    } as never);
    vi.spyOn(StudentActivityModel, 'create').mockResolvedValue({} as never);

    const updated = await service.updateAvatar('stu-1', {
      appearance: { outfit: 'outfit-basic-tee' },
    });
    expect(updated.appearance.outfit).toBe('outfit-basic-tee');
    expect(updated.appearance.costume).toBe('costume-none');
  });
});
