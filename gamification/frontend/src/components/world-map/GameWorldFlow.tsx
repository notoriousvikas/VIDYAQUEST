'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Code2,
  Compass,
  FlaskConical,
  Globe2,
  Leaf,
  LogIn,
  LogOut,
  Sigma,
  Sparkles,
  Swords,
} from 'lucide-react';
import { SIMULATOR_SUBJECTS } from '@/data/worldMapData';
import {
  AuthUser,
  apiClient,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
} from '@/lib/apiClient';
import { SubjectSummary } from '@/types/worldMap';

const AuthModal = dynamic(() => import('./AuthModal').then((m) => m.AuthModal), {
  ssr: false,
});

const WorldMapCanvas = dynamic(
  () => import('./WorldMapCanvas').then((m) => m.WorldMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0b1f2e] text-amber-300 text-sm font-bold">
        Loading World Map...
      </div>
    ),
  },
);

type FlowStage = 'enter-world' | 'select-subject' | 'playing-map';

const SUBJECT_CARD_STYLES: Record<
  string,
  { border: string; glow: string; badge: string; button: string }
> = {
  chemistry: {
    border: 'border-purple-400/70 hover:border-purple-300',
    glow: 'from-purple-500/20 via-slate-950/90 to-slate-950',
    badge: 'bg-purple-500/20 text-purple-200 border-purple-400/50',
    button: 'from-purple-400 to-purple-600 border-purple-200 text-slate-950',
  },
  physics: {
    border: 'border-sky-400/70 hover:border-sky-300',
    glow: 'from-sky-500/20 via-slate-950/90 to-slate-950',
    badge: 'bg-sky-500/20 text-sky-200 border-sky-400/50',
    button: 'from-sky-400 to-cyan-500 border-sky-200 text-slate-950',
  },
  biology: {
    border: 'border-emerald-400/70 hover:border-emerald-300',
    glow: 'from-emerald-500/20 via-slate-950/90 to-slate-950',
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
    button: 'from-emerald-400 to-emerald-600 border-emerald-200 text-slate-950',
  },
  mathematics: {
    border: 'border-amber-400/70 hover:border-amber-300',
    glow: 'from-amber-500/20 via-slate-950/90 to-slate-950',
    badge: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
    button: 'from-amber-300 to-amber-500 border-amber-100 text-slate-950',
  },
  coding: {
    border: 'border-cyan-400/70 hover:border-cyan-300',
    glow: 'from-cyan-500/20 via-slate-950/90 to-slate-950',
    badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50',
    button: 'from-cyan-300 to-cyan-500 border-cyan-100 text-slate-950',
  },
};

function renderSubjectIcon(icon: string, className = 'h-6 w-6') {
  switch (icon) {
    case 'flask-conical':
      return <FlaskConical className={className} />;
    case 'atom':
      return <Atom className={className} />;
    case 'leaf':
      return <Leaf className={className} />;
    case 'sigma':
      return <Sigma className={className} />;
    case 'code-2':
      return <Code2 className={className} />;
    default:
      return <Globe2 className={className} />;
  }
}

export function GameWorldFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<FlowStage>('enter-world');
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState<string>('chemistry');
  const [subjects, setSubjects] = useState<SubjectSummary[]>(SIMULATOR_SUBJECTS);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadSubjects = useCallback(async () => {
    try {
      const list = await apiClient.getSubjects();
      if (list.length > 0) setSubjects(list);
    } catch {
      // Keep local simulator subjects if backend is offline
      setSubjects(SIMULATOR_SUBJECTS);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const subjectParam = params.get('subject');
      if (subjectParam) {
        setSelectedSubjectSlug(subjectParam);
        setStage('playing-map');
      }
    }
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      setAuthUser(user);
      void loadSubjects();
    }
  }, [loadSubjects]);

  const handleEnterGameWorld = () => {
    if (authUser) {
      void loadSubjects();
    }
    setStage('select-subject');
  };

  const handleChooseSubject = (slug: string) => {
    setSelectedSubjectSlug(slug);
    setStage('playing-map');
  };

  const handleSignOut = () => {
    clearAuthSession();
    setAuthUser(null);
    setSubjects(SIMULATOR_SUBJECTS);
  };

  if (stage === 'playing-map') {
    return (
      <WorldMapCanvas
        initialSubjectSlug={selectedSubjectSlug}
        onBackToSubjects={() => {
          if (authUser) void loadSubjects();
          setStage('select-subject');
        }}
      />
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-y-auto bg-[#0f293a] px-4 py-10 text-slate-100">
      {/* Pixel-art Overworld Backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-30 blur-[2px]"
        style={{
          backgroundImage: "url('/assets/vidyaquest-world-map.jpg')",
          imageRendering: 'pixelated',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/90"
      />

      {/* Top Auth Bar */}
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        {authUser ? (
          <>
            <Link
              href="/student/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-amber-300/70 bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-105"
            >
              <span>Student Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-400/60 bg-slate-950/85 px-3 py-2 text-xs font-bold text-emerald-300 shadow-lg backdrop-blur-md hover:bg-slate-900"
            >
              <span>{authUser.name}</span>
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300/70 bg-slate-950/85 px-3.5 py-2 text-xs font-extrabold text-amber-200 shadow-lg backdrop-blur-md hover:bg-slate-900"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Student Sign In</span>
          </button>
        )}
      </div>

      {/* Stage 1: Enter GameWorld Gate */}
      {stage === 'enter-world' && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex max-w-xl flex-col items-center rounded-3xl border-2 border-amber-300/80 bg-slate-950/85 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-10"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-emerald-300">
            <Compass className="h-3.5 w-3.5" />
            Interactive Adventure Learning
          </span>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            VIDYA<span className="text-amber-300">QUEST</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Step into a living 2D pixel-art world. Choose your subject realm, conquer interactive quests, earn stars, and unlock new territories.
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleEnterGameWorld}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-amber-100 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 px-7 py-3.5 text-base font-black uppercase tracking-wide text-slate-950 shadow-[0_4px_0_#78350f] transition hover:brightness-105 active:translate-y-0.5"
            >
              <Swords className="h-5 w-5" />
              Enter GameWorld
              <ArrowRight className="h-5 w-5" />
            </button>

            {!authUser && (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-400/60 bg-slate-900/90 px-5 py-3.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/15"
              >
                <LogIn className="h-4 w-4" />
                Sign In to Save Progress
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Stage 2: Subject World Selection Hub */}
      {stage === 'select-subject' && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 w-full max-w-5xl"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => setStage('enter-world')}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Gate
              </button>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Choose Your Subject World
              </h2>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                Each subject opens its own themed realm, locations, and independent mission progression.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/60 bg-slate-950/85 px-3.5 py-2 text-xs font-bold text-amber-200">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>{authUser ? `Synced: ${authUser.name}` : 'Explorer Simulator Mode'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {subjects.map((subj) => {
              const style = SUBJECT_CARD_STYLES[subj.slug] ?? SUBJECT_CARD_STYLES.chemistry;
              return (
                <motion.div
                  key={subj.id}
                  whileHover={{ y: -4 }}
                  className={`flex flex-col justify-between rounded-2xl border-2 bg-gradient-to-br p-5 shadow-2xl backdrop-blur-md transition ${style.border} ${style.glow}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider ${style.badge}`}
                      >
                        {renderSubjectIcon(subj.icon, 'h-4 w-4')}
                        {subj.name}
                      </span>
                      <span className="rounded-md bg-slate-900/90 px-2 py-1 text-xs font-bold text-amber-300">
                        {subj.completionPercentage}% Complete
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black text-white">
                      {subj.map?.mapName ?? `${subj.name} World`}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                      {subj.description}
                    </p>
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${subj.completionPercentage}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChooseSubject(subj.slug)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 bg-gradient-to-b px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide shadow-md transition hover:brightness-105 ${style.button}`}
                    >
                      <span>Enter {subj.map?.mapName ?? subj.name}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={(user) => {
          setAuthUser(user);
          void loadSubjects();
          router.push('/student/dashboard');
        }}
      />
    </div>
  );
}
