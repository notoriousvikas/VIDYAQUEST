export type RegionId =
  | 'knowledge-village'
  | 'science-forest'
  | 'mathematics-mountains'
  | 'discovery-coast'
  | 'innovation-castle'
  | string;

export type LevelStatus = 'completed' | 'current' | 'in_progress' | 'unlocked' | 'locked';

export type BackendMissionStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';

export interface RegionInfo {
  id: RegionId;
  name: string;
  subtitle: string;
  xPercent: number;
  yPercent: number;
  accentColor: string;
  completionPercentage?: number;
  status?: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
}

export interface LevelNode {
  id: string;
  levelNumber: number;
  title: string;
  regionId: RegionId;
  regionName: string;
  description: string;
  objectives: string[];
  difficulty: Difficulty;
  missionType?: string;
  xpReward: number;
  xPercent: number;
  yPercent: number;
  prerequisites: string[];
  attempts?: number;
  bestScore?: number;
}

export interface PlayerMapProgress {
  completedLevels: Record<string, { stars: 1 | 2 | 3 }>;
  currentLevelId: string;
  totalXp: number;
}

export interface SubjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  totalMissions: number;
  completedMissions: number;
  completionPercentage: number;
  map: {
    id: string;
    mapName: string;
    mapSlug: string;
    previewAsset: string;
    version: number;
  } | null;
}

export interface SubjectMapResponse {
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  map: {
    id: string;
    mapName: string;
    mapSlug: string;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      oceanColor: string;
      badgeStyle: string;
      ambientEffect: string;
    };
    backgroundAsset: string;
    previewAsset: string;
    mapConfiguration: {
      width: number;
      height: number;
      minScale: number;
      maxScale: number;
      defaultCenterX: number;
      defaultCenterY: number;
    };
    version: number;
  };
  zones: Array<{
    id: string;
    name: string;
    slug: string;
    locationType: string;
    positionX: number;
    positionY: number;
    accentColor: string;
    displayOrder: number;
    description: string;
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
    totalMissions: number;
    completedMissions: number;
    completionPercentage: number;
  }>;
  missions: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    locationId: string;
    locationName: string;
    missionType: string;
    difficulty: Difficulty;
    xpReward: number;
    prerequisites: string[];
    sequence: number;
    estimatedDurationMinutes: number;
    learningObjectives: string[];
    positionX: number;
    positionY: number;
    status: BackendMissionStatus;
    attempts: number;
    bestScore: number;
    stars: 0 | 1 | 2 | 3;
  }>;
  progress: {
    totalMissions: number;
    completedMissions: number;
    completionPercentage: number;
    currentMissionId: string | null;
    totalXp: number;
    level: number;
  };
}
