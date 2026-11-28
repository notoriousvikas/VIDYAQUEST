'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { VirtualLabEngine } from '@/components/labs/VirtualLabEngine';
import { LabCompleteResponse } from '@/types/lab';
import { LevelNode } from '@/types/worldMap';

interface GameplayStageProps {
  level: LevelNode;
  subjectName: string;
  isCompleting: boolean;
  onBackToMap: () => void;
  onCompleteLevel: (level: LevelNode, stars: 1 | 2 | 3) => Promise<void> | void;
  onLabCompleted: (level: LevelNode, response: LabCompleteResponse) => void;
}

export function GameplayStage({
  level,
  subjectName,
  isCompleting,
  onBackToMap,
  onCompleteLevel,
  onLabCompleted,
}: GameplayStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-[100dvh] w-full flex-col bg-[#071426] text-[#F3EFE6]"
    >
      {/* Top Gameplay Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#233B59] bg-[#0D1B2D] px-3 py-1.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToMap}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#233B59] bg-[#071426] px-2.5 py-1 text-xs font-extrabold text-[#E9DFC7] transition hover:border-[#F5B900]/70 hover:text-[#F5B900]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Map</span>
          </button>

          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#F5B900]">
              {subjectName}
            </span>
            <h1 className="text-xs font-black text-[#E9DFC7] sm:text-sm">
              Level {level.levelNumber}: {level.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-[#F5B900]/45 bg-[#2D2100] px-2 py-0.5 text-[11px] font-black text-[#F5B900]">
            <Sparkles className="h-3 w-3" />+{level.xpReward} XP
          </span>
        </div>
      </header>

      {/* Main Gameplay Area — Reusable Virtual Lab Engine */}
      <main
        id="virtual-lab-slot"
        data-level-id={level.id}
        className="vq-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <VirtualLabEngine
          level={level}
          subjectName={subjectName}
          isCompleting={isCompleting}
          onCompleteMissionDirect={onCompleteLevel}
          onLabCompleted={(res) => onLabCompleted(level, res)}
        />
      </main>
    </motion.div>
  );
}
