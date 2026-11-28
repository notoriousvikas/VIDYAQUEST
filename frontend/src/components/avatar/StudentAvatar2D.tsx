'use client';

import React from 'react';
import { AvatarAppearance, AvatarEquippedItems } from '@/types/student';

export const DEFAULT_AVATAR_APPEARANCE: AvatarAppearance = {
  skinTone: 'skin-warm',
  hairstyle: 'hair-explorer',
  hairColor: 'haircolor-espresso',
  face: 'face-smile',
  eyes: 'eyes-bright',
  outfit: 'outfit-tunic-emerald',
  jacket: 'jacket-none',
  bottoms: 'bottoms-explorer-pants',
  shoes: 'shoes-boots-brown',
  costume: 'costume-none',
};

export const DEFAULT_EQUIPPED_ITEMS: AvatarEquippedItems = {
  headwear: 'headwear-none',
  glasses: 'glasses-none',
  backpack: 'backpack-canvas',
  cape: 'cape-none',
  aura: 'aura-none',
  neckwear: 'neckwear-none',
  wristwear: 'wristwear-none',
  badge: 'badge-none',
  accessory: 'accessory-none',
};

const SKIN_HEX: Record<string, string> = {
  'skin-fair': '#fde2c8',
  'skin-warm': '#f3c69f',
  'skin-tan': '#d99b66',
  'skin-deep': '#9b6441',
};

const HAIR_HEX: Record<string, string> = {
  'haircolor-espresso': '#2c1b18',
  'haircolor-amber': '#b45309',
  'haircolor-midnight': '#0f172a',
  'haircolor-cobalt': '#2563eb',
};

const OUTFIT_COLORS: Record<string, { main: string; trim: string }> = {
  'outfit-tunic-emerald': { main: '#10b981', trim: '#065f46' },
  'outfit-blazer-scholar': { main: '#3b82f6', trim: '#1e3a8a' },
  'outfit-hoodie-cyber': { main: '#ec4899', trim: '#831843' },
  'outfit-robe-alchemy': { main: '#8b5cf6', trim: '#4c1d95' },
  'outfit-jacket-atom': { main: '#0ea5e9', trim: '#0c4a6e' },
  'outfit-armor-royal': { main: '#f59e0b', trim: '#78350f' },
};

const BOTTOMS_HEX: Record<string, string> = {
  'bottoms-explorer-pants': '#1e293b',
  'bottoms-cargo-shorts': '#78716c',
  'bottoms-denim-jeans': '#1d4ed8',
  'bottoms-cyber-greaves': '#0f172a',
  'bottoms-royal-legguards': '#92400e',
};

const SHOES_HEX: Record<string, string> = {
  'shoes-boots-brown': '#78350f',
  'shoes-sneakers-sky': '#0284c7',
  'shoes-greaves-gold': '#d97706',
  'shoes-hightops-crimson': '#dc2626',
};

export interface StudentAvatar2DProps {
  appearance?: Partial<AvatarAppearance>;
  equippedItems?: Partial<AvatarEquippedItems>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<StudentAvatar2DProps['size']>, string> = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-32 w-32',
  xl: 'h-56 w-56',
};

/**
 * Modular 2D layered SVG game avatar.
 * Renders backpack -> body/outfit/shoes -> head -> eyes/face -> hair -> glasses -> headwear -> badge/accessory.
 */
export function StudentAvatar2D({
  appearance,
  equippedItems,
  size = 'lg',
  className = '',
}: StudentAvatar2DProps) {
  const app = { ...DEFAULT_AVATAR_APPEARANCE, ...appearance };
  const eq = { ...DEFAULT_EQUIPPED_ITEMS, ...equippedItems };

  const skin = SKIN_HEX[app.skinTone] ?? SKIN_HEX['skin-warm'];
  const hair = HAIR_HEX[app.hairColor] ?? HAIR_HEX['haircolor-espresso'];
  const outfit = OUTFIT_COLORS[app.outfit] ?? OUTFIT_COLORS['outfit-tunic-emerald'];
  const bottoms = BOTTOMS_HEX[app.bottoms ?? 'bottoms-explorer-pants'] ?? BOTTOMS_HEX['bottoms-explorer-pants'];
  const shoes = SHOES_HEX[app.shoes] ?? SHOES_HEX['shoes-boots-brown'];

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-300/70 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-xl ${SIZE_CLASSES[size]} ${className}`}
    >
      {/* Subtle game-card backdrop aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.16),transparent_68%)]"
      />

      <svg viewBox="0 0 180 200" className="relative h-full w-full" aria-label="Student Avatar">
        {/* 1. Backpack Layer (behind torso) */}
        {eq.backpack === 'backpack-canvas' && (
          <g>
            <rect x="44" y="108" width="92" height="48" rx="14" fill="#92400e" stroke="#451a03" strokeWidth="3" />
            <rect x="52" y="116" width="76" height="14" rx="6" fill="#b45309" />
          </g>
        )}
        {eq.backpack === 'backpack-jetpack' && (
          <g>
            <rect x="40" y="102" width="22" height="52" rx="8" fill="#38bdf8" stroke="#0c4a6e" strokeWidth="3" />
            <rect x="118" y="102" width="22" height="52" rx="8" fill="#38bdf8" stroke="#0c4a6e" strokeWidth="3" />
            <polygon points="44,154 58,154 51,170" fill="#fbbf24" />
            <polygon points="122,154 136,154 129,170" fill="#fbbf24" />
          </g>
        )}

        {/* 2. Legs & Shoes Layer */}
        <rect x="68" y="150" width="16" height="26" rx="6" fill={bottoms} />
        <rect x="96" y="150" width="16" height="26" rx="6" fill={bottoms} />
        <rect x="62" y="170" width="24" height="14" rx="7" fill={shoes} stroke="#0f172a" strokeWidth="2.5" />
        <rect x="94" y="170" width="24" height="14" rx="7" fill={shoes} stroke="#0f172a" strokeWidth="2.5" />

        {/* 3. Arms & Hands (Skin Tone) */}
        <rect x="44" y="110" width="18" height="36" rx="9" fill={outfit.main} stroke={outfit.trim} strokeWidth="2.5" />
        <rect x="118" y="110" width="18" height="36" rx="9" fill={outfit.main} stroke={outfit.trim} strokeWidth="2.5" />
        <circle cx="53" cy="148" r="8" fill={skin} stroke="#0f172a" strokeWidth="2" />
        <circle cx="127" cy="148" r="8" fill={skin} stroke="#0f172a" strokeWidth="2" />

        {/* 4. Torso / Outfit Layer */}
        <path
          d="M58 108 Q90 98 122 108 L126 154 Q90 160 54 154 Z"
          fill={outfit.main}
          stroke={outfit.trim}
          strokeWidth="3"
        />
        {/* Outfit collar & belt */}
        <path d="M74 106 L90 120 L106 106" fill="none" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
        <rect x="56" y="140" width="68" height="8" rx="3" fill={outfit.trim} />
        <rect x="84" y="138" width="12" height="12" rx="3" fill="#fbbf24" />

        {/* 5. Neck & Head (Skin Tone) */}
        <rect x="81" y="92" width="18" height="16" rx="6" fill={skin} />
        <circle cx="56" cy="70" r="8" fill={skin} stroke="#0f172a" strokeWidth="2" />
        <circle cx="124" cy="70" r="8" fill={skin} stroke="#0f172a" strokeWidth="2" />
        <rect x="58" y="34" width="64" height="64" rx="30" fill={skin} stroke="#0f172a" strokeWidth="2.5" />

        {/* 6. Eyes Layer */}
        {app.eyes === 'eyes-sparkle' ? (
          <g>
            <circle cx="76" cy="66" r="5.5" fill="#0f172a" />
            <circle cx="104" cy="66" r="5.5" fill="#0f172a" />
            <circle cx="74" cy="64" r="2" fill="#ffffff" />
            <circle cx="102" cy="64" r="2" fill="#ffffff" />
            <circle cx="78" cy="68" r="1.1" fill="#fde047" />
            <circle cx="106" cy="68" r="1.1" fill="#fde047" />
          </g>
        ) : app.eyes === 'eyes-visor' ? (
          <g>
            <rect x="69" y="62" width="14" height="7" rx="3.5" fill="#0f172a" />
            <rect x="97" y="62" width="14" height="7" rx="3.5" fill="#0f172a" />
            <circle cx="74" cy="65" r="2" fill="#38bdf8" />
            <circle cx="102" cy="65" r="2" fill="#38bdf8" />
          </g>
        ) : (
          <g>
            <circle cx="76" cy="66" r="5" fill="#0f172a" />
            <circle cx="104" cy="66" r="5" fill="#0f172a" />
            <circle cx="74" cy="64" r="1.8" fill="#ffffff" />
            <circle cx="102" cy="64" r="1.8" fill="#ffffff" />
          </g>
        )}

        {/* 7. Face / Expression Layer */}
        <circle cx="67" cy="75" r="4.5" fill="#fb7185" fillOpacity="0.35" />
        <circle cx="113" cy="75" r="4.5" fill="#fb7185" fillOpacity="0.35" />
        {app.face === 'face-focused' ? (
          <path d="M80 82 Q90 81 100 80" fill="none" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
        ) : app.face === 'face-excited' ? (
          <path d="M78 78 Q90 92 102 78 Z" fill="#9f1239" stroke="#451a03" strokeWidth="2" />
        ) : (
          <path d="M78 79 Q90 89 102 79" fill="none" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* 8. Hair Layer */}
        {app.hairstyle === 'hair-waves' && (
          <path
            d="M54 66 Q52 28 90 26 Q128 28 126 66 Q120 46 90 46 Q60 46 54 66 Z"
            fill={hair}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}
        {app.hairstyle === 'hair-ponytail' && (
          <g>
            <ellipse cx="122" cy="48" rx="12" ry="18" fill={hair} stroke="#0f172a" strokeWidth="2" />
            <path
              d="M56 60 Q58 26 90 26 Q122 26 124 60 Q112 42 90 42 Q68 42 56 60 Z"
              fill={hair}
              stroke="#0f172a"
              strokeWidth="2"
            />
          </g>
        )}
        {app.hairstyle === 'hair-spiky' && (
          <path
            d="M56 58 L62 28 L76 40 L90 20 L104 40 L118 28 L124 58 Q108 42 90 44 Q72 42 56 58 Z"
            fill={hair}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}
        {app.hairstyle === 'hair-explorer' && (
          <path
            d="M56 58 Q58 26 90 26 Q122 26 124 58 Q112 42 90 44 Q68 42 56 58 Z"
            fill={hair}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}

        {/* 9. Glasses Layer */}
        {eq.glasses === 'glasses-round' && (
          <g fill="none" stroke="#fde047" strokeWidth="2.5">
            <circle cx="76" cy="66" r="9.5" fill="#ffffff" fillOpacity="0.12" />
            <circle cx="104" cy="66" r="9.5" fill="#ffffff" fillOpacity="0.12" />
            <line x1="85.5" y1="66" x2="94.5" y2="66" />
          </g>
        )}
        {eq.glasses === 'glasses-goggles' && (
          <g>
            <rect x="63" y="56" width="23" height="18" rx="6" fill="#38bdf8" fillOpacity="0.28" stroke="#f59e0b" strokeWidth="3" />
            <rect x="94" y="56" width="23" height="18" rx="6" fill="#38bdf8" fillOpacity="0.28" stroke="#f59e0b" strokeWidth="3" />
            <line x1="86" y1="65" x2="94" y2="65" stroke="#f59e0b" strokeWidth="3" />
          </g>
        )}

        {/* 10. Headwear Layer */}
        {eq.headwear === 'headwear-cap' && (
          <g>
            <path d="M54 44 Q90 18 126 44 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2.5" />
            <rect x="52" y="40" width="84" height="8" rx="4" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
          </g>
        )}
        {eq.headwear === 'headwear-wizard' && (
          <g>
            <polygon points="90,6 60,42 120,42" fill="#6d28d9" stroke="#2e1065" strokeWidth="2.5" />
            <ellipse cx="90" cy="42" rx="40" ry="7" fill="#7c3aed" stroke="#2e1065" strokeWidth="2.5" />
            <rect x="70" y="34" width="40" height="5" rx="2" fill="#fbbf24" />
          </g>
        )}
        {eq.headwear === 'headwear-crown' && (
          <polygon
            points="64,38 68,18 80,30 90,14 100,30 112,18 116,38"
            fill="#fbbf24"
            stroke="#92400e"
            strokeWidth="2.5"
          />
        )}

        {/* 11. Chest Badge Layer */}
        {eq.badge !== 'badge-none' && (
          <circle
            cx="104"
            cy="126"
            r="7"
            fill={eq.badge === 'badge-curious' ? '#a855f7' : eq.badge === 'badge-first-steps' ? '#fbbf24' : '#38bdf8'}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}

        {/* 12. Handheld / Floating Accessory Layer */}
        {eq.accessory === 'accessory-compass' && (
          <g transform="translate(132, 134)">
            <circle cx="12" cy="12" r="11" fill="#fbbf24" stroke="#78350f" strokeWidth="2.5" />
            <polygon points="12,4 15,12 12,20 9,12" fill="#ef4444" />
          </g>
        )}
        {eq.accessory === 'accessory-flask' && (
          <g transform="translate(132, 130)">
            <path d="M8 2 H16 V8 L22 20 Q23 23 19 23 H5 Q1 23 2 20 L8 8 Z" fill="#a855f7" stroke="#f3e8ff" strokeWidth="2" />
            <circle cx="10" cy="17" r="2" fill="#fde047" />
          </g>
        )}
        {eq.accessory === 'accessory-atom' && (
          <g transform="translate(130, 128)">
            <ellipse cx="14" cy="14" rx="13" ry="5" fill="none" stroke="#38bdf8" strokeWidth="2" transform="rotate(30 14 14)" />
            <ellipse cx="14" cy="14" rx="13" ry="5" fill="none" stroke="#38bdf8" strokeWidth="2" transform="rotate(-30 14 14)" />
            <circle cx="14" cy="14" r="3.5" fill="#fde047" />
          </g>
        )}
      </svg>
    </div>
  );
}
