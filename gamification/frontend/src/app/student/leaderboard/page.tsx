'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Atom,
  Award,
  Calendar,
  Code2,
  Compass,
  Crown,
  FlaskConical,
  Globe2,
  GraduationCap,
  Leaf,
  Medal,
  School,
  Shield,
  Sigma,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { StudentAvatar } from '@/components/avatar/StudentAvatar';
import { StudentNavShell } from '@/components/student/StudentNavShell';
import {
  ApiError,
  apiClient,
  clearAuthSession,
  getCachedDashboard,
  getStoredToken,
} from '@/lib/apiClient';
import {
  LeaderboardEntry,
  LeaderboardMeResponse,
  LeaderboardPeriod,
  LeaderboardSubjectSlug,
  LeaderboardType,
  PublicLeaderboardProfile,
  StudentDashboardData,
} from '@/types/student';

const CATEGORY_TABS: Array<{ key: LeaderboardType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'global', label: 'Global', icon: Globe2 },
  { key: 'school', label: 'School', icon: School },
  { key: 'class', label: 'Class', icon: GraduationCap },
  { key: 'subject', label: 'Subject', icon: FlaskConical },
];

const PERIOD_OPTIONS: Array<{ key: LeaderboardPeriod; label: string }> = [
  { key: 'all-time', label: 'All-Time' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const SUBJECT_OPTIONS: Array<{
  key: LeaderboardSubjectSlug;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'chemistry', label: 'Chemistry', icon: FlaskConical },
  { key: 'physics', label: 'Physics', icon: Atom },
  { key: 'biology', label: 'Biology', icon: Leaf },
  { key: 'mathematics', label: 'Mathematics', icon: Sigma },
  { key: 'coding', label: 'Coding', icon: Code2 },
];

const PAGE_LIMIT = 20;

export default function StudentLeaderboardPage() {
  const [dashMeta, setDashMeta] = useState<Pick<
    StudentDashboardData,
    'profile' | 'avatar' | 'xp'
  > | null>(null);
  const [type, setType] = useState<LeaderboardType>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [subject, setSubject] = useState<LeaderboardSubjectSlug>('chemistry');

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<LeaderboardMeResponse | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [scopeHint, setScopeHint] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<PublicLeaderboardProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const cached = getCachedDashboard<StudentDashboardData>();
    if (cached) {
      setDashMeta({
        profile: cached.profile,
        avatar: cached.avatar,
        xp: cached.xp,
      });
    }
  }, []);

  const loadLeaderboard = useCallback(
    async (targetPage = 1, append = false) => {
      const token = getStoredToken();
      if (!token) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setNeedsAuth(false);

      const queryParams = {
        type,
        period,
        subject: type === 'subject' ? subject : undefined,
      };

      try {
        const [lbRes, meRes] = await Promise.all([
          apiClient.getLeaderboard({
            ...queryParams,
            page: targetPage,
            limit: PAGE_LIMIT,
          }),
          append ? Promise.resolve(me) : apiClient.getLeaderboardMe(queryParams),
        ]);

        setEntries((prev) => (append ? [...prev, ...lbRes.items] : lbRes.items));
        setPage(lbRes.page);
        setHasMore(lbRes.hasMore);
        setScopeHint(lbRes.scopeHint ?? meRes?.scopeHint);
        if (meRes) setMe(meRes);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.code === 'TOKEN_INVALID')) {
          clearAuthSession();
          setNeedsAuth(true);
        } else {
          setError(
            err instanceof Error ? err.message : 'Unable to load leaderboard rankings.',
          );
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [type, period, subject, me],
  );

  useEffect(() => {
    void loadLeaderboard(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, period, subject]);

  const handleOpenStudentDetails = async (studentId: string) => {
    setProfileLoading(true);
    setSelectedProfile(null);
    try {
      const details = await apiClient.getLeaderboardStudentDetails(studentId);
      setSelectedProfile(details);
    } catch {
      setSelectedProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  if (needsAuth) {
    return (
      <StudentNavShell>
        <div className="mx-auto max-w-md rounded-2xl border-2 border-amber-300/70 bg-slate-950/90 p-8 text-center shadow-2xl">
          <Trophy className="mx-auto h-10 w-10 text-amber-300" />
          <h1 className="mt-3 text-2xl font-black text-white">Hall of Explorers</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in from the Student Dashboard to view Global, School, Class, and Subject leaderboards.
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-950"
          >
            Go to Dashboard
          </Link>
        </div>
      </StudentNavShell>
    );
  }

  const podiumTop3 = entries.slice(0, 3);
  const podiumOrder =
    podiumTop3.length === 3
      ? [podiumTop3[1], podiumTop3[0], podiumTop3[2]]
      : podiumTop3;

  const isCurrentUserVisible = entries.some((e) => e.isCurrentUser);
  const showStickyMyRank = Boolean(me && !me.optedOut && !isCurrentUserVisible && !loading);

  return (
    <StudentNavShell
      displayName={dashMeta?.profile.displayName}
      level={dashMeta?.xp.level ?? me?.level}
      avatar={dashMeta?.avatar}
    >
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
              <Trophy className="h-7 w-7 text-amber-300" />
              VidyaQuest Leaderboard
            </h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Celebrate progress, subject mastery, and weekly momentum across your learning realms.
            </p>
          </div>

          <Link
            href="/student/profile"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-amber-300/60 hover:text-amber-200"
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Privacy Settings
          </Link>
        </div>

        {/* Healthy Gamification Summary Bar */}
        {me && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-amber-300/40 bg-slate-950/90 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Your Rank
              </p>
              <p className="mt-1 text-2xl font-black text-amber-300">
                {me.optedOut ? 'Private' : me.rank ? `#${me.rank}` : 'Unranked'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {me.optedOut ? (
                  <Link href="/student/profile" className="text-amber-300 underline">
                    Opted out in Profile
                  </Link>
                ) : (
                  `Out of ${me.participatingStudents} explorer${me.participatingStudents === 1 ? '' : 's'}`
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {period === 'all-time' && type !== 'subject' ? 'Total XP' : 'Period / Subject XP'}
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-300">
                {period === 'all-time' && type !== 'subject' ? me.totalXp : me.periodXp} XP
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Level {me.level} · {me.completedMissions} missions
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Weekly Momentum
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-2xl font-black text-sky-300">
                <TrendingUp className="h-5 w-5" />
                +{me.weeklyXp} XP
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Earned this week</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Personal Best & Next Rank
              </p>
              <p className="mt-1 text-2xl font-black text-purple-300">
                {me.personalBestRank ? `#${me.personalBestRank}` : '—'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {me.optedOut
                  ? 'Enable rankings to track'
                  : me.rank === 1
                    ? 'Leading the realm!'
                    : me.xpToNextRank > 0
                      ? `${me.xpToNextRank} XP to next rank`
                      : 'Complete a mission to rank'}
              </p>
            </div>
          </section>
        )}

        {/* Filters: Category Tabs + Period + Subject */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Leaderboard categories">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = type === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setType(tab.key)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-300/50 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
              <Calendar className="ml-2 h-3.5 w-3.5 text-slate-400" />
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPeriod(opt.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    period === opt.key
                      ? 'bg-emerald-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Pills */}
          {type === 'subject' && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
              {SUBJECT_OPTIONS.map((subj) => {
                const Icon = subj.icon;
                const active = subject === subj.key;
                return (
                  <button
                    key={subj.key}
                    type="button"
                    onClick={() => setSubject(subj.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'border-purple-300 bg-purple-500/25 text-purple-100'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-purple-400/60'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{subj.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-52 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
              <div className="h-60 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
              <div className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/60 bg-slate-950/90 p-6 text-center">
            <p className="text-sm font-bold text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => void loadLeaderboard(1, false)}
              className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950"
            >
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-amber-300/80" />
            <h2 className="mt-3 text-lg font-black text-white">No rankings in this view yet</h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-300">
              {scopeHint ??
                'Complete a mission or virtual experiment in any subject world to earn XP and appear on the leaderboard!'}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/world"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950"
              >
                <Compass className="h-3.5 w-3.5" />
                Explore Worlds
              </Link>
              {scopeHint && (
                <Link
                  href="/student/profile"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200"
                >
                  Update Profile
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {podiumTop3.length > 0 && (
              <section aria-label="Top Three Podium" className="grid items-end gap-4 sm:grid-cols-3">
                {podiumOrder.map((entry) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;

                  return (
                    <button
                      key={entry.studentId}
                      type="button"
                      onClick={() => void handleOpenStudentDetails(entry.studentId)}
                      className={`relative flex flex-col items-center bg-transparent p-3 text-center transition hover:scale-[1.02] ${
                        isFirst ? 'order-first sm:order-none sm:pb-6' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black ${
                          isFirst
                            ? 'bg-amber-400 text-slate-950'
                            : isSecond
                              ? 'bg-slate-200 text-slate-950'
                              : 'bg-amber-700 text-white'
                        }`}
                      >
                        {isFirst ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
                        #{entry.rank}
                      </span>

                      <div className="mt-3">
                        <StudentAvatar
                          appearance={entry.avatar.appearance}
                          equippedItems={entry.avatar.equippedItems}
                          size={isFirst ? 'lg' : 'md'}
                          interactive={false}
                        />
                      </div>

                      <h3 className="mt-3 max-w-full truncate text-base font-black text-white">
                        {entry.displayName}
                        {entry.isCurrentUser && (
                          <span className="ml-1.5 text-xs text-emerald-300">(You)</span>
                        )}
                      </h3>

                      <p className="mt-0.5 text-xs font-bold text-slate-400">
                        Level {entry.level} · {entry.completedMissions} missions
                      </p>

                      <p className="mt-2 inline-flex items-center gap-1 text-lg font-black text-amber-300">
                        <Sparkles className="h-4 w-4" />
                        {entry.xp} XP
                      </p>

                      {entry.topBadge && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                          <Award className="h-3 w-3" />
                          {entry.topBadge.title}
                        </span>
                      )}
                    </button>
                  );
                })}
              </section>
            )}

            {/* Full Ranking Table */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3 text-right">XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {entries.map((entry) => (
                      <tr
                        key={entry.studentId}
                        onClick={() => void handleOpenStudentDetails(entry.studentId)}
                        className={`cursor-pointer transition ${
                          entry.isCurrentUser
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/20'
                            : 'hover:bg-slate-900/80'
                        }`}
                      >
                        <td className="px-4 py-3 font-black text-amber-300">#{entry.rank}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <StudentAvatar
                              appearance={entry.avatar.appearance}
                              equippedItems={entry.avatar.equippedItems}
                              size="sm"
                              className="!h-9 !w-9 !rounded-lg !border"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-white">
                                {entry.displayName}
                                {entry.isCurrentUser && (
                                  <span className="ml-1.5 rounded bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-300">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                {entry.classGrade && <span>{entry.classGrade}</span>}
                                {entry.school && (
                                  <span>
                                    · {entry.school}
                                    {entry.schoolLocation ? ` (${entry.schoolLocation})` : ''}
                                  </span>
                                )}
                                {entry.topBadge && (
                                  <span className="inline-flex items-center gap-1 text-amber-300">
                                    <Award className="h-3 w-3" />
                                    {entry.topBadge.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-200">
                          Lv.{entry.level}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-amber-300">
                          {entry.xp} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="border-t border-slate-800 p-4 text-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => void loadLeaderboard(page + 1, true)}
                    className="rounded-xl border border-amber-300/60 bg-amber-400/15 px-5 py-2 text-xs font-extrabold text-amber-200 transition hover:bg-amber-400 hover:text-slate-950 disabled:opacity-60"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Explorers'}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Sticky "Your Rank" Card when outside visible top rankings */}
      {showStickyMyRank && me && (
        <div className="fixed bottom-16 left-0 right-0 z-30 mx-auto max-w-3xl px-4 md:bottom-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-emerald-400/80 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-emerald-400 px-2.5 py-1 text-xs font-black text-slate-950">
                {me.rank ? `#${me.rank}` : 'Unranked'}
              </span>
              {dashMeta?.avatar && (
                <StudentAvatar
                  appearance={dashMeta.avatar.appearance}
                  equippedItems={dashMeta.avatar.equippedItems}
                  size="sm"
                  className="!h-8 !w-8 !rounded-lg !border"
                />
              )}
              <div>
                <p className="text-xs font-extrabold text-white">
                  {dashMeta?.profile.displayName ?? 'Your Rank'}
                </p>
                <p className="text-[11px] text-slate-300">
                  {me.xpToNextRank > 0
                    ? `${me.xpToNextRank} XP to reach the next rank`
                    : `Level ${me.level}`}
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-300">
              {period === 'all-time' && type !== 'subject' ? me.totalXp : me.periodXp} XP
            </span>
          </div>
        </div>
      )}

      {/* Public Student Profile Modal */}
      {(profileLoading || selectedProfile) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-amber-300/70 bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {profileLoading || !selectedProfile ? (
              <div className="h-48 animate-pulse rounded-xl bg-slate-900" />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StudentAvatar
                      appearance={selectedProfile.avatar.appearance}
                      equippedItems={selectedProfile.avatar.equippedItems}
                      size="md"
                    />
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {selectedProfile.displayName}
                      </h3>
                      <p className="text-xs font-bold text-emerald-300">
                        Level {selectedProfile.level} Explorer · {selectedProfile.totalXp} XP
                      </p>
                      {(selectedProfile.classGrade ||
                        selectedProfile.school ||
                        selectedProfile.schoolLocation) && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {[
                            selectedProfile.classGrade,
                            selectedProfile.school,
                            selectedProfile.schoolLocation,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProfile(null)}
                    aria-label="Close"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    <p className="text-[11px] font-bold text-slate-400">Missions Done</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {selectedProfile.completedMissions}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    <p className="text-[11px] font-bold text-slate-400">Current Streak</p>
                    <p className="mt-1 text-lg font-black text-amber-300">
                      {selectedProfile.currentStreakDays}d
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Achievements ({selectedProfile.achievements.length})
                  </p>
                  {selectedProfile.achievements.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">
                      No achievements unlocked yet.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedProfile.achievements.map((ach) => (
                        <span
                          key={ach.code}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-200"
                        >
                          <Award className="h-3 w-3" />
                          {ach.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </StudentNavShell>
  );
}
