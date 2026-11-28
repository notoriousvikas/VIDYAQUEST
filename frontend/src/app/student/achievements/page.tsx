'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Crown,
  Flame,
  FlaskConical,
  Globe2,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { StudentNavShell } from '@/components/student/StudentNavShell';
import {
  ApiError,
  apiClient,
  clearAuthSession,
  getCachedDashboard,
  getStoredToken,
} from '@/lib/apiClient';
import {
  StudentAchievementItem,
  StudentDashboardData,
  SubjectConquerorRecord,
} from '@/types/student';

type CategoryFilter = 'all' | 'mastery' | 'streak' | 'exploration' | 'lab';

export default function StudentAchievementsPage() {
  const [achievements, setAchievements] = useState<StudentAchievementItem[]>([]);
  const [conquerors, setConquerors] = useState<SubjectConquerorRecord[]>([]);
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!getStoredToken()) {
      setError('Please sign in from the Home Dashboard to view your achievements.');
      setLoading(false);
      return;
    }

    const cached = getCachedDashboard<StudentDashboardData>();
    if (cached) {
      setDashboard(cached);
    }

    setError(null);
    setLoading(true);
    try {
      const [achRes, conqRes, dashRes] = await Promise.all([
        apiClient.getStudentAchievements(),
        apiClient.getStudentConquerors().catch(() => []),
        cached ? Promise.resolve(cached) : apiClient.getStudentDashboard(),
      ]);
      setAchievements(achRes);
      setConquerors(conqRes);
      setDashboard(dashRes);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === 'TOKEN_INVALID')) {
        clearAuthSession();
        setError('Your session expired. Please sign in again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load achievements.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAchievements = useMemo(
    () =>
      category === 'all'
        ? achievements
        : achievements.filter((a) => a.category === category),
    [achievements, category],
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <StudentNavShell
      displayName={dashboard?.profile.displayName}
      level={dashboard?.xp.level}
      avatar={dashboard?.avatar}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-white sm:text-3xl">
            <Trophy className="h-7 w-7 text-amber-400" />
            Royal Achievements &amp; Conqueror Hall
          </h1>
          <p className="text-xs text-slate-300 sm:text-sm">
            Conquer all 8 levels of any subject kingdom to earn royal crowns, titles, and legendary gear.
          </p>
        </div>

        <div className="rounded-xl border border-amber-300/50 bg-slate-950/90 px-4 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Achievements Earned
          </p>
          <p className="text-lg font-black text-amber-300">
            {unlockedCount} / {achievements.length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
          <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/60 bg-slate-950/90 p-6 text-center">
          <p className="text-sm font-bold text-rose-200">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Conquered Kingdoms & Royal Titles */}
          <section className="rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-[#161005] via-slate-950 to-slate-950 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-black text-amber-300">
                <Crown className="h-5 w-5" />
                Conquered Subject Kingdoms ({conquerors.length})
              </h2>
              {dashboard?.profile.activeTitle && (
                <span className="rounded-full border border-amber-300 bg-amber-400 px-3 py-0.5 text-xs font-black text-slate-950">
                  Active Title: {dashboard.profile.activeTitle}
                </span>
              )}
            </div>

            {conquerors.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
                No kingdoms conquered yet! Complete all 8 sequential levels of any subject world to claim your first Royal Crown and Title.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {conquerors.map((c) => (
                  <div
                    key={c.subjectSlug}
                    className="rounded-xl border border-amber-300/60 bg-amber-500/10 p-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Crown className="h-6 w-6 text-amber-300" />
                      <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
                        {c.titleAwarded}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-black text-white">{c.mapName}</h3>
                    <p className="text-[11px] font-bold text-amber-200">{c.subjectName}</p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      Conquered {new Date(c.conqueredAt).toLocaleDateString()} · +{c.xpBonusAwarded} XP
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Next Conqueror Milestones per Subject */}
            {dashboard?.subjectProgress && dashboard.subjectProgress.length > 0 && (
              <div className="mt-5 border-t border-slate-800/80 pt-4">
                <p className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Next Conqueror Milestones
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {dashboard.subjectProgress.map((subj) => (
                    <Link
                      key={subj.id}
                      href={`/world?subject=${encodeURIComponent(subj.slug)}`}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 transition hover:border-amber-300/60"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white">{subj.name}</span>
                        <span className="text-amber-300">
                          {subj.completedMissions}/{subj.totalMissions}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                          style={{ width: `${subj.completionPercentage}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Filterable Achievement Badges */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-black text-white">Achievement Collection</h2>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: 'all', label: 'All' },
                    { key: 'mastery', label: 'Conqueror & Mastery' },
                    { key: 'streak', label: 'Streaks' },
                    { key: 'exploration', label: 'Exploration' },
                    { key: 'lab', label: 'Virtual Labs' },
                  ] as Array<{ key: CategoryFilter; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCategory(tab.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      category === tab.key
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAchievements.map((ach) => {
                const isRoyal = ach.code.startsWith('CONQUEROR_');
                return (
                  <div
                    key={ach.id}
                    className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                      ach.unlocked
                        ? isRoyal
                          ? 'border-amber-300/80 bg-gradient-to-br from-amber-500/20 to-slate-900/90'
                          : 'border-emerald-400/60 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-900/50 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isRoyal ? (
                            <Crown className="h-5 w-5 text-amber-300" />
                          ) : ach.category === 'streak' ? (
                            <Flame className="h-5 w-5 text-orange-400" />
                          ) : ach.category === 'lab' ? (
                            <FlaskConical className="h-5 w-5 text-purple-400" />
                          ) : ach.category === 'exploration' ? (
                            <Globe2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Award className="h-5 w-5 text-sky-400" />
                          )}
                          <h3 className="text-sm font-black text-white">{ach.name}</h3>
                        </div>
                        {ach.unlocked ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Lock className="h-4 w-4 shrink-0 text-slate-500" />
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-300">{ach.description}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-800/70 pt-2.5 text-[11px] font-bold">
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        <Sparkles className="h-3 w-3" />+{ach.xpBonus} XP
                      </span>
                      <span
                        className={`uppercase tracking-wider ${
                          ach.unlocked ? 'text-emerald-300' : 'text-slate-400'
                        }`}
                      >
                        {ach.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </StudentNavShell>
  );
}
