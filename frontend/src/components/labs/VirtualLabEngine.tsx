'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  HelpCircle,
  Plus,
  Sparkles,
} from 'lucide-react';
import { GameButton } from '@/components/game-ui/GameButton';
import { toFriendlyStudentError } from '@/components/game-ui/friendlyError';
import { API_BASE_URL, apiClient, getStoredToken } from '@/lib/apiClient';
import { LabCompleteResponse, PublicLabMetadata } from '@/types/lab';
import { LevelNode } from '@/types/worldMap';
import { Html3dLabFrame } from './Html3dLabFrame';
import { ThreeModelLabViewer } from './ThreeModelLabViewer';
import { CodingLabWorkspace } from './coding/CodingLabWorkspace';

interface VirtualLabEngineProps {
  level: LevelNode;
  subjectName: string;
  isCompleting: boolean;
  onCompleteMissionDirect: (level: LevelNode, stars: 1 | 2 | 3) => Promise<void> | void;
  onLabCompleted: (response: LabCompleteResponse) => void;
}

function resolveAssetOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:4000';
  }
}

export function VirtualLabEngine({
  level,
  subjectName,
  isCompleting,
  onCompleteMissionDirect,
  onLabCompleted,
}: VirtualLabEngineProps) {
  const [lab, setLab] = useState<PublicLabMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  // Interactive Lab Notebook state
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [observations, setObservations] = useState<string[]>([]);
  const [observationDraft, setObservationDraft] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadLab = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLab(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const resolved = await apiClient.resolveLabForMission(level.id);
      setLab(resolved.lab);

      if (resolved.attempt) {
        setCompletedSteps(resolved.attempt.completedSteps ?? []);
        setObservations(resolved.attempt.observations ?? []);
      } else {
        setCompletedSteps([]);
        setObservations([]);
      }
      setAnswers({});
      setSubmitError(null);

      if (resolved.lab) {
        void apiClient.startLabAttempt(resolved.lab.labId, level.id).catch(() => undefined);
      }
    } catch (err) {
      setLoadError(
        toFriendlyStudentError(
          err,
          'We could not load the virtual lab for this level right now.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [level.id]);

  useEffect(() => {
    void loadLab();
  }, [loadLab]);

  const fullAssetUrl = useMemo(() => {
    if (!lab) return '';
    return `${resolveAssetOrigin()}${lab.assetUrl}`;
  }, [lab]);

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const handleAddObservation = () => {
    const trimmed = observationDraft.trim();
    if (!trimmed) return;
    setObservations((prev) => [...prev, trimmed]);
    setObservationDraft('');
  };

  const handleResetLab = () => {
    setResetNonce((n) => n + 1);
    setCompletedSteps([]);
    setObservations([]);
    setAnswers({});
    setSubmitError(null);
  };

  const handleSubmitExperiment = async () => {
    if (!lab) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiClient.completeLabExperiment(lab.labId, {
        missionId: level.id,
        completedSteps,
        observations,
        answers,
      });
      onLabCompleted(res);
    } catch (err) {
      setSubmitError(
        toFriendlyStudentError(
          err,
          'Please finish the required experiment steps and verification check.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#233B59] bg-[#0D1B2D] p-8 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#F5B900] border-t-transparent" />
        <p className="mt-3 text-sm font-bold text-[#E9DFC7]">
          Preparing {level.title}...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-rose-400/40 bg-[#0D1B2D] p-8 text-center">
        <p className="text-sm font-bold text-rose-200">{loadError}</p>
        <GameButton
          variant="gold"
          size="sm"
          onClick={() => void loadLab()}
          className="mt-4"
        >
          Retry Loading Lab
        </GameButton>
      </div>
    );
  }

  // Educational Lesson / Non-Lab Level View (no broken workspace!)
  if (!lab) {
    return (
      <div className="flex flex-1 items-center justify-center p-2 sm:p-6">
        <div className="vq-parchment w-full max-w-2xl rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7C5818]">
            <BookOpen className="h-4 w-4" />
            <span>
              {subjectName} · {level.missionType ?? 'Quest Lesson'}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-black text-[#1C1914]">{level.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3B2A0C]">
            {level.description}
          </p>

          {level.objectives.length > 0 && (
            <div className="mt-5 rounded-xl border border-[#B89D68] bg-[#F5EEDB] p-4">
              <p className="text-xs font-black uppercase tracking-wider text-[#5C4620]">
                Learning Objectives
              </p>
              <ul className="mt-2 space-y-1.5 text-sm font-semibold text-[#1C1914]">
                {level.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#9A6D00]" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#B89D68]/60 pt-4">
            <span className="text-xs font-extrabold text-[#5C4620]">
              Reward: +{level.xpReward} XP
            </span>
            <GameButton
              variant="emerald"
              size="md"
              disabled={isCompleting}
              onClick={() => void onCompleteMissionDirect(level, 3)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCompleting ? 'Saving Progress...' : 'Complete Quest'}
            </GameButton>
          </div>
        </div>
      </div>
    );
  }

  if (lab.labFormat === 'coding_ide') {
    return (
      <CodingLabWorkspace
        lab={lab}
        levelNode={level}
        onLabCompleted={onLabCompleted}
      />
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
      {/* Main 3D Lab Viewport — takes full available space */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {lab.labFormat === 'three_model' ? (
          <ThreeModelLabViewer title={lab.title} modelUrl={fullAssetUrl} />
        ) : (
          <Html3dLabFrame
            title={lab.title}
            src={fullAssetUrl}
            resetNonce={resetNonce}
            onReset={handleResetLab}
            notebookOpen={drawerOpen}
            onToggleNotebook={() => setDrawerOpen((v) => !v)}
            stepsCompleted={completedSteps.length}
            totalSteps={lab.instructions.length}
          />
        )}
      </div>

      {/* Collapsible Lab Notebook & Server-Validated Submission Drawer */}
      {drawerOpen && (
        <aside className="vq-panel vq-scroll flex max-h-full w-full flex-col justify-between gap-4 overflow-y-auto rounded-2xl p-4 lg:w-96 lg:shrink-0">
          <div className="space-y-4">
            {/* Lab Header */}
            <div className="border-b border-[#1E3350] pb-3">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#F5B900]">
                <FlaskConical className="h-3.5 w-3.5" />
                <span>
                  {lab.difficulty} · ~{lab.estimatedDurationMinutes} min
                </span>
              </div>
              <h2 className="mt-1 text-base font-black text-[#E9DFC7]">{lab.title}</h2>
              <p className="mt-1 text-xs text-[#E9DFC7]/70">{lab.description}</p>
            </div>

            {/* Experiment Instructions */}
            {lab.instructions.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#E9DFC7]/85">
                  <ClipboardList className="h-3.5 w-3.5 text-[#F5B900]" />
                  Steps ({completedSteps.length}/{lab.instructions.length})
                </p>
                <div className="space-y-1.5">
                  {lab.instructions.map((step, idx) => {
                    const checked = completedSteps.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-xs transition ${
                          checked
                            ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-100'
                            : 'border-[#1E3350] bg-[#071426] text-[#E9DFC7]/85 hover:border-[#2C4669]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStep(idx)}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#F5B900]"
                        />
                        <span>{step}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Observations & Measurements */}
            <div>
              <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-[#E9DFC7]/85">
                Observations ({observations.length})
              </p>
              {lab.interactionConfig.observationPrompts.length > 0 && (
                <p className="mb-2 text-[11px] italic text-[#F5B900]/85">
                  Prompt: {lab.interactionConfig.observationPrompts[0]}
                </p>
              )}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={observationDraft}
                  onChange={(e) => setObservationDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddObservation();
                    }
                  }}
                  placeholder="Record a measurement or observation..."
                  className="min-w-0 flex-1 rounded-lg border border-[#233B59] bg-[#071426] px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[#F5B900] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddObservation}
                  aria-label="Add observation"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#F5B900]/60 bg-[#13253D] px-2.5 text-xs font-black text-[#F5B900] hover:bg-[#1B3354]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {observations.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {observations.map((obs, idx) => (
                    <li
                      key={idx}
                      className="rounded-md border border-[#1E3350] bg-[#071426] px-2.5 py-1.5 text-[11px] text-[#E9DFC7]"
                    >
                      {obs}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Verification Questions */}
            {lab.completionCriteria.verificationQuestions.length > 0 && (
              <div className="space-y-3 border-t border-[#1E3350] pt-3">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#F5B900]">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Verification Check
                </p>
                {lab.completionCriteria.verificationQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-lg border border-[#1E3350] bg-[#071426] p-2.5"
                  >
                    <p className="text-xs font-bold text-[#E9DFC7]">{q.prompt}</p>
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, optIdx) => {
                        const selected = answers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            className={`w-full rounded-md border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${
                              selected
                                ? 'border-[#F5B900] bg-[#F5B900]/20 text-[#F5B900]'
                                : 'border-[#233B59] bg-[#0D1B2D] text-[#E9DFC7]/80 hover:border-[#F5B900]/40'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#1E3350] pt-3">
            {submitError && (
              <p className="mb-2 text-xs font-bold text-rose-300">{submitError}</p>
            )}
            <GameButton
              variant="gold"
              size="md"
              disabled={submitting}
              onClick={() => void handleSubmitExperiment()}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Validating Results...' : 'Submit Experiment'}
            </GameButton>
          </div>
        </aside>
      )}
    </div>
  );
}
