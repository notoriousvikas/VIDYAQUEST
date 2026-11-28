'use client';

import React from 'react';
import { WORLD_REGIONS } from '@/data/worldMapData';
import { RegionInfo } from '@/types/worldMap';

interface MapMinimapProps {
  mapImageUrl: string;
  regions?: RegionInfo[];
  viewportRect: {
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  };
  onJumpToPercent: (xPercent: number, yPercent: number) => void;
}

export function MapMinimap({
  mapImageUrl,
  regions = WORLD_REGIONS,
  viewportRect,
  onJumpToPercent,
}: MapMinimapProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    onJumpToPercent(
      Math.max(0, Math.min(100, xPercent)),
      Math.max(0, Math.min(100, yPercent)),
    );
  };

  return (
    <div
      className="hidden overflow-hidden rounded-lg border-2 border-amber-300/70 bg-slate-950/90 shadow-2xl backdrop-blur-sm sm:block"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
        <span>World Minimap</span>
        <span className="text-slate-400">Click to Pan</span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="World minimap navigation"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onJumpToPercent(50, 50);
        }}
        className="relative h-28 w-48 cursor-crosshair overflow-hidden"
      >
        <img
          src={mapImageUrl}
          alt="VidyaQuest island minimap"
          className="h-full w-full object-cover opacity-85"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />

        {/* Region dots */}
        {regions.map((region) => (
          <span
            key={region.id}
            title={region.name}
            style={{
              left: `${region.xPercent}%`,
              top: `${region.yPercent}%`,
              backgroundColor: region.accentColor,
            }}
            className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-950 shadow"
          />
        ))}

        {/* Current camera viewport box */}
        <div
          style={{
            left: `${Math.max(0, Math.min(100, viewportRect.xPercent))}%`,
            top: `${Math.max(0, Math.min(100, viewportRect.yPercent))}%`,
            width: `${Math.min(100, viewportRect.widthPercent)}%`,
            height: `${Math.min(100, viewportRect.heightPercent)}%`,
          }}
          className="pointer-events-none absolute border-2 border-white/90 bg-white/10 shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
        />
      </div>
    </div>
  );
}
