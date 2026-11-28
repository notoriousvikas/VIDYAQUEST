'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Flame,
  Shield,
  Snowflake,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { FlameTier, StreakRewardItem, StreakSummary } from '@/types/student';

interface StreakDashboardSectionProps {
  streak: StreakSummary | null;
  rewards: StreakRewardItem[];
  loading: boolean;
  error: string | null;
  reducedMotion?: boolean;
  continueHref: string;
  onUseFreeze: () => Promise<void>;
  onRetry: () => void;
}

const FLAME_STYLES: Record<
  FlameTier,
  { glow: string; icon: string; badge: string; label: string }
> = {
  none: {
    glow: 'from-slate-700/20 to-slate-800/10 border-slate-700',
    icon: 'text-slate-400',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    label: 'Start Your Flame',
  },
  spark: {
    glow: 'from-amber-500/25 via-orange-500/15 to-transparent border-amber-400/60',
    icon: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
    label: 'Spark Flame',
  },
  blaze: {
    glow: 'from-orange-500/30 via-amber-500/20 to-transparent border-orange-400/70',
    icon: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-200 border-orange-400/60',
    label: 'Blaze Tier (7d+)',
  },
  phoenix: {
    glow: 'from-rose-500/30 via-amber-500/20 to-transparent border-rose-400/70',
    icon: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-200 border-rose-400/60',
    label: 'Phoenix Tier (30d+)',
  },
  inferno: {
    glow: 'from-purple-500/30 via-amber-500/20 to-transparent border-purple-400/70',
    icon: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-200 border-purple-400/60',
    label: 'Inferno Tier (60d+)',
  },
  cosmic: {
    glow: 'from-sky-400/30 via-amber-400/20 to-transparent border-sky-400/80',
    icon: 'text-sky-300',
    badge: 'bg-sky-500/20 text-sky-200 border-sky-400/60',
    label: 'Cosmic Ember (100d+)',
  },
};

export function StreakDashboardSection({
  streak,
  rewards,
  loading,
  error,
  reducedMotion = false,
  continueHref,
  onUseFreeze,
  onRetry,
}: StreakDashboardSectionProps) {
  const [freezing, setFreezing] = useState(false);
  const [freezeNotice, setFreezeNotice] = useState<string | null>(null);
  const [freezeError, setFreezeError] = useState<string | null>(null);
  const [showRewards, setShowRewards] = useState(false);

  if (loading && !streak) {
    return (
      <section className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
    );
  }

  if (error && !streak) {
    return (
      <section className="rounded-2xl border border-rose-400/50 bg-slate-950/90 p-5 text-center">
        <p className="text-sm font-bold text-rose-200">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-extrabold text-slate-950"
        >
          Retry Streak
        </button>
      </section>
    );
  }

  if (!streak) {
    return (
      <section className="rounded-2xl border border-amber-300/40 bg-slate-950/90 p-5 text-center">
        <Flame className="mx-auto h-8 w-8 text-amber-400" />
        <p className="mt-2 text-sm font-black text-white">Daily Learning Streak</p>
        <p className="mt-1 text-xs text-slate-300">
          Complete a lesson, quiz, or virtual lab today to ignite your streak!
        </p>
        <Link
          href={continueHref}
          className="mt-3 inline-block rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-extrabold text-slate-950"
        >
          Start Learning
        </Link>
      </section>
    );
  }

  const tierStyle = FLAME_STYLES[streak.flameTier] ?? FLAME_STYLES.none;

  const handleFreezeClick = async () => {
    setFreezing(true);
    setFreezeError(null);
    setFreezeNotice(null);
    try {
      await onUseFreeze();
      setFreezeNotice('Streak Freeze activated! Yesterday is now protected.');
    } catch (err) {
      setFreezeError(err instanceof Error ? err.message : 'Unable to activate streak freeze.');
    } finally {
      setFreezing(false);
    }
  };

  return (
    <section
      aria-label="Daily Learning Streak"
      className="overflow-hidden rounded-2xl border-2 border-amber-300/50 bg-slate-950/95 p-5 shadow-xl"
    >
      {/* Top Status Alerts: Freeze Used / Streak-at-Risk / Friendly Reminder */}
      <AnimatePresence>
        {freezeNotice && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-sky-400/60 bg-sky-500/15 px-3.5 py-2.5 text-xs font-bold text-sky-200"
          >
            <Snowflake className="h-4 w-4 shrink-0 text-sky-300" />
            <span>{freezeNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {streak.atRisk ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/60 bg-amber-500/15 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              {streak.canUseFreezeForYesterday
                ? `Streak at risk! You missed yesterday (${streak.timezone}). Use a Streak Freeze or complete a quest today.`
                : `Streak at risk! Complete a lesson, quiz, or virtual lab today to keep your ${streak.currentStreakDays}-day streak alive.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {streak.canUseFreezeForYesterday && (
              <button
                type="button"
                disabled={freezing}
                onClick={() => void handleFreezeClick()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-400 px-3 py-1 text-[11px] font-black text-slate-950 transition hover:brightness-105 disabled:opacity-60"
              >
                <Snowflake className="h-3.5 w-3.5" />
                {freezing ? 'Applying...' : 'Use Freeze'}
              </button>
            )}
            <Link
              href={continueHref}
              className="rounded-lg bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950 transition hover:brightness-105"
            >
              Learn Today
            </Link>
          </div>
        </div>
      ) : !streak.learnedToday ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2.5">
          <p className="text-xs font-bold text-emerald-200">
            Ready to ignite today&apos;s streak? Complete any lesson, quiz, or virtual lab!
          </p>
          <Link
            href={continueHref}
            className="rounded-lg bg-emerald-400 px-3 py-1 text-[11px] font-black text-slate-950 transition hover:brightness-105"
          >
            Start Quest
          </Link>
        </div>
      ) : null}

      {freezeError && (
        <p className="mb-3 text-xs font-bold text-rose-300">{freezeError}</p>
      )}

      {/* Main Streak Grid */}
      <div className="grid gap-5 md:grid-cols-12">
        {/* Left: Animated Flame + Current Streak */}
        <div
          className={`flex flex-col items-center justify-center rounded-xl border bg-gradient-to-b p-4 text-center md:col-span-4 ${tierStyle.glow}`}
        >
          <motion.div
            animate={
              reducedMotion || streak.currentStreakDays === 0
                ? undefined
                : { scale: [1, 1.09, 1], rotate: [-2, 2, -2] }
            }
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-950/70 shadow-inner"
          >
            <Flame className={`h-12 w-12 ${tierStyle.icon}`} />
            {streak.learnedToday && (
              <span
                title="Completed today"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-400 text-slate-950"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            )}
          </motion.div>

          <p className="mt-2 text-3xl font-black text-white">
            {streak.currentStreakDays}{' '}
            <span className="text-base font-extrabold text-slate-300">
              {streak.currentStreakDays === 1 ? 'Day' : 'Days'}
            </span>
          </p>
          <span
            className={`mt-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${tierStyle.badge}`}
          >
            {tierStyle.label}
          </span>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            {streak.learnedToday ? 'Today’s learning complete!' : 'Complete 1 activity today'}
          </p>
        </div>

        {/* Right: Stats, Weekly Calendar & Milestone Progress */}
        <div className="flex flex-col justify-between gap-4 md:col-span-8">
          {/* Top 3 Stat Pills */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Longest
              </div>
              <p className="mt-1 text-lg font-black text-white">
                {streak.longestStreakDays}d
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                Active Days
              </div>
              <p className="mt-1 text-lg font-black text-white">
                {streak.totalActiveDays}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Snowflake className="h-3.5 w-3.5 text-sky-400" />
                Freezes
              </div>
              <p className="mt-1 text-lg font-black text-sky-300">
                {streak.availableFreezes} / {streak.maxFreezes}
              </p>
            </div>
          </div>

          {/* Weekly Calendar (Mon - Sun) */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">This Week (Mon–Sun)</span>
              <span className="text-[10px] text-slate-400">{streak.timezone}</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {streak.weeklyCalendar.map((day) => {
                const isDone = day.status === 'completed';
                const isFrozen = day.status === 'freeze_used';
                const isToday = day.status === 'today_pending';
                const isMissed = day.status === 'missed';

                return (
                  <div
                    key={day.dateKey}
                    title={`${day.dayLabel} (${day.dateKey}): ${day.status.replace('_', ' ')}`}
                    className={`flex flex-col items-center rounded-xl border py-2 text-center transition ${
                      isDone
                        ? 'border-amber-400/70 bg-amber-500/20 text-amber-200'
                        : isFrozen
                          ? 'border-sky-400/70 bg-sky-500/20 text-sky-200'
                          : isToday
                            ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200'
                            : isMissed
                              ? 'border-slate-800 bg-slate-900/60 text-slate-500'
                              : 'border-slate-800/60 bg-slate-900/30 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase">{day.dayLabel}</span>
                    <div className="mt-1">
                      {isDone ? (
                        <Flame className="h-4 w-4 text-amber-400" />
                      ) : isFrozen ? (
                        <Shield className="h-4 w-4 text-sky-300" />
                      ) : isToday ? (
                        <Sparkles className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-slate-700" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Milestone Progress */}
          {streak.nextMilestone ? (
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Award className="h-3.5 w-3.5" />
                  Next: {streak.nextMilestone.title} ({streak.nextMilestone.daysRemaining}d left)
                </span>
                <button
                  type="button"
                  onClick={() => setShowRewards((s) => !s)}
                  className="text-[11px] font-extrabold text-sky-300 hover:text-sky-200"
                >
                  {showRewards ? 'Hide Rewards' : 'View All Rewards'}
                </button>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-500"
                  style={{ width: `${streak.nextMilestone.progressPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Reward: <span className="font-bold text-slate-200">{streak.nextMilestone.rewardLabel}</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-sky-400/50 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-200">
              <span>All streak milestones conquered! You are a Cosmic Ember legend.</span>
              <button
                type="button"
                onClick={() => setShowRewards((s) => !s)}
                className="text-[11px] font-extrabold text-amber-300"
              >
                {showRewards ? 'Hide Rewards' : 'View Rewards'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Milestone Rewards Roadmap */}
      {showRewards && rewards.length > 0 && (
        <div className="mt-5 grid gap-2.5 border-t border-slate-800 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => (
            <div
              key={r.days}
              className={`rounded-xl border p-3 text-xs ${
                r.claimed
                  ? 'border-emerald-400/60 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-white">{r.days}-Day Streak</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                    r.claimed
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : 'bg-slate-800 text-amber-300'
                  }`}
                >
                  {r.claimed ? 'Claimed' : 'Locked'}
                </span>
              </div>
              <p className="mt-1 font-bold text-slate-200">{r.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{r.rewardLabel}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
