import { ConquerorEventPayload, UnlockedClothingReward } from './student';
import { SubjectMapResponse } from './worldMap';

export type LabFormat = 'html_3d' | 'three_model' | 'interactive_config' | 'coding_ide';

export interface LabVerificationQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface PublicLabMetadata {
  labId: string;
  subjectSlug: string;
  associatedMissionSlugs: string[];
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  estimatedDurationMinutes: number;
  enabled: boolean;
  labFormat: LabFormat;
  entryAsset: string;
  instructions: string[];
  interactionConfig: {
    mode: string;
    supportsRotation: boolean;
    supportsZoom: boolean;
    supportsReset: boolean;
    observationPrompts: string[];
  };
  completionCriteria: {
    minStepsCompleted: number;
    minObservations: number;
    verificationQuestions: LabVerificationQuestion[];
  };
  assetUrl: string;
}

export interface LabAttemptSummary {
  status: 'IN_PROGRESS' | 'COMPLETED';
  completedSteps: number[];
  observations: string[];
  score: number;
  xpAwarded: number;
  startedAt: string;
  completedAt: string | null;
}

export interface LabResolveResponse {
  mission: {
    id: string;
    title: string;
    description: string;
    learningObjectives: string[];
    xpReward: number;
  };
  lab: PublicLabMetadata | null;
  attempt: LabAttemptSummary | null;
}

export interface LabCompleteResponse {
  labId: string;
  missionId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  attempt: LabAttemptSummary;
  completionResult: {
    missionId: string;
    alreadyCompleted: boolean;
    xpAwarded: number;
    leveledUp: boolean;
    starsEarned: 1 | 2 | 3;
    score: number;
    conquerorEvent?: ConquerorEventPayload | null;
    unlockedClothingRewards?: UnlockedClothingReward[];
    map: SubjectMapResponse;
  };
}
