'use client';

import React from 'react';

interface XpProgressBarProps {
  currentXp: number;
  xpPerLevel: number;
  progressPercentage: number;
  level: number;
  totalXp?: number;
  compact?: boolean;
}

export function XpProgressBar({
  currentXp,
  xpPerLevel,
  progressPercentage,
  level,
  totalXp,
  compact = false,
}: XpProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progressPercentage));

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-[#F5B900] px-2 py-0.5 text-[11px] font-black tracking-wide text-[#071426]">
            LV {level}
          </span>
          {totalXp !== undefined && (
            <span className="font-extrabold text-[#F5B900]">
              {totalXp.toLocaleString()} XP
            </span>
          )}
        </div>
        <span className="font-semibold text-[#E9DFC7]/75">
          {currentXp} / {xpPerLevel} to Lv.{level + 1}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${level} experience progress`}
        className={`relative w-full overflow-hidden rounded-md border border-[#2C4669] bg-[#071426] ${
          compact ? 'h-2.5' : 'h-3.5'
        }`}
      >
        <div
          className="h-full bg-[#F5B900] transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
        {/* Subtle segmented RPG tick marks */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid grid-cols-5"
        >
          <span className="border-r border-[#071426]/45" />
          <span className="border-r border-[#071426]/45" />
          <span className="border-r border-[#071426]/45" />
          <span className="border-r border-[#071426]/45" />
          <span />
        </div>
      </div>
    </div>
  );
}
