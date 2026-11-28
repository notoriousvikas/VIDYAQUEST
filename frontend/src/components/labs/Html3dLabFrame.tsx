'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';

interface Html3dLabFrameProps {
  title: string;
  src: string;
  resetNonce: number;
  onReset: () => void;
  notebookOpen?: boolean;
  onToggleNotebook?: () => void;
  stepsCompleted?: number;
  totalSteps?: number;
}

export function Html3dLabFrame({
  title,
  src,
  resetNonce,
  onReset,
  notebookOpen,
  onToggleNotebook,
  stepsCompleted = 0,
  totalSteps = 0,
}: Html3dLabFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={`relative flex flex-1 flex-col overflow-hidden bg-[#071426] ${
        isFullscreen
          ? 'fixed inset-2 z-50 rounded-xl border border-[#233B59] shadow-2xl'
          : 'h-full min-h-[760px] w-full'
      }`}
    >
      {/* Compact Lab Viewport Controls */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#1E3350] bg-[#0D1B2D] px-3 py-1.5 text-xs">
        <span className="truncate font-bold text-[#E9DFC7]/90">{title}</span>
        <div className="flex items-center gap-1.5">
          {onToggleNotebook && (
            <button
              type="button"
              onClick={onToggleNotebook}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-extrabold transition ${
                notebookOpen
                  ? 'border-[#FFD95A] bg-[#F5B900] text-[#071426]'
                  : 'border-[#F5B900]/60 bg-[#13253D] text-[#F5B900] hover:bg-[#1B3354]'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>
                Lab Notebook &amp; Submit
                {totalSteps > 0 ? ` (${stepsCompleted}/${totalSteps})` : ''}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLoaded(false);
              setFailed(false);
              onReset();
            }}
            className="inline-flex items-center gap-1 rounded-md border border-[#233B59] bg-[#071426] px-2 py-1 text-[11px] font-bold text-[#E9DFC7]/85 transition hover:border-[#F5B900]/60 hover:text-[#F5B900]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="inline-flex items-center gap-1 rounded-md border border-[#233B59] bg-[#071426] px-2 py-1 text-[11px] font-bold text-[#E9DFC7]/85 transition hover:border-[#F5B900]/60 hover:text-[#F5B900]"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {!loaded && !failed && (
        <div className="absolute inset-0 top-9 z-10 flex flex-col items-center justify-center bg-[#071426]/95 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5B900] border-t-transparent" />
          <p className="mt-3 text-xs font-bold text-[#E9DFC7]">
            Loading 3D Virtual Laboratory...
          </p>
          <p className="mt-1 text-[11px] text-[#E9DFC7]/60">
            Preparing equipment and interactive scene
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {failed ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-[#F5B900]" />
          <p className="mt-2 text-sm font-bold text-[#E9DFC7]">
            We could not load this 3D lab scene right now.
          </p>
          <p className="mt-1 text-xs text-[#E9DFC7]/65">
            Check your connection and click Reset to try again.
          </p>
        </div>
      ) : (
        <iframe
          key={`${src}-${resetNonce}`}
          title={title}
          src={src}
          loading="lazy"
          allow="fullscreen"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="min-h-0 w-full flex-1 border-0 bg-[#071426]"
        />
      )}
    </div>
  );
}
