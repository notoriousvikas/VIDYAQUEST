'use client';

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Star, Sparkles } from 'lucide-react';
import { LevelNode, LevelStatus } from '@/types/worldMap';

interface LevelMarkerProps {
  level: LevelNode;
  status: LevelStatus;
  stars?: 0 | 1 | 2 | 3;
  isSelected: boolean;
  onSelect: (level: LevelNode, status: LevelStatus) => void;
}

export const LevelMarker = memo(function LevelMarker({
  level,
  status,
  stars = 0,
  isSelected,
  onSelect,
}: LevelMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current' || status === 'in_progress';
  const badgeLabel = status === 'in_progress' ? 'Active' : 'Quest';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
      style={{
        left: `${level.xPercent}%`,
        top: `${level.yPercent}%`,
        zIndex: isHovered || isSelected ? 40 : isCurrent ? 30 : 20,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Current level floating indicator */}
      {isCurrent && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-amber-200 bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-950 shadow-[0_2px_0_#78350f]"
        >
          {badgeLabel}
        </motion.div>
      )}

      {/* Pulsing aura for current or completed */}
      {isCurrent && (
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.55, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 rounded-full bg-emerald-400/50"
        />
      )}

      {isCompleted && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full bg-amber-400/35 blur-[3px]"
        />
      )}

      <motion.button
        type="button"
        aria-label={`Level ${level.levelNumber}: ${level.title} (${status})`}
        whileHover={isLocked ? { scale: 1.05 } : { scale: 1.15, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={() => onSelect(level, status)}
        className={[
          'relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-extrabold transition-shadow focus:outline-none sm:h-11 sm:w-11',
          isCompleted
            ? 'border-amber-200 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-amber-950 shadow-[0_0_16px_rgba(251,191,36,0.85),0_3px_0_#78350f]'
            : isCurrent
              ? 'border-emerald-200 bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.9),0_3px_0_#064e3b]'
              : !isLocked
                ? 'border-sky-200 bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.6),0_3px_0_#1e3a8a]'
                : 'cursor-not-allowed border-slate-500/80 bg-slate-800/90 text-slate-400 shadow-[0_3px_0_#0f172a] brightness-75',
          isSelected ? 'ring-4 ring-white/80' : '',
        ].join(' ')}
      >
        {isLocked ? (
          <Lock className="h-4 w-4 text-slate-400" strokeWidth={2.5} />
        ) : (
          <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">{level.levelNumber}</span>
        )}

        {isCurrent && (
          <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-200 drop-shadow" />
        )}
      </motion.button>

      {/* Earned stars indicator */}
      {isCompleted && stars > 0 && (
        <div className="pointer-events-none mt-0.5 flex items-center justify-center gap-0.5 rounded-full bg-slate-950/80 px-1.5 py-0.5 shadow">
          {[1, 2, 3].map((idx) => (
            <Star
              key={idx}
              className={`h-2.5 w-2.5 ${
                idx <= stars ? 'fill-amber-400 text-amber-300' : 'fill-slate-700 text-slate-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Hover Tooltip */}
      {isHovered && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-52 -translate-x-1/2 rounded-md border-2 border-amber-300/80 bg-slate-950/95 p-2.5 text-left text-xs text-slate-100 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-amber-300">
              Lv.{level.levelNumber} {level.title}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
            {level.regionName}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-300">
            {isLocked
              ? 'Complete previous connected levels to unlock this quest.'
              : level.description}
          </p>
          <div className="mt-1.5 flex items-center justify-between border-t border-slate-800 pt-1 text-[10px] text-slate-400">
            <span>{level.difficulty}</span>
            <span className="font-bold text-amber-300">+{level.xpReward} XP</span>
          </div>
        </div>
      )}
    </div>
  );
});
