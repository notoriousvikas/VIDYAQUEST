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

export interface HiddenTestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface CodingChallenge {
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
  hiddenTestCases: HiddenTestCase[];
}

export type PublicCodingChallenge = Omit<CodingChallenge, 'hiddenTestCases'> & {
  hiddenTestCaseCount: number;
};

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
