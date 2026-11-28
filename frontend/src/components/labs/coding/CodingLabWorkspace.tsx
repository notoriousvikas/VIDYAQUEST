'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Code2,
  Lightbulb,
  Loader2,
  Minus,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Sun,
  Terminal,
  XCircle,
} from 'lucide-react';
import { toFriendlyStudentError } from '@/components/game-ui/friendlyError';
import { apiClient } from '@/lib/apiClient';
import {
  CodingHintResult,
  CodingLanguage,
  CodingLevel,
  CodingLevelProgress,
  CodingRunResult,
  CodingSubmitResult,
  PublicCodingChallenge,
} from '@/types/coding';
import { LabCompleteResponse, PublicLabMetadata } from '@/types/lab';
import { LevelNode } from '@/types/worldMap';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#071426] text-xs font-bold text-[#9FB3C8]">
      Loading Monaco Code Editor...
    </div>
  ),
});

interface CodingLabWorkspaceProps {
  lab: PublicLabMetadata;
  levelNode: LevelNode;
  onLabCompleted: (response: LabCompleteResponse) => void;
}

type BottomTab = 'output' | 'testcases' | 'results' | 'console';

const LANGUAGE_LABELS: Record<CodingLanguage, string> = {
  python: 'Python 3',
  javascript: 'JavaScript (Node)',
  java: 'Java 25',
};

const MONACO_LANGUAGE_MAP: Record<CodingLanguage, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
};

function getDraftStorageKey(challengeId: string, language: CodingLanguage): string {
  return `vq_coding_draft:${challengeId}:${language}`;
}

function readDraft(challengeId: string, language: CodingLanguage): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(getDraftStorageKey(challengeId, language));
  } catch {
    return null;
  }
}

function writeDraft(challengeId: string, language: CodingLanguage, code: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getDraftStorageKey(challengeId, language), code);
  } catch {
    // Ignore storage quota errors
  }
}

function clearDraft(challengeId: string, language: CodingLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getDraftStorageKey(challengeId, language));
  } catch {
    // Ignore
  }
}

export function CodingLabWorkspace({
  lab,
  levelNode,
  onLabCompleted,
}: CodingLabWorkspaceProps) {
  const [codingLevel, setCodingLevel] = useState<CodingLevel | null>(null);
  const [challenges, setChallenges] = useState<PublicCodingChallenge[]>([]);
  const [progress, setProgress] = useState<CodingLevelProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeChallengeId, setActiveChallengeId] = useState<string>('');
  const [language, setLanguage] = useState<CodingLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(14);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [activeTab, setActiveTab] = useState<BottomTab>('output');

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<CodingRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<CodingSubmitResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Hints & AI Mentor
  const [hintLoading, setHintLoading] = useState(false);
  const [mentorQuestion, setMentorQuestion] = useState('');
  const [mentorReplies, setMentorReplies] = useState<CodingHintResult[]>([]);
  const [mentorError, setMentorError] = useState<string | null>(null);

  const levelLookupId = lab.associatedMissionSlugs[0] || lab.labId;

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [levelRes, progRes] = await Promise.all([
        apiClient.getCodingLevel(levelLookupId),
        apiClient.getCodingLevelProgress(levelLookupId),
      ]);
      setCodingLevel(levelRes.level);
      setChallenges(levelRes.challenges);
      setProgress(progRes);

      const completedSet = new Set(progRes.completedChallengeIds);
      const firstIncomplete =
        levelRes.challenges.find((c) => !completedSet.has(c.id)) ??
        levelRes.challenges[0];
      if (firstIncomplete) {
        setActiveChallengeId(firstIncomplete.id);
      }
    } catch (err) {
      setLoadError(
        toFriendlyStudentError(
          err,
          'Could not load coding challenges for this level right now.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [levelLookupId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const activeChallenge = useMemo(
    () => challenges.find((c) => c.id === activeChallengeId) ?? challenges[0] ?? null,
    [challenges, activeChallengeId],
  );

  // Sync editor code whenever challenge or language changes, preserving drafts per (challenge, language)
  useEffect(() => {
    if (!activeChallenge) return;
    const saved = readDraft(activeChallenge.id, language);
    setCode(saved !== null ? saved : activeChallenge.starterCode[language]);
    setRunResult(null);
    setSubmitResult(null);
    setActionError(null);
    setMentorReplies([]);
    setMentorError(null);
  }, [activeChallenge, language]);

  const handleCodeChange = (nextCode: string | undefined) => {
    const val = nextCode ?? '';
    setCode(val);
    if (activeChallenge) {
      writeDraft(activeChallenge.id, language, val);
    }
  };

  const handleResetCode = () => {
    if (!activeChallenge) return;
    clearDraft(activeChallenge.id, language);
    setCode(activeChallenge.starterCode[language]);
    setActionError(null);
  };

  const handleRunCode = async () => {
    if (!activeChallenge) return;
    setRunning(true);
    setActionError(null);
    setActiveTab('output');
    try {
      const res = await apiClient.runCodingCode({
        challengeId: activeChallenge.id,
        language,
        code,
        customInput: useCustomInput ? customInput : undefined,
      });
      setRunResult(res);
      if (res.status === 'COMPILATION_ERROR' || res.status === 'RUNTIME_ERROR' || res.status === 'TIMEOUT') {
        setActiveTab('console');
      }
    } catch (err) {
      setActionError(toFriendlyStudentError(err, 'Failed to execute code.'));
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!activeChallenge || !codingLevel) return;
    setSubmitting(true);
    setActionError(null);
    setActiveTab('results');
    try {
      const res = await apiClient.submitCodingSolution({
        challengeId: activeChallenge.id,
        language,
        code,
      });
      setSubmitResult(res);

      if (res.status === 'ACCEPTED') {
        const updatedProg = await apiClient.getCodingLevelProgress(codingLevel.levelId);
        setProgress(updatedProg);

        if (res.levelCompleted && res.missionCompletionResult) {
          onLabCompleted({
            labId: lab.labId,
            missionId: levelNode.id,
            score: 100,
            correctAnswers: res.totalTests,
            totalQuestions: res.totalTests,
            attempt: {
              status: 'COMPLETED',
              completedSteps: [0, 1, 2, 3, 4],
              observations: [],
              score: 100,
              xpAwarded: res.xpAwarded,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
            completionResult:
              res.missionCompletionResult as LabCompleteResponse['completionResult'],
          });
        }
      } else if (
        res.status === 'COMPILATION_ERROR' ||
        res.status === 'RUNTIME_ERROR' ||
        res.status === 'TIMEOUT'
      ) {
        setActiveTab('console');
      }
    } catch (err) {
      setActionError(toFriendlyStudentError(err, 'Failed to submit solution.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskHint = async (hintLevel: 1 | 2 | 3) => {
    if (!activeChallenge) return;
    setHintLoading(true);
    setMentorError(null);
    try {
      const errText = runResult?.error || submitResult?.error || undefined;
      const res = await apiClient.requestCodingHint({
        challengeId: activeChallenge.id,
        language,
        code,
        hintLevel,
        errorOutput: errText,
        question: mentorQuestion.trim() || undefined,
      });
      setMentorReplies((prev) => [...prev, res]);
      setMentorQuestion('');
    } catch (err) {
      setMentorError(
        toFriendlyStudentError(err, 'AI Mentor is temporarily unavailable.'),
      );
    } finally {
      setHintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#071426] p-8 text-sm font-bold text-[#F5B900]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading Coding Arena...
      </div>
    );
  }

  if (loadError || !codingLevel || !activeChallenge) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#071426] p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-sm font-bold text-[#E9DFC7]">
          {loadError || 'No coding challenges available for this level yet.'}
        </p>
        <button
          type="button"
          onClick={() => void loadWorkspace()}
          className="rounded-lg border border-[#F5B900]/50 bg-[#0D1B2D] px-4 py-1.5 text-xs font-extrabold text-[#F5B900] hover:bg-[#13263E]"
        >
          Retry
        </button>
      </div>
    );
  }

  const completedSet = new Set(progress?.completedChallengeIds ?? []);
  const completedCount = progress?.completedCount ?? 0;
  const totalCount = challenges.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#071426] text-[#F3EFE6]">
      {/* Challenge Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#233B59] bg-[#0D1B2D] px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {challenges.map((ch) => {
            const isActive = ch.id === activeChallenge.id;
            const isDone = completedSet.has(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChallengeId(ch.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-extrabold transition ${
                  isActive
                    ? 'border-[#06b6d4] bg-[#082f49] text-cyan-200'
                    : isDone
                      ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:border-emerald-400'
                      : 'border-[#233B59] bg-[#071426] text-[#C5D3E2] hover:border-[#3A5A80]'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#13263E] text-[10px] font-black text-[#F5B900]">
                    {ch.order}
                  </span>
                )}
                <span className="max-w-[140px] truncate">{ch.title}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#9FB3C8]">
          <span>
            Progress:{' '}
            <strong className="text-[#F5B900]">
              {completedCount}/{totalCount}
            </strong>{' '}
            Challenges
          </span>
          {progress?.levelCompleted && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-black text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Level Cleared
            </span>
          )}
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left Panel: Problem Description, Examples, Constraints, Hints & Mentor */}
        <aside className="vq-scroll flex min-h-0 flex-col gap-4 overflow-y-auto border-b border-[#233B59] bg-[#0B1728] p-4 lg:col-span-5 lg:border-b-0 lg:border-r">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-cyan-500/40 bg-cyan-950/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                {activeChallenge.topic}
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  activeChallenge.difficulty === 'Easy'
                    ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300'
                    : activeChallenge.difficulty === 'Medium'
                      ? 'border-amber-500/40 bg-amber-950/50 text-amber-300'
                      : 'border-rose-500/40 bg-rose-950/50 text-rose-300'
                }`}
              >
                {activeChallenge.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[#F5B900]/40 bg-[#2D2100] px-2 py-0.5 text-[10px] font-black text-[#F5B900]">
                <Sparkles className="h-3 w-3" /> +{activeChallenge.xpReward} XP
              </span>
            </div>

            <h2 className="mt-2 text-lg font-black text-[#F3EFE6]">
              {activeChallenge.order}. {activeChallenge.title}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#D7E2EE]">
              {activeChallenge.description}
            </p>
          </div>

          {activeChallenge.instructions.length > 0 && (
            <div className="rounded-xl border border-[#233B59] bg-[#0D1B2D] p-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#F5B900]">
                Mission Instructions
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-[#C5D3E2]">
                {activeChallenge.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeChallenge.examples.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#9FB3C8]">
                Examples
              </h3>
              {activeChallenge.examples.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#233B59] bg-[#071426] p-3 font-mono text-xs"
                >
                  {ex.input ? (
                    <div className="mb-1.5">
                      <span className="font-sans text-[10px] font-bold uppercase text-[#9FB3C8]">
                        Input:
                      </span>
                      <pre className="mt-0.5 whitespace-pre-wrap text-[#E9DFC7]">
                        {ex.input}
                      </pre>
                    </div>
                  ) : null}
                  <div>
                    <span className="font-sans text-[10px] font-bold uppercase text-[#9FB3C8]">
                      Output:
                    </span>
                    <pre className="mt-0.5 whitespace-pre-wrap text-emerald-300">
                      {ex.output}
                    </pre>
                  </div>
                  {ex.explanation && (
                    <p className="mt-1.5 font-sans text-[11px] text-[#9FB3C8]">
                      {ex.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeChallenge.constraints.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#9FB3C8]">
                Constraints
              </h3>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-[#C5D3E2]">
                {activeChallenge.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Progressive Hints & AI Coding Mentor */}
          <div className="rounded-xl border border-[#233B59] bg-[#0D1B2D] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  AI Coding Mentor & Hints
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {([1, 2, 3] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={hintLoading}
                    onClick={() => void handleAskHint(lvl)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#233B59] bg-[#071426] px-2 py-1 text-[11px] font-bold text-[#F5B900] transition hover:border-[#F5B900]/70 disabled:opacity-50"
                  >
                    <Lightbulb className="h-3 w-3" /> Hint {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex gap-1.5">
              <input
                type="text"
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !hintLoading) {
                    void handleAskHint(1);
                  }
                }}
                placeholder="Stuck? Ask a question about your code..."
                className="min-w-0 flex-1 rounded-lg border border-[#233B59] bg-[#071426] px-2.5 py-1.5 text-xs text-[#F3EFE6] placeholder-[#6B8299] focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                disabled={hintLoading}
                onClick={() => void handleAskHint(2)}
                className="rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3 py-1.5 text-xs font-extrabold text-cyan-200 hover:bg-cyan-900/60 disabled:opacity-50"
              >
                {hintLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ask'}
              </button>
            </div>

            {mentorError && (
              <p className="mt-2 text-xs text-rose-300">{mentorError}</p>
            )}

            {mentorReplies.length > 0 && (
              <div className="mt-2.5 space-y-2">
                {mentorReplies.map((rep, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#233B59] bg-[#071426] p-2.5 text-xs text-[#D7E2EE]"
                  >
                    <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase text-cyan-400">
                      <span>Hint {rep.hintLevel}</span>
                      <span>{rep.source === 'groq' ? 'AI Mentor' : 'Guide'}</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{rep.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel: Monaco Editor + Bottom Execution & Test Panel */}
        <section className="flex min-h-0 flex-col lg:col-span-7">
          {/* Editor Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#233B59] bg-[#0D1B2D] px-3 py-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-cyan-400" />
              <select
                aria-label="Programming Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as CodingLanguage)}
                className="rounded-lg border border-[#233B59] bg-[#071426] px-2.5 py-1 text-xs font-extrabold text-[#E9DFC7] focus:border-cyan-400 focus:outline-none"
              >
                {(Object.keys(LANGUAGE_LABELS) as CodingLanguage[]).map((langKey) => (
                  <option key={langKey} value={langKey}>
                    {LANGUAGE_LABELS[langKey]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Decrease font size"
                onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                className="rounded-md border border-[#233B59] bg-[#071426] p-1 text-[#C5D3E2] hover:border-cyan-400"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[34px] text-center text-[11px] font-bold text-[#9FB3C8]">
                {fontSize}px
              </span>
              <button
                type="button"
                title="Increase font size"
                onClick={() => setFontSize((s) => Math.min(22, s + 1))}
                className="rounded-md border border-[#233B59] bg-[#071426] p-1 text-[#C5D3E2] hover:border-cyan-400"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                title="Toggle Editor Theme"
                onClick={() =>
                  setEditorTheme((t) => (t === 'vs-dark' ? 'light' : 'vs-dark'))
                }
                className="ml-1 rounded-md border border-[#233B59] bg-[#071426] p-1 text-[#C5D3E2] hover:border-[#F5B900]"
              >
                {editorTheme === 'vs-dark' ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleResetCode}
                className="ml-1 inline-flex items-center gap-1 rounded-lg border border-[#233B59] bg-[#071426] px-2.5 py-1 text-xs font-bold text-[#C5D3E2] hover:border-amber-400 hover:text-amber-300"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Code
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="min-h-[280px] flex-1 border-b border-[#233B59]">
            <MonacoEditor
              height="100%"
              language={MONACO_LANGUAGE_MAP[language]}
              theme={editorTheme}
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'on',
                padding: { top: 10 },
              }}
            />
          </div>

          {/* Bottom Execution & Results Panel */}
          <div className="flex h-[260px] shrink-0 flex-col bg-[#0B1728]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#233B59] bg-[#0D1B2D] px-3 py-1.5">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'output', label: 'Output' },
                    { id: 'testcases', label: 'Test Cases' },
                    { id: 'results', label: 'Submission Results' },
                    { id: 'console', label: 'Console' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-extrabold transition ${
                      activeTab === tab.id
                        ? 'bg-[#13263E] text-[#F5B900]'
                        : 'text-[#9FB3C8] hover:text-[#E9DFC7]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={running || submitting}
                  onClick={() => void handleRunCode()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/60 bg-cyan-950/70 px-3 py-1 text-xs font-extrabold text-cyan-200 transition hover:bg-cyan-900/70 disabled:opacity-50"
                >
                  {running ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Run Code
                </button>
                <button
                  type="button"
                  disabled={running || submitting}
                  onClick={() => void handleSubmitSolution()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#F5B900] bg-[#F5B900] px-3.5 py-1 text-xs font-black text-[#071426] transition hover:bg-amber-300 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Submit Solution
                </button>
              </div>
            </div>

            <div className="vq-scroll min-h-0 flex-1 overflow-y-auto p-3 text-xs">
              {actionError && (
                <div className="mb-2 rounded-lg border border-rose-500/40 bg-rose-950/50 p-2 text-rose-200">
                  {actionError}
                </div>
              )}

              {activeTab === 'output' && (
                <div>
                  {!runResult ? (
                    <p className="text-[#9FB3C8]">
                      Click <strong>Run Code</strong> to execute your code against sample or custom input.
                    </p>
                  ) : (
                    <div className="space-y-2 font-mono">
                      <div className="flex flex-wrap items-center gap-2 font-sans">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-black ${
                            runResult.status === 'SUCCESS'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          {runResult.status}
                        </span>
                        {runResult.matchesSample !== undefined && (
                          <span
                            className={`text-[11px] font-bold ${
                              runResult.matchesSample ? 'text-emerald-300' : 'text-amber-300'
                            }`}
                          >
                            {runResult.matchesSample
                              ? 'Matches sample output'
                              : 'Does not match sample output'}
                          </span>
                        )}
                        {runResult.time && (
                          <span className="text-[11px] text-[#9FB3C8]">
                            Time: {runResult.time}s
                          </span>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap rounded-lg border border-[#233B59] bg-[#071426] p-2.5 text-[#E9DFC7]">
                        {runResult.output || '(no stdout output)'}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'testcases' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#C5D3E2]">
                      Sample Test Cases ({activeChallenge.publicTestCases.length} public,{' '}
                      {activeChallenge.hiddenTestCaseCount} hidden)
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 font-bold text-cyan-300">
                      <input
                        type="checkbox"
                        checked={useCustomInput}
                        onChange={(e) => setUseCustomInput(e.target.checked)}
                      />
                      Use Custom Input
                    </label>
                  </div>

                  {useCustomInput && (
                    <textarea
                      rows={3}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom stdin input for Run Code..."
                      className="w-full rounded-lg border border-[#233B59] bg-[#071426] p-2 font-mono text-xs text-[#F3EFE6] focus:border-cyan-400 focus:outline-none"
                    />
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeChallenge.publicTestCases.map((tc, i) => (
                      <div
                        key={tc.id}
                        className="rounded-lg border border-[#233B59] bg-[#071426] p-2.5 font-mono"
                      >
                        <div className="font-sans text-[11px] font-bold text-[#F5B900]">
                          Case {i + 1}: {tc.description}
                        </div>
                        {tc.input && (
                          <div className="mt-1 text-[#C5D3E2]">
                            <span className="text-[#9FB3C8]">In: </span>
                            {tc.input}
                          </div>
                        )}
                        <div className="mt-1 text-emerald-300">
                          <span className="text-[#9FB3C8]">Expected: </span>
                          {tc.expectedOutput}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'results' && (
                <div>
                  {!submitResult ? (
                    <p className="text-[#9FB3C8]">
                      Click <strong>Submit Solution</strong> to evaluate your code against all public and hidden test cases.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#233B59] bg-[#071426] p-2.5">
                        <div className="flex items-center gap-2">
                          {submitResult.status === 'ACCEPTED' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-400" />
                          )}
                          <div>
                            <div className="text-sm font-black text-[#F3EFE6]">
                              {submitResult.status === 'ACCEPTED'
                                ? 'Accepted! All Tests Passed'
                                : submitResult.status.replace('_', ' ')}
                            </div>
                            <div className="text-[11px] text-[#9FB3C8]">
                              Passed {submitResult.passedTests}/{submitResult.totalTests} total tests (Hidden:{' '}
                              {submitResult.hiddenPassedCount}/{submitResult.hiddenTotalCount})
                            </div>
                          </div>
                        </div>

                        {submitResult.xpAwarded > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[#F5B900]/50 bg-[#2D2100] px-2.5 py-1 text-xs font-black text-[#F5B900]">
                            <Sparkles className="h-3.5 w-3.5" /> +{submitResult.xpAwarded} XP
                          </span>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {submitResult.publicResults.map((pr, idx) => (
                          <div
                            key={pr.id}
                            className={`rounded-lg border p-2.5 font-mono ${
                              pr.passed
                                ? 'border-emerald-500/30 bg-emerald-950/20'
                                : 'border-rose-500/30 bg-rose-950/20'
                            }`}
                          >
                            <div className="flex items-center justify-between font-sans text-[11px] font-bold">
                              <span>Sample {idx + 1}</span>
                              <span className={pr.passed ? 'text-emerald-300' : 'text-rose-300'}>
                                {pr.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                            {!pr.passed && (
                              <div className="mt-1 space-y-0.5 text-[11px]">
                                <div className="text-[#9FB3C8]">Expected: {pr.expectedOutput}</div>
                                <div className="text-rose-200">Got: {pr.actualOutput || '(empty)'}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'console' && (
                <div className="space-y-2 font-mono">
                  <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold text-[#9FB3C8]">
                    <Terminal className="h-3.5 w-3.5" /> Execution Diagnostics
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg border border-[#233B59] bg-[#071426] p-2.5 text-rose-200">
                    {submitResult?.error ||
                      runResult?.error ||
                      'No compilation or runtime errors reported.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
