'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Crown,
  FastForward,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { StudentAvatar } from '@/components/avatar/StudentAvatar';
import {
  AvatarAppearance,
  AvatarEquippedItems,
  ConquerorEventPayload,
  UnlockedClothingReward,
} from '@/types/student';

export interface LevelVictoryPayload {
  levelNumber: number;
  levelTitle: string;
  subjectName?: string;
  starsEarned: 1 | 2 | 3;
  xpEarned: number;
  alreadyCompleted: boolean;
  unlockedClothingRewards?: UnlockedClothingReward[];
  nextLevel: { levelNumber: number; title: string } | null;
}

interface RpgCelebrationOverlayProps {
  studentName?: string;
  avatarAppearance?: Partial<AvatarAppearance>;
  avatarEquipped?: Partial<AvatarEquippedItems>;
  levelVictory: LevelVictoryPayload | null;
  conquerorEvent: ConquerorEventPayload | null;
  onDismissLevelVictory: () => void;
  onDismissConqueror: () => void;
  onContinueNextLevel?: () => void;
  onEquipUnlockedRewards?: (rewards: UnlockedClothingReward[]) => Promise<void>;
}

function playVictoryFanfare(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.46);
    });
  } catch {
    // Ignore Web Audio restrictions
  }
}

const CONFETTI_COLORS = ['#fbbf24', '#38bdf8', '#34d399', '#f472b6', '#a855f7'];

export function RpgCelebrationOverlay({
  studentName = 'Explorer',
  avatarAppearance,
  avatarEquipped,
  levelVictory,
  conquerorEvent,
  onDismissLevelVictory,
  onDismissConqueror,
  onContinueNextLevel,
  onEquipUnlockedRewards,
}: RpgCelebrationOverlayProps) {
  const [muted, setMuted] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [equippedNow, setEquippedNow] = useState(false);
  const fanfarePlayedFor = useRef<string | null>(null);

  useEffect(() => {
    setEquippedNow(false);
  }, [levelVictory]);

  useEffect(() => {
    if (!conquerorEvent?.triggered) return;
    const key = `${conquerorEvent.subjectSlug}:${conquerorEvent.conquerorTitle}`;
    if (!muted && fanfarePlayedFor.current !== key) {
      fanfarePlayedFor.current = key;
      playVictoryFanfare();
    }
  }, [conquerorEvent, muted]);

  const showConqueror = Boolean(conquerorEvent?.triggered);
  const showLevel = !showConqueror && Boolean(levelVictory);

  return (
    <AnimatePresence>
      {(showConqueror || showLevel) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md ${
            showConqueror
              ? 'bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.34),rgba(15,23,42,0.96)_70%)]'
              : 'bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.22),rgba(7,13,23,0.94)_70%)]'
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Animated Confetti / Fireworks Particles */}
          <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            {Array.from({ length: 18 }).map((_, idx) => (
              <motion.span
                key={idx}
                initial={{
                  y: -30,
                  x: `${(idx * 17) % 100}vw`,
                  opacity: 1,
                  scale: 0.7,
                }}
                animate={{
                  y: '105vh',
                  rotate: 360 * (idx % 2 === 0 ? 1 : -1),
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2.8 + (idx % 4) * 0.5,
                  repeat: Infinity,
                  delay: (idx % 5) * 0.25,
                  ease: 'linear',
                }}
                className="absolute top-0 h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: CONFETTI_COLORS[idx % CONFETTI_COLORS.length] }}
              />
            ))}
          </div>

          {showConqueror && conquerorEvent ? (
            /* SUBJECT MAP CONQUEROR CELEBRATION */
            <motion.div
              initial={{ scale: 0.88, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-slate-950/95 via-[#1c1406]/95 to-slate-950/95 p-6 text-center shadow-[0_0_80px_rgba(251,191,36,0.35)] sm:p-8"
            >
              {/* Top Controls: Mute & Skip */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-slate-900/80 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-slate-800"
                >
                  {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {muted ? 'Unmute' : 'Sound On'}
                </button>
                <button
                  type="button"
                  onClick={onDismissConqueror}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-bold text-slate-300 hover:text-white"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  Skip
                </button>
              </div>

              {/* Cinematic Crown Drop */}
              <motion.div
                initial={{ y: -40, scale: 0.4, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.15 }}
                className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-400/20 shadow-lg"
              >
                <Crown className="h-8 w-8 text-amber-300" />
              </motion.div>

              <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                {conquerorEvent.kingdomName} · {conquerorEvent.subjectName}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-4xl">
                YOU HAVE CONQUERED THE KINGDOM!
              </h2>
              <p className="mt-2 text-sm font-bold text-amber-200">
                All hail <span className="text-white">{studentName}</span>, newly crowned{' '}
                <span className="rounded bg-amber-400 px-2 py-0.5 text-slate-950">
                  {conquerorEvent.conquerorTitle}
                </span>
              </p>

              {/* 3D Avatar Wearing the Royal Crown */}
              <div className="mx-auto mt-3 flex justify-center">
                <StudentAvatar
                  appearance={avatarAppearance}
                  equippedItems={{
                    ...avatarEquipped,
                    headwear: conquerorEvent.crownItemKey,
                  }}
                  size="hero"
                  variant="stage"
                  animation="celebrate"
                  flameTier="cosmic"
                />
              </div>

              {/* Exclusive Rewards & XP */}
              <div className="mt-2 rounded-2xl border border-amber-400/40 bg-slate-900/80 p-4">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />+{conquerorEvent.xpBonus} Royal Bonus XP
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-200">
                    <Award className="h-3.5 w-3.5" />
                    Title: {conquerorEvent.conquerorTitle}
                  </span>
                </div>

                {conquerorEvent.unlockedRewards.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {conquerorEvent.unlockedRewards.map((rw) => (
                      <span
                        key={rw.itemKey}
                        className="rounded-lg border border-amber-300/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-200"
                      >
                        {rw.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onDismissConqueror}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-400 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition hover:brightness-105"
              >
                Claim Royal Rewards
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ) : levelVictory ? (
            /* LEVEL COMPLETION VICTORY CELEBRATION */
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl border-2 border-sky-400/70 bg-gradient-to-b from-slate-950/95 via-[#0c1b2e]/95 to-slate-950/95 p-6 text-center shadow-[0_0_60px_rgba(56,189,248,0.3)]"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onDismissLevelVictory}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-bold text-slate-300 hover:text-white"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  Skip
                </button>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
                Quest Victory
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
                LEVEL COMPLETED!
              </h2>
              <p className="mt-1.5 text-sm font-bold text-emerald-300">
                INCREDIBLE, {studentName}! You conquered Level {levelVictory.levelNumber}:{' '}
                {levelVictory.levelTitle}!
              </p>

              {/* Stars Row */}
              <div className="mt-3 flex justify-center gap-2">
                {[1, 2, 3].map((s) => (
                  <motion.div
                    key={s}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.12 * s, type: 'spring' }}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        s <= levelVictory.starsEarned
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* 3D Avatar Celebrating (wearing newly unlocked outfit if any) */}
              {(() => {
                const rewards = levelVictory.unlockedClothingRewards ?? [];
                const previewApp: Partial<AvatarAppearance> = { ...avatarAppearance };
                const previewEq: Partial<AvatarEquippedItems> = { ...avatarEquipped };
                for (const rw of rewards) {
                  if (['outfit', 'jacket', 'bottoms', 'shoes', 'costume'].includes(rw.category)) {
                    (previewApp as Record<string, string>)[rw.category] = rw.itemKey;
                  } else {
                    (previewEq as Record<string, string>)[rw.category] = rw.itemKey;
                  }
                }
                return (
                  <div className="mx-auto mt-1 flex flex-col items-center">
                    <StudentAvatar
                      appearance={previewApp}
                      equippedItems={previewEq}
                      size="hero"
                      variant="stage"
                      animation="celebrate"
                    />
                    {rewards.length > 0 && (
                      <div className="mt-2 w-full rounded-xl border border-amber-300/60 bg-amber-500/10 p-3 text-left">
                        <p className="text-center text-xs font-black uppercase tracking-wider text-amber-300">
                          You unlocked a new outfit!
                        </p>
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                          {rewards.map((rw) => (
                            <span
                              key={rw.itemKey}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-slate-900/90 px-2.5 py-1 text-xs font-extrabold text-white"
                            >
                              {rw.name}
                              <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[9px] uppercase text-purple-200">
                                {rw.rarity}
                              </span>
                            </span>
                          ))}
                        </div>
                        {onEquipUnlockedRewards && (
                          <div className="mt-2.5 flex justify-center">
                            <button
                              type="button"
                              disabled={equipping || equippedNow}
                              onClick={async () => {
                                setEquipping(true);
                                try {
                                  await onEquipUnlockedRewards(rewards);
                                  setEquippedNow(true);
                                } finally {
                                  setEquipping(false);
                                }
                              }}
                              className="rounded-lg border border-emerald-300 bg-emerald-400 px-3.5 py-1 text-[11px] font-black uppercase text-slate-950 transition hover:brightness-105 disabled:opacity-70"
                            >
                              {equippedNow
                                ? 'Equipped!'
                                : equipping
                                  ? 'Equipping...'
                                  : 'Equip Now'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* XP & Next Level Preview */}
              <div className="mt-2 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-4 py-1.5 text-xs font-black text-amber-200">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  {levelVictory.alreadyCompleted
                    ? 'Quest Replayed · Best Score Updated'
                    : `+${levelVictory.xpEarned} XP Earned`}
                </div>

                {levelVictory.nextLevel && (
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5 text-xs">
                    <p className="font-extrabold uppercase tracking-wider text-emerald-300">
                      Next Level Unlocked!
                    </p>
                    <p className="mt-0.5 font-bold text-white">
                      Level {levelVictory.nextLevel.levelNumber}: {levelVictory.nextLevel.title}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                {levelVictory.nextLevel && onContinueNextLevel ? (
                  <button
                    type="button"
                    onClick={onContinueNextLevel}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:brightness-105"
                  >
                    Continue Adventure
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onDismissLevelVictory}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:brightness-105"
                  >
                    Continue Adventure
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
