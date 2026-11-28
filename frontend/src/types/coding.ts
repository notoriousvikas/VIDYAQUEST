export type CodingLanguage = 'python' | 'javascript' | 'java';

export interface CodingExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface PublicTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description: string;
}

export interface PublicCodingChallenge {
  id: string;
  levelId: string;
  order: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  topic: string;
  description: string;
  instructions: string[];
  constraints: string[];
  examples: CodingExample[];
  hints: string[];
  starterCode: Record<CodingLanguage, string>;
  publicTestCases: PublicTestCase[];
  hiddenTestCaseCount: number;
}

export interface CodingLevel {
  levelId: string;
  levelNumber: number;
  missionSlug: string;
  labId: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  topics: string[];
  completionBonusXp: number;
  challengeIds: string[];
}

export interface CodingLevelWithChallenges {
  level: CodingLevel;
  challenges: PublicCodingChallenge[];
}

export interface CodingLevelProgress {
  levelId: string;
  levelNumber: number;
  title: string;
  completedChallengeIds: string[];
  completedCount: number;
  totalChallenges: number;
  completedByLanguage: Record<CodingLanguage, string[]>;
  levelCompleted: boolean;
  completedAt: string | null;
}

export interface CodingRunResult {
  challengeId: string;
  language: CodingLanguage;
  inputUsed: string;
  status: 'SUCCESS' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT' | 'PROVIDER_ERROR';
  output: string;
  error: string;
  exitCode: number | null;
  time?: string;
  memory?: string;
  matchesSample?: boolean;
}

export interface PublicTestResult {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: string;
  error?: string;
}

export interface CodingSubmitResult {
  submissionId: string;
  challengeId: string;
  levelId: string;
  language: CodingLanguage;
  status:
    | 'ACCEPTED'
    | 'WRONG_ANSWER'
    | 'COMPILATION_ERROR'
    | 'RUNTIME_ERROR'
    | 'TIMEOUT'
    | 'PROVIDER_ERROR';
  passedTests: number;
  totalTests: number;
  publicResults: PublicTestResult[];
  hiddenPassedCount: number;
  hiddenTotalCount: number;
  error?: string;
  executionMeta: {
    time?: string;
    memory?: string;
    exitCode?: number | null;
  };
  xpAwarded: number;
  leveledUp: boolean;
  levelCompleted: boolean;
  missionCompletionResult?: unknown;
}

export interface CodingHintResult {
  hintLevel: 1 | 2 | 3;
  source: 'groq' | 'curriculum';
  message: string;
}
