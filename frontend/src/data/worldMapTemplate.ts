import {
  Difficulty,
  SubjectMapResponse,
  SubjectSummary,
} from '@/types/worldMap';

export interface MapTemplateConfig {
  width: number;
  height: number;
  minScale: number;
  maxScale: number;
  defaultCenterX: number;
  defaultCenterY: number;
  fitPaddingPx: number;
}

export const DEFAULT_MAP_TEMPLATE_CONFIG: MapTemplateConfig = {
  width: 1600,
  height: 960,
  minScale: 0.25,
  maxScale: 2.5,
  defaultCenterX: 50,
  defaultCenterY: 50,
  fitPaddingPx: 24,
};

export interface ZoneTemplateInput {
  id: string;
  name: string;
  description: string;
  positionX: number;
  positionY: number;
  accentColor?: string;
}

export interface MissionTemplateInput {
  id: string;
  sequence: number;
  title: string;
  locationId: string;
  description: string;
  learningObjectives: string[];
  difficulty?: Difficulty;
  missionType?: string;
  xpReward?: number;
  positionX: number;
  positionY: number;
  prerequisites?: string[];
}

export interface SubjectWorldTemplateInput {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  mapName: string;
  mapSlug?: string;
  backgroundAsset?: string;
  previewAsset?: string;
  theme?: Partial<SubjectMapResponse['map']['theme']>;
  mapConfiguration?: Partial<SubjectMapResponse['map']['mapConfiguration']>;
  zones: ZoneTemplateInput[];
  missions: MissionTemplateInput[];
}

/**
 * Creates a complete SubjectMapResponse and SubjectSummary from a concise
 * template definition so new subject worlds can be added consistently.
 */
export function createSubjectWorldTemplate(input: SubjectWorldTemplateInput): {
  summary: SubjectSummary;
  mapData: SubjectMapResponse;
} {
  const mapId = input.mapSlug ?? `${input.slug}-world`;
  const backgroundAsset = input.backgroundAsset ?? '/assets/vidyaquest-world-map.jpg';
  const previewAsset = input.previewAsset ?? backgroundAsset;

  const mapConfig = {
    width: input.mapConfiguration?.width ?? DEFAULT_MAP_TEMPLATE_CONFIG.width,
    height: input.mapConfiguration?.height ?? DEFAULT_MAP_TEMPLATE_CONFIG.height,
    minScale: input.mapConfiguration?.minScale ?? DEFAULT_MAP_TEMPLATE_CONFIG.minScale,
    maxScale: input.mapConfiguration?.maxScale ?? DEFAULT_MAP_TEMPLATE_CONFIG.maxScale,
    defaultCenterX:
      input.mapConfiguration?.defaultCenterX ?? DEFAULT_MAP_TEMPLATE_CONFIG.defaultCenterX,
    defaultCenterY:
      input.mapConfiguration?.defaultCenterY ?? DEFAULT_MAP_TEMPLATE_CONFIG.defaultCenterY,
  };

  const zoneNameById = new Map(input.zones.map((z) => [z.id, z.name]));

  const missions: SubjectMapResponse['missions'] = input.missions.map((m, index) => {
    const prerequisites = m.prerequisites ?? (index > 0 ? [input.missions[index - 1].id] : []);
    return {
      id: m.id,
      slug: m.id,
      sequence: m.sequence,
      title: m.title,
      description: m.description,
      learningObjectives: m.learningObjectives,
      difficulty: m.difficulty ?? 'Beginner',
      missionType: m.missionType ?? 'quest',
      xpReward: m.xpReward ?? 50 + index * 25,
      estimatedDurationMinutes: 10,
      locationId: m.locationId,
      locationName: zoneNameById.get(m.locationId) ?? input.mapName,
      positionX: m.positionX,
      positionY: m.positionY,
      prerequisites,
      status: prerequisites.length === 0 ? 'AVAILABLE' : 'LOCKED',
      stars: 0,
      attempts: 0,
      bestScore: 0,
      completedAt: null,
    };
  });

  const zones: SubjectMapResponse['zones'] = input.zones.map((z, index) => {
    const zoneMissions = missions.filter((m) => m.locationId === z.id);
    const hasUnlocked = zoneMissions.some((m) => m.status !== 'LOCKED');
    return {
      id: z.id,
      slug: z.id,
      name: z.name,
      locationType: 'region',
      displayOrder: index + 1,
      description: z.description,
      positionX: z.positionX,
      positionY: z.positionY,
      accentColor: z.accentColor ?? '#38bdf8',
      totalMissions: zoneMissions.length,
      completedMissions: 0,
      completionPercentage: 0,
      status: hasUnlocked ? 'UNLOCKED' : 'LOCKED',
    };
  });

  const summary: SubjectSummary = {
    id: input.id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    icon: input.icon,
    totalMissions: missions.length,
    completedMissions: 0,
    completionPercentage: 0,
    map: {
      id: mapId,
      mapName: input.mapName,
      mapSlug: mapId,
      previewAsset,
      version: 1,
    },
  };

  const mapData: SubjectMapResponse = {
    subject: {
      id: input.id,
      name: input.name,
      slug: input.slug,
      icon: input.icon,
    },
    map: {
      id: mapId,
      mapName: input.mapName,
      mapSlug: mapId,
      theme: {
        primaryColor: input.theme?.primaryColor ?? '#38bdf8',
        secondaryColor: input.theme?.secondaryColor ?? '#fbbf24',
        oceanColor: input.theme?.oceanColor ?? '#1b5e7a',
        badgeStyle: input.theme?.badgeStyle ?? 'classic-rpg',
        ambientEffect: input.theme?.ambientEffect ?? 'clouds',
      },
      backgroundAsset,
      previewAsset,
      mapConfiguration: mapConfig,
      version: 1,
    },
    zones,
    missions,
    progress: {
      totalXp: 0,
      level: 1,
      totalMissions: missions.length,
      completedMissions: 0,
      completionPercentage: 0,
      currentMissionId: missions[0]?.id ?? null,
    },
  };

  return { summary, mapData };
}

/**
 * Starter template example that can be cloned or customized for new worlds.
 */
export const STARTER_WORLD_TEMPLATE = createSubjectWorldTemplate({
  id: 'template-world',
  name: 'Starter Realm',
  slug: 'starter-realm',
  description: 'Reusable world map template with balanced 5-node progression.',
  icon: 'globe',
  mapName: 'Starter Island',
  zones: [
    {
      id: 'base-camp',
      name: 'Base Camp',
      description: 'Starting meadow for introductory quests.',
      positionX: 25,
      positionY: 65,
      accentColor: '#22c55e',
    },
    {
      id: 'central-spire',
      name: 'Central Spire',
      description: 'Core challenge arena.',
      positionX: 52,
      positionY: 45,
      accentColor: '#38bdf8',
    },
    {
      id: 'summit-citadel',
      name: 'Summit Citadel',
      description: 'Final mastery destination.',
      positionX: 80,
      positionY: 30,
      accentColor: '#a855f7',
    },
  ],
  missions: [
    {
      id: 'tpl-1',
      sequence: 1,
      title: 'First Footsteps',
      locationId: 'base-camp',
      description: 'Begin your journey at Base Camp.',
      learningObjectives: ['Explore the map controls', 'Complete the opening challenge'],
      difficulty: 'Beginner',
      positionX: 25,
      positionY: 68,
    },
    {
      id: 'tpl-2',
      sequence: 2,
      title: 'Bridge Crossing',
      locationId: 'central-spire',
      description: 'Cross into the Central Spire.',
      learningObjectives: ['Apply core concepts', 'Unlock the spire gate'],
      difficulty: 'Intermediate',
      positionX: 52,
      positionY: 48,
    },
    {
      id: 'tpl-3',
      sequence: 3,
      title: 'Citadel Mastery',
      locationId: 'summit-citadel',
      description: 'Conquer the final summit challenge.',
      learningObjectives: ['Synthesize everything learned'],
      difficulty: 'Master',
      positionX: 80,
      positionY: 33,
    },
  ],
});
