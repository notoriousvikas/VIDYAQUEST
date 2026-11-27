'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Star,
} from 'lucide-react';
import {
  SIMULATOR_MAPS_BY_SUBJECT,
  SIMULATOR_SUBJECTS,
} from '@/data/worldMapData';
import { getSubjectMapConfig } from '@/data/subjectMaps';
import { DEFAULT_MAP_TEMPLATE_CONFIG } from '@/data/worldMapTemplate';
import {
  ApiError,
  AuthUser,
  apiClient,
  clearAuthSession,
  getCachedDashboard,
  getStoredToken,
  getStoredUser,
} from '@/lib/apiClient';
import {
  ConquerorEventPayload,
  StudentAvatarState,
  StudentDashboardData,
} from '@/types/student';
import {
  BackendMissionStatus,
  LevelNode,
  LevelStatus,
  RegionInfo,
  SubjectMapResponse,
  SubjectSummary,
} from '@/types/worldMap';
import { AuthModal } from './AuthModal';
import { GameplayStage } from './GameplayStage';
import { LevelInfoPanel } from './LevelInfoPanel';
import { LevelVictoryPayload, RpgCelebrationOverlay } from './RpgCelebrationOverlay';
import { WorldMapLevelItem, WorldMapTemplate } from './WorldMapTemplate';

const DEFAULT_MAP_IMAGE_URL = '/assets/vidyaquest-world-map.jpg';

function mapBackendStatus(
  status: BackendMissionStatus,
  isCurrentMission: boolean,
): LevelStatus {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'IN_PROGRESS') return 'in_progress';
  if (status === 'AVAILABLE') return isCurrentMission ? 'current' : 'unlocked';
  return 'locked';
}

function renderSubjectIcon(icon: string) {
  switch (icon) {
    case 'flask-conical':
      return <FlaskConical className="h-3.5 w-3.5" />;
    case 'atom':
      return <Atom className="h-3.5 w-3.5" />;
    case 'leaf':
      return <Leaf className="h-3.5 w-3.5" />;
    case 'sigma':
      return <Sigma className="h-3.5 w-3.5" />;
    case 'code-2':
      return <Code2 className="h-3.5 w-3.5" />;
    default:
      return <Globe2 className="h-3.5 w-3.5" />;
  }
}

export interface WorldMapCanvasProps {
  initialSubjectSlug?: string;
  onBackToSubjects?: () => void;
}

export function WorldMapCanvas({
  initialSubjectSlug = 'chemistry',
  onBackToSubjects,
}: WorldMapCanvasProps) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectSummary[]>(SIMULATOR_SUBJECTS);
  const [activeSubjectSlug, setActiveSubjectSlug] = useState<string>(initialSubjectSlug);
  const [backendMap, setBackendMap] = useState<SubjectMapResponse | null>(null);
  const [localMapsBySubject, setLocalMapsBySubject] = useState<Record<string, SubjectMapResponse>>(
    SIMULATOR_MAPS_BY_SUBJECT,
  );
  const [localTotalXp, setLocalTotalXp] = useState<number>(0);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [selectedLevel, setSelectedLevel] = useState<{
    level: LevelNode;
    status: LevelStatus;
  } | null>(null);
  const [activeGameplayLevel, setActiveGameplayLevel] = useState<LevelNode | null>(null);
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);
  const [studentAvatar, setStudentAvatar] = useState<StudentAvatarState | null>(null);
  const [levelVictory, setLevelVictory] = useState<LevelVictoryPayload | null>(null);
  const [conquerorEvent, setConquerorEvent] = useState<ConquerorEventPayload | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!authUser) {
      setStudentAvatar(null);
      return;
    }
    const cached = getCachedDashboard<StudentDashboardData>();
    if (cached?.avatar) {
      setStudentAvatar(cached.avatar);
    }
    void apiClient
      .getStudentAvatar()
      .then(setStudentAvatar)
      .catch(() => undefined);
  }, [authUser]);

  const activeMapPayload =
    backendMap ??
    localMapsBySubject[activeSubjectSlug] ??
    localMapsBySubject.chemistry;

  const subjectMapCfg = getSubjectMapConfig(activeSubjectSlug);
  const mapConfig = activeMapPayload.map.mapConfiguration;
  const mapWidth = mapConfig.width ?? subjectMapCfg.dimensions.width ?? DEFAULT_MAP_TEMPLATE_CONFIG.width;
  const mapHeight = mapConfig.height ?? subjectMapCfg.dimensions.height ?? DEFAULT_MAP_TEMPLATE_CONFIG.height;
  const backendBg = activeMapPayload.map.backgroundAsset;
  const mapImageUrl =
    backendBg && backendBg !== DEFAULT_MAP_IMAGE_URL
      ? backendBg
      : subjectMapCfg.backgroundAsset;
  const oceanColor = subjectMapCfg.oceanColor ?? activeMapPayload.map.theme.oceanColor ?? '#1b5e7a';

  const loadBackendSubjectMap = useCallback(
    async (subjectSlug: string) => {
      setIsLoadingMap(true);
      setMapError(null);
      try {
        const [subjectList, mapPayload] = await Promise.all([
          apiClient.getSubjects(),
          apiClient.getSubjectMap(subjectSlug),
        ]);
        setSubjects(subjectList);
        setBackendMap(mapPayload);
        setActiveSubjectSlug(mapPayload.subject.slug);
        setSelectedLevel(null);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.code === 'TOKEN_INVALID')) {
          clearAuthSession();
          setAuthUser(null);
          setBackendMap(null);
          showToast('Session expired. Please sign in again.');
          setIsAuthModalOpen(true);
        } else {
          setMapError(
            err instanceof Error
              ? err.message
              : 'Could not load subject map from backend. Using local simulator.',
          );
        }
      } finally {
        setIsLoadingMap(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    setActiveSubjectSlug(initialSubjectSlug);
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      setAuthUser(user);
      void loadBackendSubjectMap(initialSubjectSlug);
    }
  }, [initialSubjectSlug, loadBackendSubjectMap]);

  const activeRegions: RegionInfo[] = useMemo(() => {
    return activeMapPayload.zones.map((z) => ({
      id: z.id,
      name: z.name,
      subtitle: z.description,
      xPercent: z.positionX,
      yPercent: z.positionY,
      accentColor: z.accentColor,
      completionPercentage: z.completionPercentage,
      status: z.status,
    }));
  }, [activeMapPayload]);

  const activeLevels: WorldMapLevelItem[] = useMemo(() => {
    const coordBySeq = new Map(
      subjectMapCfg.levelCoordinates.map((c) => [c.sequence, c]),
    );
    const useConfigCoords =
      !backendMap || activeMapPayload.map.backgroundAsset === DEFAULT_MAP_IMAGE_URL;

    return activeMapPayload.missions.map((m) => {
      const cfgCoord = coordBySeq.get(m.sequence);
      return {
        level: {
          id: m.id,
          levelNumber: m.sequence,
          title: m.title,
          regionId: m.locationId,
          regionName: m.locationName,
          description: m.description,
          objectives: m.learningObjectives,
          difficulty: m.difficulty,
          missionType: m.missionType,
          xpReward: m.xpReward,
          xPercent: useConfigCoords && cfgCoord ? cfgCoord.xPercent : m.positionX,
          yPercent: useConfigCoords && cfgCoord ? cfgCoord.yPercent : m.positionY,
          prerequisites: m.prerequisites,
          attempts: m.attempts,
          bestScore: m.bestScore,
        },
        status: mapBackendStatus(m.status, activeMapPayload.progress.currentMissionId === m.id),
        stars: m.stars,
      };
    });
  }, [activeMapPayload, backendMap, subjectMapCfg]);

  const handleSelectLevel = useCallback(
    (level: LevelNode, status: LevelStatus) => {
      if (status === 'locked') {
        showToast(
          level.levelNumber > 1
            ? `Level ${level.levelNumber} is locked! Complete Level ${level.levelNumber - 1} first.`
            : `Level ${level.levelNumber} is locked!`,
        );
        return;
      }
      setSelectedLevel({ level, status });
    },
    [showToast],
  );

  const applyLevelCompletion = useCallback(
    async (level: LevelNode, stars: 1 | 2 | 3) => {
      if (backendMap && authUser) {
        const score = stars === 3 ? 95 : stars === 2 ? 78 : 60;
        setIsSimulatingRun(true);
        try {
          const result = await apiClient.completeMission(level.id, score);
          setBackendMap(result.map);
          setSelectedLevel((prev) =>
            prev && prev.level.id === level.id ? { ...prev, status: 'completed' } : prev,
          );
          const updatedSubjects = await apiClient.getSubjects();
          setSubjects(updatedSubjects);

          const nextMission = result.map.missions.find(
            (m) => m.sequence === level.levelNumber + 1 && m.status !== 'LOCKED',
          );

          setLevelVictory({
            levelNumber: level.levelNumber,
            levelTitle: level.title,
            subjectName: result.map.subject.name,
            starsEarned: result.starsEarned,
            xpEarned: result.xpAwarded,
            alreadyCompleted: result.alreadyCompleted,
            unlockedClothingRewards: result.unlockedClothingRewards ?? [],
            nextLevel: nextMission
              ? { levelNumber: nextMission.sequence, title: nextMission.title }
              : null,
          });

          if (result.conquerorEvent?.triggered) {
            setConquerorEvent(result.conquerorEvent);
          }
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Failed to complete mission');
        } finally {
          setIsSimulatingRun(false);
        }
        return;
      }

      const currentMap = localMapsBySubject[activeSubjectSlug] ?? SIMULATOR_MAPS_BY_SUBJECT.chemistry;
      const targetMission = currentMap.missions.find((m) => m.id === level.id);
      const alreadyCompleted = targetMission?.status === 'COMPLETED';
      const xpGained = alreadyCompleted ? 0 : level.xpReward;

      setLocalMapsBySubject((prev) => {
        const subjectMap = prev[activeSubjectSlug] ?? currentMap;
        const completedIds = new Set(
          subjectMap.missions
            .filter((m) => m.status === 'COMPLETED' || m.id === level.id)
            .map((m) => m.id),
        );

        const nextMissions = subjectMap.missions.map((m) => {
          if (m.id === level.id) {
            return {
              ...m,
              status: 'COMPLETED' as const,
              stars: Math.max(m.stars, stars) as 0 | 1 | 2 | 3,
              attempts: m.attempts + 1,
              bestScore: Math.max(m.bestScore, stars === 3 ? 95 : stars === 2 ? 78 : 60),
            };
          }
          const allPriorCompleted = subjectMap.missions
            .filter((other) => other.sequence < m.sequence)
            .every((other) => completedIds.has(other.id));
          if (
            m.status === 'LOCKED' &&
            allPriorCompleted &&
            m.prerequisites.every((p) => completedIds.has(p))
          ) {
            return { ...m, status: 'AVAILABLE' as const };
          }
          return m;
        });

        const nextZones = subjectMap.zones.map((z) => {
          const zMissions = nextMissions.filter((m) => m.locationId === z.id);
          const zDone = zMissions.filter((m) => m.status === 'COMPLETED').length;
          const zTotal = zMissions.length;
          const zPct = zTotal > 0 ? Math.round((zDone / zTotal) * 100) : 0;
          return {
            ...z,
            completedMissions: zDone,
            completionPercentage: zPct,
            status: (zTotal > 0 && zDone === zTotal
              ? 'COMPLETED'
              : zMissions.some((m) => m.status !== 'LOCKED')
                ? 'UNLOCKED'
                : 'LOCKED') as 'LOCKED' | 'UNLOCKED' | 'COMPLETED',
          };
        });

        const nextDone = nextMissions.filter((m) => m.status === 'COMPLETED').length;
        const nextCurrent =
          nextMissions.find((m) => m.status === 'AVAILABLE') ??
          nextMissions[nextMissions.length - 1];

        return {
          ...prev,
          [activeSubjectSlug]: {
            ...subjectMap,
            zones: nextZones,
            missions: nextMissions,
            progress: {
              ...subjectMap.progress,
              completedMissions: nextDone,
              completionPercentage: Math.round((nextDone / nextMissions.length) * 100),
              currentMissionId: nextCurrent?.id ?? null,
            },
          },
        };
      });

      if (xpGained > 0) {
        setLocalTotalXp((prev) => prev + xpGained);
      }

      setSelectedLevel((prev) =>
        prev && prev.level.id === level.id ? { ...prev, status: 'completed' } : prev,
      );
      setLevelVictory({
        levelNumber: level.levelNumber,
        levelTitle: level.title,
        starsEarned: stars,
        xpEarned: xpGained,
        alreadyCompleted,
        nextLevel: null,
      });
    },
    [activeSubjectSlug, authUser, backendMap, localMapsBySubject, showToast],
  );

  const handleStartLevel = useCallback(
    async (level: LevelNode) => {
      if (backendMap && authUser) {
        try {
          await apiClient.startMission(level.id);
          void loadBackendSubjectMap(activeSubjectSlug);
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Could not start mission');
          return;
        }
      } else {
        setLocalMapsBySubject((prev) => {
          const currentMap = prev[activeSubjectSlug];
          if (!currentMap) return prev;
          return {
            ...prev,
            [activeSubjectSlug]: {
              ...currentMap,
              missions: currentMap.missions.map((m) =>
                m.id === level.id && m.status !== 'COMPLETED'
                  ? { ...m, status: 'IN_PROGRESS', attempts: m.attempts + 1 }
                  : m,
              ),
            },
          };
        });
      }

      setSelectedLevel(null);
      setActiveGameplayLevel(level);
    },
    [activeSubjectSlug, authUser, backendMap, loadBackendSubjectMap, showToast],
  );

  const handleResetSimulation = useCallback(() => {
    if (backendMap) {
      void loadBackendSubjectMap(activeSubjectSlug);
      showToast('Synced latest progression from backend.');
      return;
    }
    setLocalMapsBySubject(SIMULATOR_MAPS_BY_SUBJECT);
    setLocalTotalXp(0);
    setSelectedLevel(null);
    showToast('Simulator progress reset.');
  }, [activeSubjectSlug, backendMap, loadBackendSubjectMap, showToast]);

  const handleSignOut = useCallback(() => {
    clearAuthSession();
    setAuthUser(null);
    setBackendMap(null);
    setSubjects(SIMULATOR_SUBJECTS);
    setSelectedLevel(null);
    showToast('Signed out. Switched to offline simulator mode.');
  }, [showToast]);

  const totalXp = backendMap ? backendMap.progress.totalXp : localTotalXp;
  const playerLevel = backendMap ? backendMap.progress.level : Math.floor(totalXp / 100) + 1;
  const totalStars = useMemo(
    () => activeLevels.reduce((sum, item) => sum + item.stars, 0),
    [activeLevels],
  );

  if (activeGameplayLevel) {
    return (
      <GameplayStage
        level={activeGameplayLevel}
        subjectName={activeMapPayload.subject.name}
        isCompleting={isSimulatingRun}
        onBackToMap={() => setActiveGameplayLevel(null)}
        onCompleteLevel={async (lvl, stars) => {
          await applyLevelCompletion(lvl, stars);
          setActiveGameplayLevel(null);
        }}
        onLabCompleted={async (lvl, res) => {
          const result = res.completionResult;
          setBackendMap(result.map);
          setSelectedLevel((prev) =>
            prev && prev.level.id === lvl.id ? { ...prev, status: 'completed' } : prev,
          );
          const updatedSubjects = await apiClient.getSubjects().catch(() => null);
          if (updatedSubjects) setSubjects(updatedSubjects);

          const nextMission = result.map.missions.find(
            (m) => m.sequence === lvl.levelNumber + 1 && m.status !== 'LOCKED',
          );

          setLevelVictory({
            levelNumber: lvl.levelNumber,
            levelTitle: lvl.title,
            subjectName: result.map.subject.name,
            starsEarned: result.starsEarned,
            xpEarned: result.xpAwarded,
            alreadyCompleted: result.alreadyCompleted,
            unlockedClothingRewards: result.unlockedClothingRewards ?? [],
            nextLevel: nextMission
              ? { levelNumber: nextMission.sequence, title: nextMission.title }
              : null,
          });

          if (result.conquerorEvent?.triggered) {
            setConquerorEvent(result.conquerorEvent);
          }
          setActiveGameplayLevel(null);
        }}
      />
    );
  }

  const topHud = (
    <div
      className="fixed left-3 right-3 top-3 z-40 flex flex-wrap items-center justify-between gap-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-amber-300/80 bg-slate-950/85 px-3 py-1.5 text-slate-100 shadow-xl backdrop-blur-md sm:px-3.5 sm:py-2">
        {onBackToSubjects && (
          <>
            <button
              type="button"
              onClick={onBackToSubjects}
              className="flex items-center gap-1 rounded-lg border border-amber-300/60 bg-amber-500/15 px-2 py-1 text-xs font-extrabold text-amber-200 transition hover:bg-amber-500/30 sm:px-2.5"
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>All Worlds</span>
            </button>
            <span className="h-4 w-px bg-slate-700" />
          </>
        )}
        <div className="flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-extrabold tracking-wide text-white sm:text-sm">
            {activeMapPayload.map.mapName}
          </span>
        </div>
        <span className="h-4 w-px bg-slate-700" />
        <span className="text-xs font-bold text-emerald-300">Lv.{playerLevel}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          {totalXp} XP
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-200">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-300" />
          {totalStars} / {activeLevels.length * 3}
        </span>
      </div>

      <div className="flex max-w-full flex-wrap items-center gap-1.5">
        {subjects.length > 0 && (
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-amber-300/60 bg-slate-950/85 p-1 shadow-xl backdrop-blur-md">
            {subjects.map((subj) => {
              const isActive = subj.slug === activeSubjectSlug;
              const pct =
                backendMap && subj.slug === activeSubjectSlug
                  ? backendMap.progress.completionPercentage
                  : authUser
                    ? subj.completionPercentage
                    : (localMapsBySubject[subj.slug]?.progress.completionPercentage ?? 0);
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => {
                    if (authUser) {
                      void loadBackendSubjectMap(subj.slug);
                    } else {
                      setActiveSubjectSlug(subj.slug);
                      setSelectedLevel(null);
                    }
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {renderSubjectIcon(subj.icon)}
                  <span>{subj.name}</span>
                  <span className="opacity-75">{pct}%</span>
                </button>
              );
            })}
          </div>
        )}

        {authUser ? (
          <>
            <Link
              href="/student/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-amber-300/70 bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-xl transition hover:brightness-105"
            >
              <span>Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              title={`Signed in as ${authUser.name} (Click to sign out)`}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-400/60 bg-slate-950/85 px-3 py-2 text-xs font-bold text-emerald-300 shadow-xl backdrop-blur-md transition hover:bg-slate-900"
            >
              <span>{authUser.name}</span>
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-emerald-300/80 bg-slate-950/90 px-3 py-2 text-xs font-extrabold text-emerald-300 shadow-xl backdrop-blur-md transition hover:bg-emerald-500/20"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In / Sync Worlds</span>
          </button>
        )}
      </div>
    </div>
  );

  const banners = (
    <>
      {isLoadingMap && (
        <div className="fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-lg border border-sky-400/70 bg-slate-950/90 px-4 py-2 text-xs font-bold text-sky-200 shadow-xl">
          Loading {activeSubjectSlug} world...
        </div>
      )}

      {mapError && (
        <div className="fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-lg border border-rose-400/70 bg-slate-950/95 px-4 py-2 text-xs font-bold text-rose-200 shadow-xl">
          {mapError}
        </div>
      )}
    </>
  );

  return (
    <>
    <WorldMapTemplate
      mapKey={activeMapPayload.map.id}
      mapName={backendMap?.map.mapName ?? activeMapPayload.map.mapName}
      mapImageUrl={mapImageUrl}
      mapWidth={mapWidth}
      mapHeight={mapHeight}
      minScale={mapConfig.minScale ?? DEFAULT_MAP_TEMPLATE_CONFIG.minScale}
      maxScale={mapConfig.maxScale ?? DEFAULT_MAP_TEMPLATE_CONFIG.maxScale}
      defaultCenterX={mapConfig.defaultCenterX ?? DEFAULT_MAP_TEMPLATE_CONFIG.defaultCenterX}
      defaultCenterY={mapConfig.defaultCenterY ?? DEFAULT_MAP_TEMPLATE_CONFIG.defaultCenterY}
      oceanColor={oceanColor}
      borderVariant={subjectMapCfg.borderVariant}
      regions={activeRegions}
      landmarks={subjectMapCfg.landmarks}
      levels={activeLevels}
      selectedLevelId={selectedLevel?.level.id ?? null}
      onSelectLevel={handleSelectLevel}
      topHud={topHud}
      banners={banners}
      onResetAction={handleResetSimulation}
      resetActionTitle={backendMap ? 'Refresh Map from Backend' : 'Reset Simulator Progress'}
    >
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-lg border border-amber-300/80 bg-slate-950/95 px-4 py-2 text-xs font-bold text-amber-200 shadow-2xl sm:top-16"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <LevelInfoPanel
        level={selectedLevel?.level ?? null}
        status={selectedLevel?.status ?? null}
        earnedStars={
          selectedLevel
            ? activeLevels.find((item) => item.level.id === selectedLevel.level.id)?.stars
            : undefined
        }
        isSimulatingRun={isSimulatingRun}
        onClose={() => setSelectedLevel(null)}
        onStartLevel={(lvl) => void handleStartLevel(lvl)}
        onSimulateComplete={(lvl, stars) => void applyLevelCompletion(lvl, stars)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={(user) => {
          setAuthUser(user);
          void loadBackendSubjectMap(activeSubjectSlug);
          showToast(`Welcome, ${user.name}!`);
        }}
      />
    </WorldMapTemplate>

    <RpgCelebrationOverlay
      studentName={authUser?.name ?? 'Explorer'}
      avatarAppearance={studentAvatar?.appearance}
      avatarEquipped={studentAvatar?.equippedItems}
      levelVictory={levelVictory}
      conquerorEvent={conquerorEvent}
      onDismissLevelVictory={() => setLevelVictory(null)}
      onDismissConqueror={() => {
        setConquerorEvent(null);
        setLevelVictory(null);
      }}
      onEquipUnlockedRewards={async (rewards) => {
        const appPatch: Record<string, string> = {};
        const eqPatch: Record<string, string> = {};
        for (const rw of rewards) {
          if (['outfit', 'jacket', 'bottoms', 'shoes', 'costume'].includes(rw.category)) {
            appPatch[rw.category] = rw.itemKey;
          } else {
            eqPatch[rw.category] = rw.itemKey;
          }
        }
        const updated = await apiClient.updateStudentAvatar({
          appearance: Object.keys(appPatch).length > 0 ? appPatch : undefined,
          equippedItems: Object.keys(eqPatch).length > 0 ? eqPatch : undefined,
        });
        setStudentAvatar(updated);
      }}
      onContinueNextLevel={() => {
        const nextNum = levelVictory?.nextLevel?.levelNumber;
        setLevelVictory(null);
        if (nextNum) {
          const nextItem = activeLevels.find((item) => item.level.levelNumber === nextNum);
          if (nextItem) {
            setSelectedLevel({ level: nextItem.level, status: nextItem.status });
          }
        }
      }}
    />
    </>
  );
}
