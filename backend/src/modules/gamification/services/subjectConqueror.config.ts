export interface SubjectConquerorConfig {
  subjectSlug: string;
  subjectName: string;
  kingdomName: string;
  conquerorTitle: string;
  achievementCode: string;
  xpBonus: number;
  crownItemKey: string;
  rewardItemKeys: string[];
  accentColor: string;
}

export const SUBJECT_CONQUEROR_CONFIGS: Record<string, SubjectConquerorConfig> = {
  mathematics: {
    subjectSlug: 'mathematics',
    subjectName: 'Mathematics',
    kingdomName: 'Number Kingdom',
    conquerorTitle: 'Math King',
    achievementCode: 'CONQUEROR_MATHEMATICS',
    xpBonus: 300,
    crownItemKey: 'headwear-crown-math',
    rewardItemKeys: [
      'headwear-crown-math',
      'cape-math-royal',
      'aura-numbers',
      'backpack-calculator-gold',
    ],
    accentColor: '#f59e0b',
  },
  physics: {
    subjectSlug: 'physics',
    subjectName: 'Physics',
    kingdomName: 'Atom Kingdom',
    conquerorTitle: 'Atom Emperor',
    achievementCode: 'CONQUEROR_PHYSICS',
    xpBonus: 300,
    crownItemKey: 'headwear-crown-atom',
    rewardItemKeys: ['headwear-crown-atom', 'backpack-atom-glow', 'aura-energy'],
    accentColor: '#38bdf8',
  },
  chemistry: {
    subjectSlug: 'chemistry',
    subjectName: 'Chemistry',
    kingdomName: 'Alchemy Castle',
    conquerorTitle: 'Alchemy King',
    achievementCode: 'CONQUEROR_CHEMISTRY',
    xpBonus: 300,
    crownItemKey: 'headwear-crown-alchemy',
    rewardItemKeys: ['headwear-crown-alchemy', 'backpack-potion', 'aura-chemical'],
    accentColor: '#a855f7',
  },
  biology: {
    subjectSlug: 'biology',
    subjectName: 'Biology',
    kingdomName: 'Life Forest',
    conquerorTitle: 'Nature Guardian',
    achievementCode: 'CONQUEROR_BIOLOGY',
    xpBonus: 300,
    crownItemKey: 'headwear-crown-nature',
    rewardItemKeys: ['headwear-crown-nature', 'backpack-leaf-wings', 'cape-nature-guardian'],
    accentColor: '#22c55e',
  },
  'computer-science': {
    subjectSlug: 'computer-science',
    subjectName: 'Computer Science',
    kingdomName: 'Cyber Citadel',
    conquerorTitle: 'Code Master',
    achievementCode: 'CONQUEROR_CS',
    xpBonus: 300,
    crownItemKey: 'headwear-crown-cyber',
    rewardItemKeys: ['headwear-crown-cyber', 'backpack-digital', 'aura-code'],
    accentColor: '#06b6d4',
  },
  coding: {
    subjectSlug: 'coding',
    subjectName: 'Coding',
    kingdomName: 'Code Citadel',
    conquerorTitle: 'Code Master',
    achievementCode: 'CONQUEROR_CODING',
    xpBonus: 300,
    crownItemKey: 'headwear-crown-cyber',
    rewardItemKeys: ['headwear-crown-cyber', 'backpack-digital', 'aura-code'],
    accentColor: '#06b6d4',
  },
  english: {
    subjectSlug: 'english',
    subjectName: 'English',
    kingdomName: 'Lexicon Spire',
    conquerorTitle: 'Word Wizard',
    achievementCode: 'CONQUEROR_ENGLISH',
    xpBonus: 300,
    crownItemKey: 'headwear-wizard-word',
    rewardItemKeys: ['headwear-wizard-word', 'backpack-book-magic'],
    accentColor: '#ec4899',
  },
  geography: {
    subjectSlug: 'geography',
    subjectName: 'Geography',
    kingdomName: 'Terra Realm',
    conquerorTitle: 'World Explorer',
    achievementCode: 'CONQUEROR_GEOGRAPHY',
    xpBonus: 300,
    crownItemKey: 'headwear-explorer-geo',
    rewardItemKeys: ['headwear-explorer-geo', 'backpack-globe', 'cape-adventure'],
    accentColor: '#10b981',
  },
};

export function getSubjectConquerorConfig(subjectSlug: string): SubjectConquerorConfig | null {
  return SUBJECT_CONQUEROR_CONFIGS[subjectSlug.toLowerCase()] ?? null;
}
