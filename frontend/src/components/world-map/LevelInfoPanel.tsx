'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Play, Sparkles, Star, Swords, Trophy, X } from 'lucide-react';
import { LevelNode, LevelStatus } from '@/types/worldMap';

interface LevelInfoPanelProps {
  level: LevelNode | null;
  status: LevelStatus | null;
  earnedStars?: 0 | 1 | 2 | 3;
  isSimulatingRun: boolean;
  onClose: () => void;
  onStartLevel: (level: LevelNode) => void;
  onSimulateComplete: (level: LevelNode, stars: 1 | 2 | 3) => void;
}

const DIFFICULTY_STYLES: Record<LevelNode['difficulty'], string> = {
  Beginner: 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200',
  Intermediate: 'border-sky-400/60 bg-sky-500/20 text-sky-200',
  Advanced: 'border-amber-400/60 bg-amber-500/20 text-amber-200',
  Master: 'border-purple-400/60 bg-purple-500/20 text-purple-200',
};

export function LevelInfoPanel({
  level,
  status,
  earnedStars = 0,
  isSimulatingRun,
  onClose,
  onStartLevel,
  onSimulateComplete,
}: LevelInfoPanelProps) {
  return (
    <AnimatePresence>
      {level && status && (
        <motion.aside
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          aria-label="Level details"
          className="fixed bottom-3 left-3 right-3 z-50 max-h-[82dvh] overflow-y-auto rounded-xl border-2 border-amber-300/80 bg-slate-950/95 p-4 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.75)] backdrop-blur-md sm:bottom-auto sm:left-auto sm:right-4 sm:top-16 sm:w-96"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <Swords className="h-3 w-3" />
                {level.regionName}
              </span>
              <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-white">
                Level {level.levelNumber}: {level.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close level panel"
              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-amber-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">{level.description}</p>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_STYLES[level.difficulty]}`}
            >
              {level.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />+{level.xpReward} XP
            </span>
            {status === 'completed' && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed ({earnedStars}/3 ★)
              </span>
            )}
          </div>

          {/* Learning Objectives */}
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/80 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Learning Objectives
            </h3>
            <ul className="mt-2 space-y-1.5">
              {level.objectives.map((obj) => (
                <li key={obj} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Primary Start Level CTA */}
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              disabled={isSimulatingRun}
              onClick={() => onStartLevel(level)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-emerald-200 bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-950 shadow-[0_4px_0_#064e3b] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_2px_0_#064e3b] disabled:opacity-60"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              {isSimulatingRun
                ? 'Running Quest Simulation...'
                : status === 'completed'
                  ? 'Replay Level'
                  : 'Start Level'}
            </button>

            {/* Simulator test helper: quick star completion */}
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-400" />
                  Simulator Quick-Complete
                </span>
                <span>Test Progression</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {([1, 2, 3] as const).map((starCount) => (
                  <button
                    key={starCount}
                    type="button"
                    onClick={() => onSimulateComplete(level, starCount)}
                    className="flex items-center justify-center gap-1 rounded border border-amber-400/40 bg-slate-800 px-2 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
                  >
                    {starCount}
                    <Star className="h-3 w-3 fill-amber-400 text-amber-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
