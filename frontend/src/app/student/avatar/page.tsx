'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  Filter,
  Lock,
  RotateCcw,
  Save,
  Shirt,
  Shuffle,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  DEFAULT_AVATAR_APPEARANCE,
  DEFAULT_EQUIPPED_ITEMS,
} from '@/components/avatar/StudentAvatar2D';
import { StudentAvatar } from '@/components/avatar/StudentAvatar';
import { AvatarAnimationState } from '@/components/avatar/three/avatarAnimations';
import { GameButton } from '@/components/game-ui/GameButton';
import {
  ItemThumbnail,
  RARITY_STYLES,
  resolveItemRarity,
} from '@/components/game-ui/ItemThumbnail';
import { StudioBackdrop } from '@/components/game-ui/StudioBackdrop';
import { toFriendlyStudentError } from '@/components/game-ui/friendlyError';
import { StudentNavShell } from '@/components/student/StudentNavShell';
import {
  ApiError,
  apiClient,
  clearAuthSession,
  getCachedAvatarItems,
  getCachedDashboard,
  getStoredToken,
  setCachedAvatarItems,
  setCachedDashboard,
} from '@/lib/apiClient';
import {
  AvatarAppearance,
  AvatarEquippedItems,
  AvatarItem,
  AvatarItemCategory,
  SavedOutfit,
  StudentDashboardData,
} from '@/types/student';

interface CategoryGroup {
  id: 'apparel' | 'gear' | 'details' | 'body';
  label: string;
  categories: Array<{ key: AvatarItemCategory; label: string }>;
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'apparel',
    label: 'Apparel',
    categories: [
      { key: 'outfit', label: 'Shirts' },
      { key: 'jacket', label: 'Jackets' },
      { key: 'bottoms', label: 'Bottoms' },
      { key: 'shoes', label: 'Shoes' },
      { key: 'costume', label: 'Costumes' },
    ],
  },
  {
    id: 'gear',
    label: 'Gear & Magic',
    categories: [
      { key: 'headwear', label: 'Crowns & Hats' },
      { key: 'cape', label: 'Capes' },
      { key: 'aura', label: 'Auras' },
      { key: 'backpack', label: 'Backpacks' },
      { key: 'glasses', label: 'Glasses' },
    ],
  },
  {
    id: 'details',
    label: 'Details',
    categories: [
      { key: 'neckwear', label: 'Neckwear' },
      { key: 'wristwear', label: 'Watches' },
      { key: 'badge', label: 'Badges' },
      { key: 'accessory', label: 'Accessories' },
    ],
  },
  {
    id: 'body',
    label: 'Body & Face',
    categories: [
      { key: 'skinTone', label: 'Skin Tone' },
      { key: 'hairstyle', label: 'Hairstyle' },
      { key: 'hairColor', label: 'Hair Color' },
      { key: 'face', label: 'Expression' },
      { key: 'eyes', label: 'Eyes' },
    ],
  },
];

const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.categories);

const SUBJECT_FILTERS = [
  { key: 'all', label: 'All Realms' },
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'physics', label: 'Physics' },
  { key: 'chemistry', label: 'Chemistry' },
  { key: 'biology', label: 'Biology' },
  { key: 'computer-science', label: 'Computer Science' },
  { key: 'english', label: 'English' },
  { key: 'geography', label: 'Geography' },
];

const ANIMATION_MODES: Array<{ key: AvatarAnimationState; label: string }> = [
  { key: 'idle', label: 'Idle' },
  { key: 'walk', label: 'Walk' },
  { key: 'jump', label: 'Jump' },
  { key: 'celebrate', label: 'Cheer' },
];

const EQUIPPED_KEYS = new Set<AvatarItemCategory>([
  'headwear',
  'glasses',
  'backpack',
  'cape',
  'aura',
  'neckwear',
  'wristwear',
  'badge',
  'accessory',
]);

function formatSlotValue(val?: string): string {
  if (!val) return 'None';
  const cleaned = val
    .replace(/^(outfit|jacket|bottoms|shoes|costume|headwear|cape|aura|backpack|glasses|neckwear|wristwear|badge|accessory)-/, '')
    .replace(/-/g, ' ')
    .trim();
  if (!cleaned || cleaned === 'none') return 'None';
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudentAvatarPage() {
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [appearance, setAppearance] = useState<AvatarAppearance>(DEFAULT_AVATAR_APPEARANCE);
  const [equippedItems, setEquippedItems] = useState<AvatarEquippedItems>(DEFAULT_EQUIPPED_ITEMS);
  const [activeGroupId, setActiveGroupId] = useState<CategoryGroup['id']>('apparel');
  const [activeCategory, setActiveCategory] = useState<AvatarItemCategory>('outfit');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showSavedOutfits, setShowSavedOutfits] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<{
    appearance?: Partial<AvatarAppearance>;
    equippedItems?: Partial<AvatarEquippedItems>;
    itemName: string;
    requirement: string;
  } | null>(null);
  const [previewAnim, setPreviewAnim] = useState<AvatarAnimationState>('idle');
  const [celebrateTick, setCelebrateTick] = useState(0);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [newOutfitName, setNewOutfitName] = useState('');
  const [savingOutfit, setSavingOutfit] = useState(false);
  const [studentMeta, setStudentMeta] = useState<{
    displayName: string;
    classGrade: string;
    level: number;
    totalXp: number;
    reducedMotion?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAvatarData = useCallback(async () => {
    if (!getStoredToken()) {
      setError('Please sign in from Base Camp to customize your explorer.');
      setLoading(false);
      return;
    }

    const cachedDash = getCachedDashboard<StudentDashboardData>();
    const cachedItems = getCachedAvatarItems<AvatarItem[]>();
    if (cachedDash) {
      setStudentMeta({
        displayName: cachedDash.profile.displayName,
        classGrade: cachedDash.profile.classGrade,
        level: cachedDash.xp.level,
        totalXp: cachedDash.xp.totalXp,
        reducedMotion: cachedDash.profile.accessibilitySettings?.reducedMotion,
      });
    }
    if (cachedDash && cachedItems && cachedItems.length > 0) {
      setAppearance(cachedDash.avatar.appearance);
      setEquippedItems(cachedDash.avatar.equippedItems);
      setItems(cachedItems);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const [avatarRes, itemsRes, outfitsRes] = await Promise.all([
        apiClient.getStudentAvatar(),
        apiClient.getStudentAvatarItems(),
        apiClient.getSavedOutfits().catch(() => []),
      ]);
      setAppearance(avatarRes.appearance);
      setEquippedItems(avatarRes.equippedItems);
      setItems(itemsRes);
      setSavedOutfits(outfitsRes);
      setCachedAvatarItems(itemsRes);
      if (cachedDash) {
        setCachedDashboard({ ...cachedDash, avatar: avatarRes });
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === 'TOKEN_INVALID')) {
        clearAuthSession();
        setItems([]);
        setError('Your session expired. Please sign in again from Base Camp.');
      } else if (!(cachedDash && cachedItems && cachedItems.length > 0)) {
        setError(
          toFriendlyStudentError(
            err,
            'We could not open your Avatar Studio right now. Please try again.',
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvatarData();
  }, [loadAvatarData]);

  const activeGroup = useMemo(
    () => CATEGORY_GROUPS.find((g) => g.id === activeGroupId) ?? CATEGORY_GROUPS[0],
    [activeGroupId],
  );

  const handleSelectGroup = (group: CategoryGroup) => {
    setActiveGroupId(group.id);
    if (!group.categories.some((c) => c.key === activeCategory)) {
      setActiveCategory(group.categories[0].key);
    }
  };

  const categoryItems = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.category === activeCategory &&
        (subjectFilter === 'all' || item.subjectSlug === subjectFilter),
    );
    return filtered.sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  }, [activeCategory, items, subjectFilter]);

  const currentSelectionForCategory = useCallback(
    (category: AvatarItemCategory): string => {
      if (EQUIPPED_KEYS.has(category)) {
        return equippedItems[category as keyof AvatarEquippedItems] ?? '';
      }
      return appearance[category as keyof AvatarAppearance] ?? '';
    },
    [appearance, equippedItems],
  );

  const handleSelectItem = (item: AvatarItem) => {
    if (!item.unlocked) {
      if (EQUIPPED_KEYS.has(item.category)) {
        setPreviewOverride({
          equippedItems: { [item.category]: item.itemKey },
          itemName: item.name,
          requirement: item.unlockRequirement.label,
        });
      } else {
        setPreviewOverride({
          appearance: { [item.category]: item.itemKey },
          itemName: item.name,
          requirement: item.unlockRequirement.label,
        });
      }
      setMessage(`Previewing "${item.name}" — Unlock: ${item.unlockRequirement.label}`);
      return;
    }

    setPreviewOverride(null);
    setMessage(`Equipped "${item.name}"`);
    if (EQUIPPED_KEYS.has(item.category)) {
      setEquippedItems((prev) => ({ ...prev, [item.category]: item.itemKey }));
    } else {
      setAppearance((prev) => {
        const next = { ...prev, [item.category]: item.itemKey };
        if (
          item.category !== 'costume' &&
          (item.category === 'outfit' || item.category === 'jacket' || item.category === 'bottoms')
        ) {
          next.costume = 'costume-none';
        }
        return next;
      });
    }
  };

  const handleRandomize = () => {
    const nextAppearance = { ...appearance };
    const nextEquipped = { ...equippedItems };

    for (const cat of ALL_CATEGORIES) {
      const unlocked = items.filter((i) => i.category === cat.key && i.unlocked);
      if (unlocked.length === 0) continue;
      const pick = unlocked[Math.floor(Math.random() * unlocked.length)];
      if (EQUIPPED_KEYS.has(cat.key)) {
        nextEquipped[cat.key as keyof AvatarEquippedItems] = pick.itemKey;
      } else {
        nextAppearance[cat.key as keyof AvatarAppearance] = pick.itemKey;
      }
    }

    setPreviewOverride(null);
    setAppearance(nextAppearance);
    setEquippedItems(nextEquipped);
    setCelebrateTick((c) => c + 1);
    setMessage('Randomized using your unlocked gear!');
  };

  const handleReset = () => {
    setPreviewOverride(null);
    setAppearance(DEFAULT_AVATAR_APPEARANCE);
    setEquippedItems(DEFAULT_EQUIPPED_ITEMS);
    setMessage('Reset to starter explorer appearance.');
  };

  const handleSaveAsOutfit = async () => {
    const trimmed = newOutfitName.trim();
    if (!trimmed) {
      setError('Enter a name for your outfit.');
      return;
    }
    setSavingOutfit(true);
    setError(null);
    try {
      const created = await apiClient.createSavedOutfit({
        outfitName: trimmed,
        appearance,
        equippedItems,
      });
      setSavedOutfits((prev) => [created, ...prev]);
      setNewOutfitName('');
      setMessage(`Saved outfit "${created.outfitName}"!`);
    } catch (err) {
      setError(toFriendlyStudentError(err, 'Could not save outfit right now.'));
    } finally {
      setSavingOutfit(false);
    }
  };

  const handleEquipSavedOutfit = async (outfit: SavedOutfit) => {
    setPreviewOverride(null);
    setAppearance(outfit.appearance);
    setEquippedItems(outfit.equippedItems);
    try {
      const updated = await apiClient.updateSavedOutfit(outfit.id, { equip: true });
      setCelebrateTick((c) => c + 1);
      setMessage(`Equipped "${updated.outfitName}"!`);
    } catch (err) {
      setError(toFriendlyStudentError(err, 'Could not equip saved outfit.'));
    }
  };

  const handleDeleteSavedOutfit = async (outfitId: string) => {
    try {
      await apiClient.deleteSavedOutfit(outfitId);
      setSavedOutfits((prev) => prev.filter((o) => o.id !== outfitId));
    } catch (err) {
      setError(toFriendlyStudentError(err, 'Could not delete outfit.'));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await apiClient.updateStudentAvatar({
        appearance,
        equippedItems,
      });
      setAppearance(updated.appearance);
      setEquippedItems(updated.equippedItems);
      const cachedDash = getCachedDashboard<StudentDashboardData>();
      if (cachedDash) {
        setCachedDashboard({ ...cachedDash, avatar: updated });
      }
      setCelebrateTick((c) => c + 1);
      setMessage('Explorer look saved!');
    } catch (err) {
      setError(toFriendlyStudentError(err, 'Could not save avatar changes.'));
    } finally {
      setSaving(false);
    }
  };

  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <StudentNavShell
      displayName={studentMeta?.displayName}
      level={studentMeta?.level}
      avatar={{
        appearance,
        equippedItems,
        unlockedItemKeys: items.filter((i) => i.unlocked).map((i) => i.itemKey),
      }}
    >
      {/* Compact Studio Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/student/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#233B59] bg-[#0D1B2D] px-3 text-xs font-extrabold text-[#E9DFC7] transition hover:border-[#F5B900]/60 hover:text-[#F5B900]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Base Camp
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#E9DFC7] sm:text-2xl">
              Explorer Dressing Room
            </h1>
            <p className="text-xs text-[#E9DFC7]/65">
              {unlockedCount} of {items.length} gear pieces unlocked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSavedOutfits((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold transition ${
              showSavedOutfits
                ? 'border-[#FFD95A] bg-[#F5B900] text-[#071426]'
                : 'border-[#233B59] bg-[#0D1B2D] text-[#E9DFC7] hover:border-[#F5B900]/60'
            }`}
          >
            <Shirt className="h-3.5 w-3.5" />
            Saved Outfits ({savedOutfits.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="h-[460px] animate-pulse rounded-2xl bg-[#0D1B2D] lg:col-span-5" />
          <div className="h-[460px] animate-pulse rounded-2xl bg-[#0D1B2D] lg:col-span-7" />
        </div>
      ) : error && items.length === 0 ? (
        <div className="vq-panel rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-rose-200">{error}</p>
          <GameButton variant="gold" size="sm" href="/student/dashboard" className="mt-4">
            Go to Base Camp
          </GameButton>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-12">
          {/* LEFT: Spacious 3D Character Studio Stage */}
          <section className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-[#233B59] bg-[#0A182B] p-4 lg:col-span-5">
            <StudioBackdrop className="absolute inset-0 h-full w-full" />

            {/* Top Player Badge */}
            <div className="relative z-10 flex w-full items-center justify-between">
              <div>
                <p className="text-sm font-black text-[#E9DFC7]">
                  {studentMeta?.displayName ?? 'Explorer'}
                </p>
                <p className="text-[11px] font-semibold text-[#E9DFC7]/65">
                  Lv.{studentMeta?.level ?? 1} · {studentMeta?.totalXp ?? 0} XP
                </p>
              </div>
              <span className="rounded-md border border-[#F5B900]/40 bg-[#071426]/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#F5B900]">
                Drag 360°
              </span>
            </div>

            {/* 3D Character */}
            <div className="relative z-10 w-full py-1">
              <StudentAvatar
                appearance={{ ...appearance, ...previewOverride?.appearance }}
                equippedItems={{ ...equippedItems, ...previewOverride?.equippedItems }}
                size="lobby"
                variant="stage"
                animation={previewAnim}
                reducedMotion={studentMeta?.reducedMotion}
                celebrateTrigger={celebrateTick}
              />
            </div>

            {/* Locked Preview Banner */}
            {previewOverride && (
              <div className="vq-unlock-reveal relative z-10 mb-2 flex w-full items-center justify-between gap-2 rounded-lg border border-[#F5B900]/60 bg-[#071426]/95 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-[#F5B900]">
                    Previewing Locked: {previewOverride.itemName}
                  </p>
                  <p className="truncate text-[11px] text-[#E9DFC7]/75">
                    Unlock: {previewOverride.requirement}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOverride(null)}
                  aria-label="Clear preview"
                  className="shrink-0 rounded p-1 text-[#E9DFC7]/70 hover:bg-[#13253D] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Animation Pose Switcher */}
            <div className="relative z-10 flex flex-wrap justify-center gap-1.5">
              {ANIMATION_MODES.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setPreviewAnim(mode.key)}
                  className={`rounded-md border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider transition ${
                    previewAnim === mode.key
                      ? 'border-[#FFD95A] bg-[#F5B900] text-[#071426]'
                      : 'border-[#233B59] bg-[#071426]/90 text-[#E9DFC7]/80 hover:border-[#F5B900]/50'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Currently Equipped Outfit Summary */}
            <div className="relative z-10 mt-3 grid w-full grid-cols-4 gap-1.5 border-t border-[#233B59]/80 pt-3">
              {[
                { label: 'Outfit', val: appearance.outfit },
                { label: 'Head', val: equippedItems.headwear },
                { label: 'Cape', val: equippedItems.cape },
                { label: 'Pack', val: equippedItems.backpack },
              ].map((slot) => (
                <div
                  key={slot.label}
                  className="rounded-lg border border-[#1E3350] bg-[#071426]/85 px-2 py-1.5 text-center"
                >
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#E9DFC7]/55">
                    {slot.label}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-[#E9DFC7]">
                    {formatSlotValue(slot.val)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT: Game Inventory Wardrobe */}
          <section className="vq-panel flex flex-col justify-between rounded-2xl p-4 sm:p-5 lg:col-span-7">
            {/* Saved Outfits Drawer (when toggled) */}
            {showSavedOutfits && (
              <div className="mb-4 rounded-xl border border-[#F5B900]/40 bg-[#071426] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wider text-[#F5B900]">
                    Saved Outfits ({savedOutfits.length}/15)
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSavedOutfits(false)}
                    className="text-xs font-bold text-[#E9DFC7]/65 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={newOutfitName}
                    onChange={(e) => setNewOutfitName(e.target.value)}
                    maxLength={50}
                    placeholder="Name this outfit..."
                    className="min-w-0 flex-1 rounded-lg border border-[#233B59] bg-[#0D1B2D] px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[#F5B900] focus:outline-none"
                  />
                  <GameButton
                    variant="gold"
                    size="sm"
                    disabled={savingOutfit}
                    onClick={() => void handleSaveAsOutfit()}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    Save Look
                  </GameButton>
                </div>
                {savedOutfits.length === 0 ? (
                  <p className="mt-2.5 text-xs text-[#E9DFC7]/60">
                    No saved outfits yet. Style your explorer and save favorite sets here!
                  </p>
                ) : (
                  <div className="vq-scroll mt-2.5 grid max-h-36 gap-2 overflow-y-auto sm:grid-cols-2">
                    {savedOutfits.map((outfit) => (
                      <div
                        key={outfit.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#233B59] bg-[#0D1B2D] px-3 py-2 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => void handleEquipSavedOutfit(outfit)}
                          className="min-w-0 flex-1 truncate text-left font-bold text-[#E9DFC7] hover:text-[#F5B900]"
                        >
                          {outfit.outfitName}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSavedOutfit(outfit.id)}
                          aria-label={`Delete ${outfit.outfitName}`}
                          className="text-[#E9DFC7]/45 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              {/* Level 1: 4 Clean Group Tabs + Subject Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233B59] pb-3">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Wardrobe Sections">
                  {CATEGORY_GROUPS.map((group) => {
                    const active = group.id === activeGroupId;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => handleSelectGroup(group)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition ${
                          active
                            ? 'bg-[#F5B900] text-[#071426]'
                            : 'bg-[#071426] text-[#E9DFC7]/75 hover:bg-[#13253D] hover:text-white'
                        }`}
                      >
                        {group.label}
                      </button>
                    );
                  })}
                </div>

                {/* Compact Subject Filter */}
                <label className="flex items-center gap-1.5 text-xs">
                  <Filter className="h-3.5 w-3.5 text-[#F5B900]" />
                  <span className="sr-only">Filter by subject</span>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="rounded-lg border border-[#233B59] bg-[#071426] px-2.5 py-1.5 text-xs font-bold text-[#E9DFC7] focus:border-[#F5B900] focus:outline-none"
                  >
                    {SUBJECT_FILTERS.map((sf) => (
                      <option key={sf.key} value={sf.key}>
                        {sf.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Level 2: Clean Sub-category Pills (only 4-5 per group) */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeGroup.categories.map((cat) => {
                  const active = cat.key === activeCategory;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-extrabold transition ${
                        active
                          ? 'border-[#F5B900]/70 bg-[#18304F] text-[#F5B900]'
                          : 'border-[#1E3350] bg-[#071426]/60 text-[#E9DFC7]/70 hover:border-[#2C4669] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Inventory Grid */}
              {categoryItems.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-[#233B59] bg-[#071426]/60 p-8 text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-[#F5B900]/70" />
                  <p className="mt-2 text-xs font-bold text-[#E9DFC7]/75">
                    No gear found for this filter. Try switching to All Realms.
                  </p>
                </div>
              ) : (
                <div className="vq-scroll mt-4 grid max-h-[360px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {categoryItems.map((item) => {
                    const isSelected = currentSelectionForCategory(item.category) === item.itemKey;
                    const rarity = resolveItemRarity(item.rarity, item.unlockType);
                    const rarityStyle = RARITY_STYLES[rarity];

                    return (
                      <button
                        key={item.itemKey}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className={`group flex items-start gap-3 rounded-xl border border-l-4 p-3 text-left transition ${
                          rarityStyle.accent
                        } ${
                          isSelected
                            ? 'border-[#F5B900] bg-[#162C47]'
                            : item.unlocked
                              ? 'border-[#233B59] bg-[#071426]/90 hover:border-[#F5B900]/60 hover:bg-[#102238]'
                              : 'border-[#1B2E47] bg-[#071426]/50 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <ItemThumbnail
                          category={item.category}
                          assetReference={item.assetReference}
                          rarity={rarity}
                          locked={!item.unlocked}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="truncate text-xs font-black text-[#E9DFC7]">
                              {item.name}
                            </span>
                            {isSelected ? (
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#228B5B] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                                <Check className="h-2.5 w-2.5" />
                                Equipped
                              </span>
                            ) : !item.unlocked ? (
                              <Lock className="h-3.5 w-3.5 shrink-0 text-[#E9DFC7]/45" />
                            ) : null}
                          </div>

                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#E9DFC7]/65">
                            {item.description}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
                            <span
                              className={`text-[10px] font-extrabold ${
                                item.unlocked ? 'text-emerald-300' : 'text-[#F5B900]'
                              }`}
                            >
                              {item.unlocked
                                ? 'Unlocked'
                                : `Unlock: ${item.unlockRequirement.label}`}
                            </span>

                            {rarity !== 'common' && (
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${rarityStyle.badge}`}
                              >
                                {rarityStyle.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-5 border-t border-[#233B59] pt-4">
              {message && (
                <p className="vq-unlock-reveal mb-2.5 text-right text-xs font-bold text-emerald-300">
                  {message}
                </p>
              )}
              {error && (
                <p className="mb-2.5 text-right text-xs font-bold text-rose-300">{error}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <GameButton variant="ghost" size="sm" onClick={handleRandomize}>
                    <Shuffle className="h-3.5 w-3.5 text-[#F5B900]" />
                    Randomize
                  </GameButton>
                  <GameButton variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-3.5 w-3.5 text-rose-300" />
                    Reset
                  </GameButton>
                </div>

                <GameButton
                  variant="gold"
                  size="md"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </GameButton>
              </div>
            </div>
          </section>
        </div>
      )}
    </StudentNavShell>
  );
}
