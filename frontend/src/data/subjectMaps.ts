import { MapBorderVariant } from '@/components/world-map/MapBorderFrame';

export interface MapLandmark {
  id: string;
  name: string;
  description: string;
  xPercent: number;
  yPercent: number;
}

export interface SubjectMapConfig {
  subjectId: string;
  subjectSlug: string;
  mapName: string;
  mapSlug: string;
  backgroundAsset: string;
  previewAsset: string;
  dimensions: {
    width: number;
    height: number;
  };
  oceanColor: string;
  borderVariant: MapBorderVariant;
  landmarks: MapLandmark[];
  levelCoordinates: Array<{
    sequence: number;
    xPercent: number;
    yPercent: number;
  }>;
}

export const knowledgeVillageMap: SubjectMapConfig = {
  subjectId: 'chemistry',
  subjectSlug: 'chemistry',
  mapName: 'Knowledge Village',
  mapSlug: 'knowledge-village',
  backgroundAsset: '/assets/maps/knowledge-village.jpg',
  previewAsset: '/assets/maps/knowledge-village.jpg',
  dimensions: { width: 1600, height: 960 },
  oceanColor: '#1a382c',
  borderVariant: 'classic-gold',
  landmarks: [
    {
      id: 'kv-library',
      name: 'Grand Village Library',
      description: 'Ancient scrolls of matter, elements, and reactions.',
      xPercent: 34,
      yPercent: 32,
    },
    {
      id: 'kv-market',
      name: 'Cobblestone Marketplace',
      description: 'Bustling square of spices, salts, and mixtures.',
      xPercent: 52,
      yPercent: 50,
    },
    {
      id: 'kv-tower',
      name: 'Crystal Alchemy Spire',
      description: 'Hilltop tower overlooking the village river.',
      xPercent: 87,
      yPercent: 22,
    },
  ],
  levelCoordinates: [
    { sequence: 1, xPercent: 22, yPercent: 74 },
    { sequence: 2, xPercent: 16, yPercent: 48 },
    { sequence: 3, xPercent: 18, yPercent: 22 },
    { sequence: 4, xPercent: 52, yPercent: 20 },
    { sequence: 5, xPercent: 46, yPercent: 54 },
    { sequence: 6, xPercent: 64, yPercent: 72 },
    { sequence: 7, xPercent: 84, yPercent: 78 },
    { sequence: 8, xPercent: 86, yPercent: 46 },
  ],
};

export const scienceForestMap: SubjectMapConfig = {
  subjectId: 'biology',
  subjectSlug: 'biology',
  mapName: 'Science Forest',
  mapSlug: 'science-forest',
  backgroundAsset: '/assets/maps/science-forest.jpg',
  previewAsset: '/assets/maps/science-forest.jpg',
  dimensions: { width: 1600, height: 960 },
  oceanColor: '#0f2d25',
  borderVariant: 'arcane-emerald',
  landmarks: [
    {
      id: 'sf-waterfall',
      name: 'Crystal Falls',
      description: 'Pure mountain water feeding the living forest.',
      xPercent: 20,
      yPercent: 26,
    },
    {
      id: 'sf-treehouse',
      name: 'Canopy Observatory',
      description: 'Treehouse lab for inspecting flora and fauna.',
      xPercent: 64,
      yPercent: 16,
    },
    {
      id: 'sf-dome',
      name: 'Botanical Conservatory',
      description: 'Glass-domed sanctuary of rare glowing plants.',
      xPercent: 88,
      yPercent: 38,
    },
  ],
  levelCoordinates: [
    { sequence: 1, xPercent: 19, yPercent: 68 },
    { sequence: 2, xPercent: 26, yPercent: 82 },
    { sequence: 3, xPercent: 36, yPercent: 48 },
    { sequence: 4, xPercent: 50, yPercent: 41 },
    { sequence: 5, xPercent: 62, yPercent: 24 },
    { sequence: 6, xPercent: 76, yPercent: 82 },
    { sequence: 7, xPercent: 78, yPercent: 58 },
    { sequence: 8, xPercent: 86, yPercent: 40 },
  ],
};

export const mathMountainsMap: SubjectMapConfig = {
  subjectId: 'mathematics',
  subjectSlug: 'mathematics',
  mapName: 'Math Mountains',
  mapSlug: 'math-mountains',
  backgroundAsset: '/assets/maps/math-mountains.jpg',
  previewAsset: '/assets/maps/math-mountains.jpg',
  dimensions: { width: 1600, height: 960 },
  oceanColor: '#1b3148',
  borderVariant: 'minimal-slate',
  landmarks: [
    {
      id: 'mm-temple',
      name: 'Temple of Ratios',
      description: 'Carved stone sanctuary beside the alpine lake.',
      xPercent: 13,
      yPercent: 32,
    },
    {
      id: 'mm-bridge',
      name: 'Gorge Suspension Bridge',
      description: 'High crossing between cliffside puzzle plateaus.',
      xPercent: 58,
      yPercent: 47,
    },
    {
      id: 'mm-spire',
      name: 'Summit Theorem Tower',
      description: 'Crystalline beacon atop the highest snowy peak.',
      xPercent: 92,
      yPercent: 15,
    },
  ],
  levelCoordinates: [
    { sequence: 1, xPercent: 14, yPercent: 82 },
    { sequence: 2, xPercent: 20, yPercent: 48 },
    { sequence: 3, xPercent: 30, yPercent: 32 },
    { sequence: 4, xPercent: 50, yPercent: 56 },
    { sequence: 5, xPercent: 66, yPercent: 41 },
    { sequence: 6, xPercent: 76, yPercent: 84 },
    { sequence: 7, xPercent: 82, yPercent: 56 },
    { sequence: 8, xPercent: 89, yPercent: 24 },
  ],
};

export const discoveryIslandMap: SubjectMapConfig = {
  subjectId: 'physics',
  subjectSlug: 'physics',
  mapName: 'Discovery Island',
  mapSlug: 'discovery-island',
  backgroundAsset: '/assets/maps/discovery-island.jpg',
  previewAsset: '/assets/maps/discovery-island.jpg',
  dimensions: { width: 1600, height: 960 },
  oceanColor: '#0c4a6e',
  borderVariant: 'parchment-compass',
  landmarks: [
    {
      id: 'di-shipwreck',
      name: 'Shipwreck Cove',
      description: 'Historic vessel resting in the turquoise bay.',
      xPercent: 20,
      yPercent: 72,
    },
    {
      id: 'di-ruins',
      name: 'Ancient Stone Ruins',
      description: 'Mossy pillars aligned with the sun and stars.',
      xPercent: 22,
      yPercent: 26,
    },
    {
      id: 'di-lighthouse',
      name: 'Beacon Lighthouse',
      description: 'Coastal optics tower guiding island explorers.',
      xPercent: 84,
      yPercent: 20,
    },
  ],
  levelCoordinates: [
    { sequence: 1, xPercent: 42, yPercent: 74 },
    { sequence: 2, xPercent: 28, yPercent: 56 },
    { sequence: 3, xPercent: 23, yPercent: 30 },
    { sequence: 4, xPercent: 43, yPercent: 52 },
    { sequence: 5, xPercent: 54, yPercent: 26 },
    { sequence: 6, xPercent: 63, yPercent: 66 },
    { sequence: 7, xPercent: 80, yPercent: 58 },
    { sequence: 8, xPercent: 84, yPercent: 34 },
  ],
};

export const innovationKingdomMap: SubjectMapConfig = {
  subjectId: 'coding',
  subjectSlug: 'coding',
  mapName: 'Innovation Kingdom',
  mapSlug: 'innovation-kingdom',
  backgroundAsset: '/assets/maps/innovation-kingdom.jpg',
  previewAsset: '/assets/maps/innovation-kingdom.jpg',
  dimensions: { width: 1600, height: 960 },
  oceanColor: '#0f1f38',
  borderVariant: 'minimal-slate',
  landmarks: [
    {
      id: 'ik-citadel',
      name: 'Moated Code Citadel',
      description: 'Grand stone keep guarded by mechanical drawbridges.',
      xPercent: 58,
      yPercent: 22,
    },
    {
      id: 'ik-workshop',
      name: 'Waterwheel Workshop',
      description: 'Brass-and-timber forge for building algorithms.',
      xPercent: 32,
      yPercent: 46,
    },
    {
      id: 'ik-windmills',
      name: 'Clockwork Windmills',
      description: 'Highland ridge powering the kingdom’s logic engines.',
      xPercent: 71,
      yPercent: 46,
    },
  ],
  levelCoordinates: [
    { sequence: 1, xPercent: 25, yPercent: 76 },
    { sequence: 2, xPercent: 18, yPercent: 48 },
    { sequence: 3, xPercent: 32, yPercent: 28 },
    { sequence: 4, xPercent: 43, yPercent: 45 },
    { sequence: 5, xPercent: 60, yPercent: 22 },
    { sequence: 6, xPercent: 52, yPercent: 82 },
    { sequence: 7, xPercent: 77, yPercent: 81 },
    { sequence: 8, xPercent: 82, yPercent: 52 },
  ],
};

export const subjectMaps: Record<string, SubjectMapConfig> = {
  chemistry: knowledgeVillageMap,
  biology: scienceForestMap,
  mathematics: mathMountainsMap,
  physics: discoveryIslandMap,
  coding: innovationKingdomMap,
  // Aliases for direct world-name lookups
  knowledge: knowledgeVillageMap,
  science: scienceForestMap,
  discovery: discoveryIslandMap,
  innovation: innovationKingdomMap,
};

export function getSubjectMapConfig(subjectSlug: string): SubjectMapConfig {
  return subjectMaps[subjectSlug.toLowerCase()] ?? knowledgeVillageMap;
}
