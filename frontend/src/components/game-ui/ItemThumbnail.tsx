'use client';

import React from 'react';
import {
  Award,
  Backpack,
  Crown,
  Eye,
  Footprints,
  Glasses,
  Palette,
  Shirt,
  Shield,
  Smile,
  Sparkles,
  User,
  Wand2,
  Watch,
} from 'lucide-react';
import { AvatarItemCategory, AvatarItemRarity } from '@/types/student';

export const RARITY_STYLES: Record<
  AvatarItemRarity,
  { label: string; badge: string; accent: string }
> = {
  common: {
    label: 'Common',
    badge: 'bg-slate-800 text-slate-300 border-slate-600/60',
    accent: 'border-l-slate-400',
  },
  rare: {
    label: 'Rare',
    badge: 'bg-sky-950/90 text-sky-300 border-sky-400/50',
    accent: 'border-l-sky-400',
  },
  epic: {
    label: 'Epic',
    badge: 'bg-violet-950/90 text-violet-300 border-violet-400/50',
    accent: 'border-l-violet-400',
  },
  legendary: {
    label: 'Legendary',
    badge: 'bg-[#3D2B00] text-[#F5B900] border-[#F5B900]/60',
    accent: 'border-l-[#F5B900]',
  },
};

export function resolveItemRarity(
  rarity?: AvatarItemRarity,
  unlockType?: string,
): AvatarItemRarity {
  if (rarity) return rarity;
  if (unlockType === 'milestone' || unlockType === 'achievement') return 'epic';
  if (unlockType === 'level' || unlockType === 'quest_level') return 'rare';
  return 'common';
}

interface ItemThumbnailProps {
  category: AvatarItemCategory;
  assetReference?: string;
  rarity?: AvatarItemRarity;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
}

const CATEGORY_COLORS: Partial<Record<AvatarItemCategory, string>> = {
  outfit: 'text-emerald-300 bg-emerald-950/70',
  jacket: 'text-sky-300 bg-sky-950/70',
  bottoms: 'text-indigo-300 bg-indigo-950/70',
  shoes: 'text-amber-300 bg-amber-950/70',
  costume: 'text-violet-300 bg-violet-950/70',
  headwear: 'text-[#F5B900] bg-[#2D2100]',
  cape: 'text-rose-300 bg-rose-950/70',
  aura: 'text-amber-200 bg-amber-950/60',
  backpack: 'text-teal-300 bg-teal-950/70',
  glasses: 'text-cyan-300 bg-cyan-950/70',
  neckwear: 'text-orange-300 bg-orange-950/70',
  wristwear: 'text-sky-200 bg-slate-800',
  badge: 'text-[#F5B900] bg-[#2D2100]',
  accessory: 'text-amber-300 bg-slate-800',
};

export function ItemThumbnail({
  category,
  assetReference = '',
  rarity = 'common',
  size = 'md',
  locked = false,
}: ItemThumbnailProps) {
  const isSwatch = assetReference.startsWith('#');
  const boxSize =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  if (isSwatch) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border-2 ${
          locked ? 'border-slate-600 opacity-60' : 'border-[#E9DFC7]/60'
        } ${boxSize}`}
        style={{ backgroundColor: assetReference }}
      />
    );
  }

  const colorTone =
    CATEGORY_COLORS[category] ?? 'text-[#E9DFC7] bg-[#132640]';
  const rarityRing =
    rarity === 'legendary'
      ? 'border-[#F5B900]/70'
      : rarity === 'epic'
        ? 'border-violet-400/50'
        : rarity === 'rare'
          ? 'border-sky-400/50'
          : 'border-[#2C4669]';

  const renderIcon = () => {
    switch (category) {
      case 'headwear':
        return <Crown className={iconSize} />;
      case 'outfit':
      case 'jacket':
      case 'costume':
        return <Shirt className={iconSize} />;
      case 'backpack':
        return <Backpack className={iconSize} />;
      case 'glasses':
        return <Glasses className={iconSize} />;
      case 'shoes':
        return <Footprints className={iconSize} />;
      case 'wristwear':
        return <Watch className={iconSize} />;
      case 'badge':
        return <Award className={iconSize} />;
      case 'cape':
        return <Shield className={iconSize} />;
      case 'aura':
        return <Sparkles className={iconSize} />;
      case 'accessory':
        return <Wand2 className={iconSize} />;
      case 'eyes':
        return <Eye className={iconSize} />;
      case 'face':
        return <Smile className={iconSize} />;
      case 'hairstyle':
      case 'hairColor':
      case 'skinTone':
        return <User className={iconSize} />;
      default:
        return <Palette className={iconSize} />;
    }
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border ${rarityRing} ${colorTone} ${
        locked ? 'opacity-60 grayscale-[35%]' : ''
      } ${boxSize}`}
    >
      {renderIcon()}
    </span>
  );
}
