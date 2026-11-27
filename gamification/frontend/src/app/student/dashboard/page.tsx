'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Compass,
  Flame,
  LogIn,
  MapPin,
  Palette,
  ScrollText,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { StudentAvatar } from '@/components/avatar/StudentAvatar';
import { AvatarAnimationState } from '@/components/avatar/three/avatarAnimations';
import { GameButton } from '@/components/game-ui/GameButton';
import { ItemThumbnail } from '@/components/game-ui/ItemThumbnail';
import { VillageBackdrop } from '@/components/game-ui/VillageBackdrop';
import { XpProgressBar } from '@/components/game-ui/XpProgressBar';
import { toFriendlyStudentError } from '@/components/game-ui/friendlyError';
import { StudentNavShell } from '@/components/student/StudentNavShell';
import {
  ApiError,
  apiClient,
  clearAuthSession,
  getCachedDashboard,
  getStoredToken,
  setCachedDashboard,
} from '@/lib/apiClient';
import {
  LeaderboardMeResponse,
  StreakSummary,
  StudentDashboardData,
} from '@/types/student';

const AuthModal = dynamic(
  () => import('@/components/world-map/AuthModal').then((m) => m.AuthModal),
  { ssr: false },
);

function formatItemLabel(key: string, prefix: string): string {
  const cleaned = key.replace(prefix, '').replace(/-/g, ' ').trim();
  if (!cleaned || cleaned === 'none') return 'None';
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [leaderboardMe, setLeaderboardMe] = useState<LeaderboardMeResponse | null>(null);
  const [lobbyAnim, setLobbyAnim] = useState<AvatarAnimationState>('idle');
  const [streak, setStreak] = useState<StreakSummary | null>(null);

  const loadDashboard = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }

    const cached = getCachedDashboard<StudentDashboardData>();
    if (cached) {
      setData(cached);
      if (cached.streak) setStreak(cached.streak);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);
    setNeedsAuth(false);
    try {
      const [res, lbMe, streakRes] = await Promise.all([
        apiClient.getStudentDashboard(),
        apiClient
          .getLeaderboardMe({ type: 'global', period: 'all-time' })
          .catch(() => null),
        apiClient.getStreak().catch(() => null),
      ]);
      setData(res);
      const resolvedStreak = streakRes ?? res.streak ?? null;
      if (resolvedStreak) {
        setStreak(resolvedStreak);
        setCachedDashboard({ ...res, streak: resolvedStreak });
      } else {
        setCachedDashboard(res);
      }
      if (lbMe) setLeaderboardMe(lbMe);

      if (typeof window !== 'undefined') {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (
          browserTz &&
          (!res.profile.timezone || res.profile.timezone === 'UTC') &&
          browserTz !== 'UTC'
        ) {
          void apiClient
            .updateStudentProfile({ timezone: browserTz })
            .then(() => apiClient.getStreak().then(setStreak))
            .catch(() => undefined);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === 'TOKEN_INVALID')) {
        clearAuthSession();
        setData(null);
        setNeedsAuth(true);
      } else if (!cached) {
        setError(
          toFriendlyStudentError(
            err,
            'We could not reach your Base Camp right now. Please try again in a moment.',
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (needsAuth) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center bg-[#071426] px-4 text-[#F3EFE6]">
        <VillageBackdrop className="absolute inset-0 opacity-75" />
        <div className="vq-panel relative z-10 max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#F5B900]/70 bg-[#13253D] text-[#F5B900]">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-[#E9DFC7]">
            Enter VidyaQuest
          </h1>
          <p className="mt-2 text-sm text-[#E9DFC7]/75">
            Sign in to return to your village base camp, equip your 3D explorer, and continue your quests.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <GameButton
              variant="gold"
              size="md"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <LogIn className="h-4 w-4" />
              Sign In / Register
            </GameButton>
            <GameButton variant="navy" size="md" href="/world">
              Explore World Map
            </GameButton>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthenticated={() => {
            void loadDashboard();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <StudentNavShell>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="h-72 animate-pulse rounded-2xl bg-[#0D1B2D] lg:col-span-4" />
          <div className="h-96 animate-pulse rounded-2xl bg-[#0D1B2D] lg:col-span-4" />
          <div className="h-72 animate-pulse rounded-2xl bg-[#0D1B2D] lg:col-span-4" />
        </div>
      </StudentNavShell>
    );
  }

  if (error || !data) {
    return (
      <StudentNavShell>
        <div className="vq-panel mx-auto mt-10 max-w-lg rounded-2xl p-6 text-center">
          <p className="text-base font-bold text-rose-200">
            {error ?? 'Your Base Camp could not be loaded.'}
          </p>
          <GameButton
            variant="gold"
            size="sm"
            onClick={() => void loadDashboard()}
            className="mt-4"
          >
            Try Again
          </GameButton>
        </div>
      </StudentNavShell>
    );
  }

  const {
    profile,
    avatar,
    xp,
    statistics,
    subjectProgress,
    continueAdventure,
    dailyQuest,
    achievements,
    recentActivity,
  } = data;
  const activeStreak = streak ?? data.streak ?? null;

  const notifications = recentActivity.slice(0, 4).map((a) => ({
    id: a.id,
    text: a.description,
  }));

  const nextQuest =
    continueAdventure.inProgressMission ??
    continueAdventure.recommendedNextMission ??
    continueAdventure.lastAttemptedMission;

  const continueHref = nextQuest
    ? `/world?subject=${encodeURIComponent(nextQuest.subjectSlug)}`
    : `/world?subject=${encodeURIComponent(continueAdventure.lastVisitedSubjectSlug || 'science')}`;

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const latestReward = unlockedAchievements[0] ?? null;
  const upcomingMilestone = achievements.find((a) => !a.unlocked) ?? null;

  const dailyPct =
    dailyQuest.targetCount > 0
      ? Math.min(100, Math.round((dailyQuest.currentCount / dailyQuest.targetCount) * 100))
      : 0;

  return (
    <StudentNavShell
      displayName={profile.displayName}
      level={xp.level}
      avatar={avatar}
      notifications={notifications}
      accessibility={profile.accessibilitySettings}
    >
      {/* ADVENTURE HOME / BASE CAMP */}
      <div className="relative overflow-hidden rounded-2xl border border-[#233B59] bg-[#071426]">
        {/* Illustrated Fantasy Village Backdrop */}
        <VillageBackdrop className="absolute inset-0 h-full w-full" />

        <div className="relative z-10 grid items-stretch gap-5 p-4 sm:p-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Player Identity, Streak Campfire & Equipped Gear */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-4">
            {/* Player Identity Crest */}
            <div className="vq-panel rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#F5B900]">
                    {profile.activeTitle || 'Village Explorer'}
                  </p>
                  <h1 className="mt-0.5 truncate text-xl font-black tracking-tight text-[#E9DFC7] sm:text-2xl">
                    {profile.displayName}
                  </h1>
                  <p className="mt-0.5 text-xs font-semibold text-[#E9DFC7]/70">
                    {profile.classGrade}
                    {profile.school ? ` · ${profile.school}` : ''}
                  </p>
                </div>
                <Link
                  href="/student/leaderboard"
                  className="shrink-0 rounded-lg border border-[#2C4669] bg-[#071426] px-2.5 py-1.5 text-right transition hover:border-[#F5B900]/60"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E9DFC7]/65">
                    Rank
                  </p>
                  <p className="flex items-center justify-end gap-1 text-sm font-black text-[#F5B900]">
                    <Trophy className="h-3.5 w-3.5" />
                    {leaderboardMe?.optedOut
                      ? 'Private'
                      : leaderboardMe?.rank
                        ? `#${leaderboardMe.rank}`
                        : '—'}
                  </p>
                </Link>
              </div>

              <div className="mt-4">
                <XpProgressBar
                  level={xp.level}
                  totalXp={xp.totalXp}
                  currentXp={xp.currentLevelXp}
                  xpPerLevel={xp.xpPerLevel}
                  progressPercentage={xp.progressPercentage}
                />
              </div>
            </div>

            {/* Streak Campfire */}
            {activeStreak && (
              <div className="vq-panel rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D2100] text-[#F5B900]">
                      <Flame className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-[#E9DFC7]">
                        {activeStreak.currentStreakDays}-Day Adventure Streak
                      </p>
                      <p className="text-[11px] text-[#E9DFC7]/65">
                        Best: {activeStreak.longestStreakDays}d
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#2C4669] bg-[#071426] px-2 py-1 text-[11px] font-bold text-sky-300">
                    <Shield className="h-3 w-3" />
                    {activeStreak.availableFreezes}/{activeStreak.maxFreezes}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {activeStreak.weeklyCalendar.map((day) => {
                    const isDone = day.status === 'completed';
                    const isFreeze = day.status === 'freeze_used';
                    const isToday = day.status === 'today_pending';
                    return (
                      <div
                        key={day.dateKey}
                        className={`rounded-md border py-1.5 text-center text-[10px] font-extrabold ${
                          isDone
                            ? 'border-[#F5B900]/70 bg-[#F5B900]/20 text-[#F5B900]'
                            : isFreeze
                              ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                              : isToday
                                ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
                                : 'border-[#1E3350] bg-[#071426] text-[#E9DFC7]/45'
                        }`}
                      >
                        {day.dayLabel}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Equipped Gear Strip */}
            <div className="vq-panel rounded-xl p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#E9DFC7]/75">
                  Equipped Loadout
                </p>
                <Link
                  href="/student/avatar"
                  className="text-[11px] font-extrabold text-[#F5B900] hover:underline"
                >
                  Open Wardrobe
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/student/avatar"
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-[#233B59] bg-[#071426]/80 p-2 text-center transition hover:border-[#F5B900]/60"
                >
                  <ItemThumbnail category="outfit" size="sm" />
                  <span className="w-full truncate text-[10px] font-bold text-[#E9DFC7]">
                    {formatItemLabel(avatar.appearance.outfit, 'outfit-')}
                  </span>
                </Link>
                <Link
                  href="/student/avatar"
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-[#233B59] bg-[#071426]/80 p-2 text-center transition hover:border-[#F5B900]/60"
                >
                  <ItemThumbnail category="headwear" size="sm" />
                  <span className="w-full truncate text-[10px] font-bold text-[#E9DFC7]">
                    {formatItemLabel(avatar.equippedItems.headwear, 'headwear-')}
                  </span>
                </Link>
                <Link
                  href="/student/avatar"
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-[#233B59] bg-[#071426]/80 p-2 text-center transition hover:border-[#F5B900]/60"
                >
                  <ItemThumbnail category="backpack" size="sm" />
                  <span className="w-full truncate text-[10px] font-bold text-[#E9DFC7]">
                    {formatItemLabel(avatar.equippedItems.backpack, 'backpack-')}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* CENTERPIECE: Borderless 3D Explorer standing in the Village Plaza */}
          <div className="relative flex flex-col items-center justify-end py-2 lg:col-span-4">
            <div className="w-full">
              <StudentAvatar
                appearance={avatar.appearance}
                equippedItems={avatar.equippedItems}
                size="lobby"
                variant="stage"
                flameTier={activeStreak?.flameTier ?? 'none'}
                animation={lobbyAnim}
                reducedMotion={profile.accessibilitySettings?.reducedMotion}
                celebrateTrigger={dailyQuest.completed ? 1 : 0}
              />
            </div>

            {/* Compact Pose & Studio Bar */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {(['idle', 'walk', 'jump', 'celebrate'] as AvatarAnimationState[]).map(
                (pose) => (
                  <button
                    key={pose}
                    type="button"
                    onClick={() => setLobbyAnim(pose)}
                    className={`rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider transition ${
                      lobbyAnim === pose
                        ? 'border-[#FFD95A] bg-[#F5B900] text-[#071426]'
                        : 'border-[#2C4669] bg-[#0D1B2D]/90 text-[#E9DFC7]/80 hover:border-[#F5B900]/50 hover:text-white'
                    }`}
                  >
                    {pose === 'celebrate' ? 'Cheer' : pose}
                  </button>
                ),
              )}
              <GameButton variant="navy" size="sm" href="/student/avatar">
                <Palette className="h-3.5 w-3.5 text-[#F5B900]" />
                Customize
              </GameButton>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-[#E9DFC7]/60">
              Drag to rotate · Click explorer to cheer
            </p>
          </div>

          {/* RIGHT COLUMN: Quest Board, Rewards & Continue Adventure */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-4">
            {/* Quest Board */}
            <div className="vq-panel rounded-xl p-4">
              <div className="flex items-center justify-between border-b border-[#233B59] pb-2">
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-[#F5B900]" />
                  <h2 className="text-[11px] font-black uppercase tracking-wider text-[#E9DFC7]">
                    Quest Board
                  </h2>
                </div>
                <span className="rounded border border-[#F5B900]/40 bg-[#F5B900]/15 px-2 py-0.5 text-[10px] font-black text-[#F5B900]">
                  {statistics.completedMissions}/{statistics.totalMissions} Cleared
                </span>
              </div>

              {/* Next Objective */}
              <div className="mt-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#E9DFC7]/60">
                  {continueAdventure.inProgressMission
                    ? 'In Progress'
                    : 'Next Objective'}
                </p>
                {nextQuest ? (
                  <div className="mt-1.5 rounded-lg border border-[#233B59] bg-[#071426]/80 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-[#F3EFE6]">
                          {nextQuest.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[#9FB3C8]">
                          <MapPin className="h-3 w-3 text-[#F5B900]" />
                          {nextQuest.subjectName} · {nextQuest.mapName}
                        </p>
                      </div>
                      <span className="shrink-0 rounded border border-[#F5B900]/40 bg-[#2D2100] px-2 py-0.5 text-[10px] font-black text-[#F5B900]">
                        +{nextQuest.xpReward} XP
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs font-bold text-[#9FB3C8]">
                    Explore the World Map to pick your next quest!
                  </p>
                )}
              </div>

              {/* Daily Quest */}
              <div className="mt-3 rounded-lg border border-[#233B59] bg-[#071426]/80 p-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#E9DFC7]/70">
                  <span>Daily Bounty</span>
                  <span className="text-[#F5B900]">+{dailyQuest.xpReward} XP</span>
                </div>
                <p className="mt-1 text-xs font-extrabold text-[#F3EFE6]">
                  {dailyQuest.title}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#13263E]">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${dailyPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-[#E9DFC7]/80">
                    {dailyQuest.completed
                      ? 'Done!'
                      : `${dailyQuest.currentCount}/${dailyQuest.targetCount}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Realm Progress & Recent / Upcoming Rewards */}
            <div className="vq-panel space-y-3 rounded-xl p-4">
              {subjectProgress.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#E9DFC7]/75">
                    <span>Realms Explored</span>
                    <Link href="/world" className="text-[#F5B900] hover:underline">
                      All Realms
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {subjectProgress.slice(0, 3).map((subj) => (
                      <Link
                        key={subj.id}
                        href={`/world?subject=${encodeURIComponent(subj.slug)}`}
                        className="block rounded-lg border border-[#1E3350] bg-[#071426]/80 px-3 py-2 transition hover:border-[#F5B900]/50"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#E9DFC7]">{subj.name}</span>
                          <span className="text-[11px] text-[#F5B900]">
                            {subj.completedMissions}/{subj.totalMissions}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#13253D]">
                          <div
                            className="h-full bg-[#F5B900]"
                            style={{ width: `${subj.completionPercentage}%` }}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Reward / Next Milestone */}
              <div className="grid grid-cols-2 gap-2 border-t border-[#1E3350] pt-3">
                <Link
                  href="/student/achievements"
                  className="rounded-lg border border-[#1E3350] bg-[#071426]/80 p-2.5 transition hover:border-[#F5B900]/50"
                >
                  <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    <Award className="h-3 w-3" />
                    Latest Badge
                  </p>
                  <p className="mt-1 truncate text-xs font-bold text-[#E9DFC7]">
                    {latestReward ? latestReward.name : 'First Quest Awaits'}
                  </p>
                </Link>
                <Link
                  href="/student/achievements"
                  className="rounded-lg border border-[#1E3350] bg-[#071426]/80 p-2.5 transition hover:border-[#F5B900]/50"
                >
                  <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#F5B900]">
                    <Sparkles className="h-3 w-3" />
                    Next Milestone
                  </p>
                  <p className="mt-1 truncate text-xs font-bold text-[#E9DFC7]">
                    {upcomingMilestone
                      ? upcomingMilestone.name
                      : `${statistics.achievementsEarned}/${statistics.totalAchievements} Earned`}
                  </p>
                </Link>
              </div>
            </div>

            {/* Primary Continue Adventure CTA */}
            <GameButton
              variant="gold"
              size="lg"
              href={continueHref}
              className="w-full justify-between"
            >
              <span>Continue Adventure</span>
              <ArrowRight className="h-5 w-5" />
            </GameButton>
          </div>
        </div>
      </div>
    </StudentNavShell>
  );
}
