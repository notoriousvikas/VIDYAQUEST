'use client';

import React from 'react';

export type MapBorderVariant =
  | 'classic-gold'
  | 'parchment-compass'
  | 'arcane-emerald'
  | 'minimal-slate';

export interface MapBorderStylePreset {
  outerBorder: string;
  innerBorder: string;
  cornerStroke: string;
  cornerFill: string;
  glow: string;
  labelBg: string;
  labelText: string;
}

export const MAP_BORDER_PRESETS: Record<MapBorderVariant, MapBorderStylePreset> = {
  'classic-gold': {
    outerBorder: '#fbbf24',
    innerBorder: 'rgba(253, 224, 71, 0.45)',
    cornerStroke: '#fde68a',
    cornerFill: '#b45309',
    glow: '0 0 0 4px rgba(15, 23, 42, 0.85), 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 36px rgba(251, 191, 36, 0.22)',
    labelBg: 'rgba(15, 23, 42, 0.88)',
    labelText: '#fde68a',
  },
  'parchment-compass': {
    outerBorder: '#d97706',
    innerBorder: 'rgba(245, 158, 11, 0.45)',
    cornerStroke: '#fcd34d',
    cornerFill: '#78350f',
    glow: '0 0 0 4px rgba(28, 25, 23, 0.85), 0 24px 60px rgba(0, 0, 0, 0.65)',
    labelBg: 'rgba(28, 25, 23, 0.9)',
    labelText: '#fcd34d',
  },
  'arcane-emerald': {
    outerBorder: '#34d399',
    innerBorder: 'rgba(110, 231, 183, 0.45)',
    cornerStroke: '#a7f3d0',
    cornerFill: '#065f46',
    glow: '0 0 0 4px rgba(2, 44, 34, 0.85), 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 36px rgba(52, 211, 153, 0.2)',
    labelBg: 'rgba(2, 44, 34, 0.88)',
    labelText: '#a7f3d0',
  },
  'minimal-slate': {
    outerBorder: '#94a3b8',
    innerBorder: 'rgba(148, 163, 184, 0.35)',
    cornerStroke: '#cbd5e1',
    cornerFill: '#334155',
    glow: '0 0 0 3px rgba(15, 23, 42, 0.8), 0 20px 50px rgba(0, 0, 0, 0.6)',
    labelBg: 'rgba(15, 23, 42, 0.88)',
    labelText: '#e2e8f0',
  },
};

interface CornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  stroke: string;
  fill: string;
}

function CornerOrnament({ position, stroke, fill }: CornerOrnamentProps) {
  const rotation =
    position === 'top-left'
      ? '0deg'
      : position === 'top-right'
        ? '90deg'
        : position === 'bottom-right'
          ? '180deg'
          : '270deg';

  const posClass =
    position === 'top-left'
      ? '-left-2 -top-2'
      : position === 'top-right'
        ? '-right-2 -top-2'
        : position === 'bottom-right'
          ? '-bottom-2 -right-2'
          : '-bottom-2 -left-2';

  return (
    <svg
      aria-hidden
      viewBox="0 0 44 44"
      className={`pointer-events-none absolute z-30 h-11 w-11 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] ${posClass}`}
      style={{ transform: `rotate(${rotation})` }}
    >
      <path
        d="M4 38 L4 8 Q4 4 8 4 L38 4"
        fill="none"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M10 28 L10 12 Q10 10 12 10 L28 10"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />
      <polygon
        points="4,4 16,4 4,16"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <circle cx="11" cy="11" r="2.2" fill={stroke} />
    </svg>
  );
}

export interface MapBorderFrameProps {
  variant?: MapBorderVariant;
  mapTitle?: string;
  showCompassDirections?: boolean;
}

/**
 * Reusable cartography / RPG border template that frames a world map canvas
 * with beveled borders, ornate corner brackets, and optional N/E/S/W markers.
 */
export function MapBorderFrame({
  variant = 'classic-gold',
  mapTitle,
  showCompassDirections = true,
}: MapBorderFrameProps) {
  const preset = MAP_BORDER_PRESETS[variant];

  return (
    <>
      {/* Outer beveled frame + shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-xl"
        style={{
          border: `3px solid ${preset.outerBorder}`,
          boxShadow: preset.glow,
        }}
      />

      {/* Inner hairline cartography border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-2 z-20 rounded-lg"
        style={{
          border: `1.5px dashed ${preset.innerBorder}`,
        }}
      />

      {/* 4 Ornate Corner Brackets */}
      <CornerOrnament position="top-left" stroke={preset.cornerStroke} fill={preset.cornerFill} />
      <CornerOrnament position="top-right" stroke={preset.cornerStroke} fill={preset.cornerFill} />
      <CornerOrnament position="bottom-left" stroke={preset.cornerStroke} fill={preset.cornerFill} />
      <CornerOrnament position="bottom-right" stroke={preset.cornerStroke} fill={preset.cornerFill} />

      {/* Optional Cardinal Compass Labels */}
      {showCompassDirections && (
        <>
          <span
            aria-hidden
            style={{
              backgroundColor: preset.labelBg,
              color: preset.labelText,
              borderColor: preset.outerBorder,
            }}
            className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest shadow"
          >
            N
          </span>
          <span
            aria-hidden
            style={{
              backgroundColor: preset.labelBg,
              color: preset.labelText,
              borderColor: preset.outerBorder,
            }}
            className="pointer-events-none absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest shadow"
          >
            S
          </span>
          <span
            aria-hidden
            style={{
              backgroundColor: preset.labelBg,
              color: preset.labelText,
              borderColor: preset.outerBorder,
            }}
            className="pointer-events-none absolute left-0 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest shadow"
          >
            W
          </span>
          <span
            aria-hidden
            style={{
              backgroundColor: preset.labelBg,
              color: preset.labelText,
              borderColor: preset.outerBorder,
            }}
            className="pointer-events-none absolute right-0 top-1/2 z-30 -translate-y-1/2 translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest shadow"
          >
            E
          </span>
        </>
      )}

      {/* Optional Bottom Cartouche Title */}
      {mapTitle && (
        <div
          aria-hidden
          style={{
            backgroundColor: preset.labelBg,
            color: preset.labelText,
            borderColor: preset.outerBorder,
          }}
          className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-md border px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-lg"
        >
          {mapTitle}
        </div>
      )}
    </>
  );
}
