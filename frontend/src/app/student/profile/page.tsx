'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Compass,
  Flame,
  Palette,
  Save,
  School,
  Settings,
  ShieldCheck,
  Sliders,
  User,
} from 'lucide-react';
import { StudentAvatar } from '@/components/avatar/StudentAvatar';
import { GameButton } from '@/components/game-ui/GameButton';
import { XpProgressBar } from '@/components/game-ui/XpProgressBar';
import { toFriendlyStudentError } from '@/components/game-ui/friendlyError';
import { StudentNavShell } from '@/components/student/StudentNavShell';
import {
  apiClient,
  getCachedDashboard,
  getStoredToken,
  setCachedDashboard,
} from '@/lib/apiClient';
import {
  StudentAchievementItem,
  StudentAvatarState,
  StudentDashboardData,
  StudentProfile,
  SubjectProgressCard,
} from '@/types/student';

const INTEREST_OPTIONS = [
  'Chemistry',
  'Physics',
  'Biology',
  'Mathematics',
  'Robotics',
  'Astronomy',
  'Environmental Science',
  'Coding',
];

type ProfileTab = 'sheet' | 'identity' | 'preferences';

export default function StudentProfilePage() {
  const [dashData, setDashData] = useState<StudentDashboardData | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [avatar, setAvatar] = useState<StudentAvatarState | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('sheet');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!getStoredToken()) {
      setError('Please sign in from Base Camp to view your character sheet.');
      setLoading(false);
      return;
    }

    const cached = getCachedDashboard<StudentDashboardData>();
    if (cached) {
      setDashData(cached);
      setProfile(cached.profile);
      setAvatar(cached.avatar);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const dash = await apiClient.getStudentDashboard();
      setDashData(dash);
      setProfile(dash.profile);
      setAvatar(dash.avatar);
      setCachedDashboard(dash);
    } catch (err) {
      if (!cached) {
        setError(
          toFriendlyStudentError(
            err,
            'We could not load your character sheet right now. Please try again.',
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const toggleInterest = (interest: string) => {
    if (!profile) return;
    const exists = profile.interests.includes(interest);
    setProfile({
      ...profile,
      interests: exists
        ? profile.interests.filter((i) => i !== interest)
        : [...profile.interests, interest],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await apiClient.updateStudentProfile({
        displayName: profile.displayName,
        classGrade: profile.classGrade,
        school: profile.school,
        schoolLocation: profile.schoolLocation ?? '',
        preferredLanguage: profile.preferredLanguage,
        interests: profile.interests,
        learningPreferences: profile.learningPreferences,
        accessibilitySettings: profile.accessibilitySettings,
        leaderboardOptOut: Boolean(profile.leaderboardOptOut),
        showSchoolOnLeaderboard: Boolean(profile.showSchoolOnLeaderboard),
      });
      setProfile(updated);
      const cached = getCachedDashboard<StudentDashboardData>();
      if (cached) {
        const nextDash = { ...cached, profile: updated };
        setDashData(nextDash);
        setCachedDashboard(nextDash);
      }
      setMessage('Character profile & preferences saved!');
    } catch (err) {
      setError(toFriendlyStudentError(err, 'Could not update your profile.'));
    } finally {
      setSaving(false);
    }
  };

  const level = dashData?.xp.level ?? 1;
  const totalXp = dashData?.xp.totalXp ?? 0;
  const currentLevelXp = dashData?.xp.currentLevelXp ?? 0;
  const xpPerLevel = dashData?.xp.xpPerLevel ?? 100;
  const progressPercentage = dashData?.xp.progressPercentage ?? 0;
  const stats = dashData?.statistics;
  const subjectProgress: SubjectProgressCard[] = dashData?.subjectProgress ?? [];
  const achievements: StudentAchievementItem[] = dashData?.achievements ?? [];
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <StudentNavShell
      displayName={profile?.displayName}
      level={level}
      avatar={avatar}
      accessibility={profile?.accessibilitySettings}
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/student/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#233B59] bg-[#0D1B2D] px-3 text-xs font-extrabold text-[#E9DFC7] transition hover:border-[#F5B900]/60 hover:text-[#F5B900]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Base Camp
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#E9DFC7] sm:text-2xl">
              Explorer Identity &amp; Preferences
            </h1>
            <p className="text-xs text-[#E9DFC7]/65">
              Your RPG character record, realm mastery, and personal settings
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        {profile && (
          <div
            role="tablist"
            aria-label="Profile Sections"
            className="flex flex-wrap gap-1.5 rounded-xl border border-[#233B59] bg-[#0D1B2D] p-1"
          >
            {[
              { id: 'sheet' as const, label: 'Character Sheet', icon: Compass },
              { id: 'identity' as const, label: 'Edit Identity', icon: User },
              { id: 'preferences' as const, label: 'Preferences', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                    active
                      ? 'bg-[#F5B900] text-[#071426]'
                      : 'text-[#E9DFC7]/75 hover:bg-[#13253D] hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-2xl bg-[#0D1B2D] lg:col-span-4" />
          <div className="h-96 animate-pulse rounded-2xl bg-[#0D1B2D] lg:col-span-8" />
        </div>
      ) : !profile ? (
        <div className="vq-panel rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-rose-200">{error ?? 'Profile unavailable.'}</p>
          <GameButton variant="gold" size="sm" href="/student/dashboard" className="mt-4">
            Go to Base Camp
          </GameButton>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* LEFT: RPG Hero Identity Card */}
          <aside className="vq-panel flex flex-col items-center rounded-2xl p-5 text-center lg:col-span-4">
            <div className="relative flex w-full flex-col items-center rounded-xl border border-[#1E3350] bg-[#071426] py-3">
              <StudentAvatar
                appearance={avatar?.appearance}
                equippedItems={avatar?.equippedItems}
                size="lg"
                variant="stage"
                reducedMotion={profile.accessibilitySettings?.reducedMotion}
              />
            </div>

            <div className="mt-4 w-full">
              {profile.activeTitle && (
                <span className="inline-block rounded-md border border-[#F5B900]/50 bg-[#2D2100] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#F5B900]">
                  {profile.activeTitle}
                </span>
              )}
              <h2 className="mt-1.5 text-xl font-black text-[#E9DFC7]">
                {profile.displayName}
              </h2>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#E9DFC7]/70">
                <School className="h-3.5 w-3.5 text-[#F5B900]" />
                {profile.classGrade}
                {profile.school ? ` · ${profile.school}` : ''}
              </p>
              {profile.schoolLocation && (
                <p className="mt-0.5 text-[11px] text-[#E9DFC7]/55">
                  {profile.schoolLocation}
                </p>
              )}
            </div>

            <div className="mt-4 w-full border-t border-[#1E3350] pt-4 text-left">
              <XpProgressBar
                level={level}
                totalXp={totalXp}
                currentXp={currentLevelXp}
                xpPerLevel={xpPerLevel}
                progressPercentage={progressPercentage}
              />
            </div>

            {/* Key RPG Counters */}
            {stats && (
              <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-[#1E3350] bg-[#071426] p-2">
                  <p className="text-sm font-black text-[#E9DFC7]">
                    {stats.completedMissions}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-[#E9DFC7]/55">
                    Quests
                  </p>
                </div>
                <div className="rounded-lg border border-[#1E3350] bg-[#071426] p-2">
                  <p className="text-sm font-black text-[#F5B900]">
                    {unlockedAchievements.length}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-[#E9DFC7]/55">
                    Badges
                  </p>
                </div>
                <div className="rounded-lg border border-[#1E3350] bg-[#071426] p-2">
                  <p className="flex items-center justify-center gap-0.5 text-sm font-black text-emerald-300">
                    <Flame className="h-3.5 w-3.5 text-[#F5B900]" />
                    {stats.currentStreakDays}d
                  </p>
                  <p className="text-[10px] font-bold uppercase text-[#E9DFC7]/55">
                    Streak
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex w-full gap-2">
              <GameButton variant="navy" size="sm" href="/student/avatar" className="flex-1">
                <Palette className="h-3.5 w-3.5 text-[#F5B900]" />
                Wardrobe
              </GameButton>
              <GameButton variant="navy" size="sm" href="/student/achievements" className="flex-1">
                <Award className="h-3.5 w-3.5 text-[#F5B900]" />
                Badges
              </GameButton>
            </div>

            <div className="mt-4 flex w-full items-center gap-2 rounded-lg border border-[#1E3350] bg-[#071426] p-2.5 text-left text-[11px] text-[#E9DFC7]/65">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Account email, role, and XP records are protected server-side.</span>
            </div>
          </aside>

          {/* RIGHT: Tabbed Character Sheet / Identity Form / Preferences */}
          <div className="lg:col-span-8">
            {activeTab === 'sheet' && (
              <div className="space-y-5">
                {/* Subject Mastery */}
                <section className="vq-panel rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#F5B900]" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#E9DFC7]">
                        Subject Mastery
                      </h3>
                    </div>
                    <Link
                      href="/world"
                      className="text-xs font-extrabold text-[#F5B900] hover:underline"
                    >
                      Explore Realms
                    </Link>
                  </div>

                  {subjectProgress.length === 0 ? (
                    <p className="text-xs text-[#E9DFC7]/65">
                      Start a quest in the World Map to build your subject mastery!
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {subjectProgress.map((subj) => (
                        <div
                          key={subj.id}
                          className="rounded-xl border border-[#1E3350] bg-[#071426] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-[#E9DFC7]">
                              {subj.name}
                            </span>
                            <span className="rounded bg-[#13253D] px-2 py-0.5 text-[10px] font-bold text-[#F5B900]">
                              {subj.levelLabel}
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#13253D]">
                            <div
                              className="h-full bg-[#F5B900]"
                              style={{ width: `${subj.completionPercentage}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] font-semibold text-[#E9DFC7]/60">
                            {subj.completedMissions} / {subj.totalMissions} quests ({subj.completionPercentage}%)
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Achievements Showcase */}
                <section className="vq-panel rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#F5B900]" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#E9DFC7]">
                        Achievements ({unlockedAchievements.length}/{achievements.length})
                      </h3>
                    </div>
                    <Link
                      href="/student/achievements"
                      className="text-xs font-extrabold text-[#F5B900] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  {unlockedAchievements.length === 0 ? (
                    <p className="text-xs text-[#E9DFC7]/65">
                      No badges unlocked yet. Complete quests and daily bounties to earn your first medal!
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {unlockedAchievements.slice(0, 4).map((ach) => (
                        <div
                          key={ach.id}
                          className="flex items-start gap-2.5 rounded-xl border border-[#F5B900]/35 bg-[#071426] p-3"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2D2100] text-[#F5B900]">
                            <Award className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-[#E9DFC7]">
                              {ach.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-[#E9DFC7]/65">
                              {ach.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {(activeTab === 'identity' || activeTab === 'preferences') && (
              <form
                onSubmit={(e) => void handleSave(e)}
                className="vq-panel space-y-5 rounded-2xl p-5 sm:p-6"
              >
                {activeTab === 'identity' && (
                  <>
                    <div className="flex items-center gap-2 border-b border-[#1E3350] pb-3">
                      <User className="h-4 w-4 text-[#F5B900]" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#E9DFC7]">
                        Explorer Identity &amp; School
                      </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#E9DFC7]/85">
                          Display Name
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          value={profile.displayName}
                          onChange={(e) =>
                            setProfile({ ...profile, displayName: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#233B59] bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#F5B900] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#E9DFC7]/85">
                          Class / Grade
                        </label>
                        <input
                          type="text"
                          required
                          value={profile.classGrade}
                          onChange={(e) =>
                            setProfile({ ...profile, classGrade: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#233B59] bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#F5B900] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#E9DFC7]/85">
                          School Name{' '}
                          <span className="text-[10px] font-normal text-[#E9DFC7]/55">
                            (for School Leaderboard)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={profile.school}
                          placeholder="Enter your school name"
                          onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                          className="w-full rounded-xl border border-[#233B59] bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#F5B900] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#E9DFC7]/85">
                          School Location{' '}
                          <span className="text-[10px] font-normal text-[#E9DFC7]/55">
                            (City / State)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={profile.schoolLocation ?? ''}
                          placeholder="e.g., Jaipur, Rajasthan"
                          onChange={(e) =>
                            setProfile({ ...profile, schoolLocation: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#233B59] bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#F5B900] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#E9DFC7]/85">
                          Preferred Language
                        </label>
                        <select
                          value={profile.preferredLanguage}
                          onChange={(e) =>
                            setProfile({ ...profile, preferredLanguage: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#233B59] bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#F5B900] focus:outline-none"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Tamil">Tamil</option>
                          <option value="Telugu">Telugu</option>
                          <option value="Bengali">Bengali</option>
                        </select>
                      </div>
                    </div>

                    {/* Learning Interests */}
                    <div>
                      <p className="mb-2 text-xs font-bold text-[#E9DFC7]/85">
                        Learning Interests
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((interest) => {
                          const selected = profile.interests.includes(interest);
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => toggleInterest(interest)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                                selected
                                  ? 'border-[#F5B900] bg-[#F5B900]/20 text-[#F5B900]'
                                  : 'border-[#233B59] bg-[#071426] text-[#E9DFC7]/70 hover:text-white'
                              }`}
                            >
                              {interest}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'preferences' && (
                  <>
                    <div className="flex items-center gap-2 border-b border-[#1E3350] pb-3">
                      <Sliders className="h-4 w-4 text-[#F5B900]" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#E9DFC7]">
                        Learning, Accessibility &amp; Privacy
                      </h3>
                    </div>

                    {/* Learning & Accessibility */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#E9DFC7]/85">
                          Learning Pace
                        </label>
                        <select
                          value={profile.learningPreferences.pace}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              learningPreferences: {
                                ...profile.learningPreferences,
                                pace: e.target.value as 'relaxed' | 'balanced' | 'fast',
                              },
                            })
                          }
                          className="w-full rounded-xl border border-[#233B59] bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#F5B900] focus:outline-none"
                        >
                          <option value="relaxed">Relaxed</option>
                          <option value="balanced">Balanced</option>
                          <option value="fast">Fast</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#E9DFC7]/85">
                          Font Size
                        </label>
                        <select
                          value={profile.accessibilitySettings.fontSize}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              accessibilitySettings: {
                                ...profile.accessibilitySettings,
                                fontSize: e.target.value as 'small' | 'medium' | 'large',
                              },
                            })
                          }
                          className="w-full rounded-xl border border-[#233B59] bg-[#071426] px-3 py-2 text-sm text-white focus:border-[#F5B900] focus:outline-none"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2.5 rounded-xl border border-[#1E3350] bg-[#071426] p-3 text-xs font-bold text-[#E9DFC7]">
                        <input
                          type="checkbox"
                          checked={profile.accessibilitySettings.highContrast}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              accessibilitySettings: {
                                ...profile.accessibilitySettings,
                                highContrast: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded accent-[#F5B900]"
                        />
                        High Contrast Mode
                      </label>

                      <label className="flex items-center gap-2.5 rounded-xl border border-[#1E3350] bg-[#071426] p-3 text-xs font-bold text-[#E9DFC7]">
                        <input
                          type="checkbox"
                          checked={profile.accessibilitySettings.reducedMotion}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              accessibilitySettings: {
                                ...profile.accessibilitySettings,
                                reducedMotion: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded accent-[#F5B900]"
                        />
                        Reduced Motion
                      </label>
                    </div>

                    {/* Leaderboard Privacy */}
                    <div className="space-y-3 border-t border-[#1E3350] pt-4">
                      <p className="text-xs font-black uppercase tracking-wider text-[#F5B900]">
                        Leaderboard Privacy
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-start gap-2.5 rounded-xl border border-[#1E3350] bg-[#071426] p-3 text-xs font-bold text-[#E9DFC7]">
                          <input
                            type="checkbox"
                            checked={Boolean(profile.leaderboardOptOut)}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                leaderboardOptOut: e.target.checked,
                              })
                            }
                            className="mt-0.5 h-4 w-4 rounded accent-[#F5B900]"
                          />
                          <span>
                            Opt out of public leaderboards
                            <span className="mt-0.5 block text-[11px] font-normal text-[#E9DFC7]/60">
                              Hide your name and avatar from Global, School, Class, and Subject rankings.
                            </span>
                          </span>
                        </label>

                        <label className="flex items-start gap-2.5 rounded-xl border border-[#1E3350] bg-[#071426] p-3 text-xs font-bold text-[#E9DFC7]">
                          <input
                            type="checkbox"
                            checked={Boolean(profile.showSchoolOnLeaderboard)}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                showSchoolOnLeaderboard: e.target.checked,
                              })
                            }
                            className="mt-0.5 h-4 w-4 rounded accent-[#F5B900]"
                          />
                          <span>
                            Show school on leaderboard
                            <span className="mt-0.5 block text-[11px] font-normal text-[#E9DFC7]/60">
                              Display your school name next to your rank.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {message && (
                  <p className="text-xs font-bold text-emerald-300">{message}</p>
                )}
                {error && <p className="text-xs font-bold text-rose-300">{error}</p>}

                <div className="flex justify-end border-t border-[#1E3350] pt-4">
                  <GameButton type="submit" variant="gold" size="md" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </GameButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </StudentNavShell>
  );
}
