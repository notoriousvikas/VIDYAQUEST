import * as THREE from 'three';

export interface OutfitPalette {
  main: string;
  trim: string;
  accent: string;
  style: 'tunic' | 'blazer' | 'hoodie' | 'robe' | 'jacket' | 'armor';
}

export interface BottomsPalette {
  main: string;
  trim: string;
  isShorts?: boolean;
}

export const SKIN_PALETTE: Record<string, string> = {
  'skin-fair': '#fde2c8',
  'skin-warm': '#f3c69f',
  'skin-tan': '#d99b66',
  'skin-deep': '#9b6441',
  'skin-cosmic-ember': '#fb923c',
};

export const HAIR_PALETTE: Record<string, string> = {
  'haircolor-espresso': '#2c1b18',
  'haircolor-amber': '#b45309',
  'haircolor-midnight': '#111827',
  'haircolor-cobalt': '#2563eb',
};

export const OUTFIT_PALETTE: Record<string, OutfitPalette> = {
  'outfit-tunic-emerald': {
    main: '#10b981',
    trim: '#065f46',
    accent: '#fde68a',
    style: 'tunic',
  },
  'outfit-blazer-scholar': {
    main: '#2563eb',
    trim: '#1e3a8a',
    accent: '#f8fafc',
    style: 'blazer',
  },
  'outfit-hoodie-cyber': {
    main: '#ec4899',
    trim: '#831843',
    accent: '#38bdf8',
    style: 'hoodie',
  },
  'outfit-robe-alchemy': {
    main: '#8b5cf6',
    trim: '#4c1d95',
    accent: '#fcd34d',
    style: 'robe',
  },
  'outfit-jacket-atom': {
    main: '#0ea5e9',
    trim: '#0c4a6e',
    accent: '#e0f2fe',
    style: 'jacket',
  },
  'outfit-armor-royal': {
    main: '#f59e0b',
    trim: '#78350f',
    accent: '#fef3c7',
    style: 'armor',
  },
  'outfit-phoenix-flame': {
    main: '#ef4444',
    trim: '#7f1d1d',
    accent: '#fde047',
    style: 'armor',
  },
  'outfit-basic-tee': { main: '#f8fafc', trim: '#cbd5e1', accent: '#334155', style: 'tunic' },
  'outfit-graphic-star': { main: '#6366f1', trim: '#312e81', accent: '#fde047', style: 'tunic' },
  'outfit-printed-waves': { main: '#06b6d4', trim: '#155e75', accent: '#cffafe', style: 'tunic' },
  'outfit-oversized-cream': { main: '#fde68a', trim: '#b45309', accent: '#78350f', style: 'hoodie' },
  'outfit-formal-oxford': { main: '#e2e8f0', trim: '#475569', accent: '#1e3a8a', style: 'blazer' },
  'outfit-jersey-volt': { main: '#84cc16', trim: '#3f6212', accent: '#fef08a', style: 'tunic' },
  'outfit-school-crest': { main: '#1d4ed8', trim: '#1e3a8a', accent: '#fbbf24', style: 'blazer' },
  'outfit-math-tshirt': { main: '#f59e0b', trim: '#92400e', accent: '#fef3c7', style: 'tunic' },
  'outfit-atom-tshirt': { main: '#0ea5e9', trim: '#0c4a6e', accent: '#bae6fd', style: 'tunic' },
  'outfit-chem-tshirt': { main: '#a855f7', trim: '#581c87', accent: '#f3e8ff', style: 'tunic' },
  'outfit-bio-tshirt': { main: '#22c55e', trim: '#14532d', accent: '#dcfce7', style: 'tunic' },
};

export interface JacketPalette {
  main: string;
  trim: string;
  accent: string;
  kind: 'hoodie' | 'denim' | 'leather' | 'bomber' | 'puffer' | 'zipup' | 'varsity' | 'coat';
}

export const JACKET_PALETTE: Record<string, JacketPalette> = {
  'jacket-zipup-sport': { main: '#0284c7', trim: '#0f172a', accent: '#38bdf8', kind: 'zipup' },
  'jacket-oversized-hoodie': { main: '#64748b', trim: '#334155', accent: '#f8fafc', kind: 'hoodie' },
  'jacket-denim-classic': { main: '#2563eb', trim: '#1e3a8a', accent: '#fbbf24', kind: 'denim' },
  'jacket-leather-noir': { main: '#18181b', trim: '#27272a', accent: '#a1a1aa', kind: 'leather' },
  'jacket-bomber-olive': { main: '#4d7c0f', trim: '#365314', accent: '#f59e0b', kind: 'bomber' },
  'jacket-puffer-arctic': { main: '#e11d48', trim: '#881337', accent: '#f8fafc', kind: 'puffer' },
  'jacket-varsity-crimson': { main: '#991b1b', trim: '#f8fafc', accent: '#fbbf24', kind: 'varsity' },
  'jacket-number-hoodie': { main: '#d97706', trim: '#78350f', accent: '#fde047', kind: 'hoodie' },
  'jacket-scientist': { main: '#38bdf8', trim: '#0c4a6e', accent: '#f8fafc', kind: 'coat' },
  'jacket-potion-hoodie': { main: '#7c3aed', trim: '#4c1d95', accent: '#e9d5ff', kind: 'hoodie' },
  'jacket-lab-coat': { main: '#f8fafc', trim: '#cbd5e1', accent: '#a855f7', kind: 'coat' },
  'jacket-forest-hoodie': { main: '#15803d', trim: '#14532d', accent: '#bbf7d0', kind: 'hoodie' },
};

export const COSTUME_PALETTE: Record<
  string,
  { main: string; trim: string; accent: string; pants: string; style: 'armor' | 'robe' | 'suit' }
> = {
  'costume-seasonal': { main: '#dc2626', trim: '#f8fafc', accent: '#fbbf24', pants: '#7f1d1d', style: 'robe' },
  'costume-explorer': { main: '#a16207', trim: '#713f12', accent: '#fde047', pants: '#78350f', style: 'suit' },
  'costume-scientist': { main: '#f8fafc', trim: '#334155', accent: '#38bdf8', pants: '#1e293b', style: 'suit' },
  'costume-physics-suit': { main: '#0284c7', trim: '#0f172a', accent: '#38bdf8', pants: '#0c4a6e', style: 'armor' },
  'costume-wizard': { main: '#5b21b6', trim: '#2e1065', accent: '#fbbf24', pants: '#3b0764', style: 'robe' },
  'costume-warrior': { main: '#64748b', trim: '#1e293b', accent: '#fbbf24', pants: '#334155', style: 'armor' },
  'costume-astronaut': { main: '#f1f5f9', trim: '#475569', accent: '#f97316', pants: '#cbd5e1', style: 'armor' },
  'costume-superhero': { main: '#dc2626', trim: '#1d4ed8', accent: '#fde047', pants: '#1e3a8a', style: 'armor' },
  'costume-cyber': { main: '#0f172a', trim: '#06b6d4', accent: '#22d3ee', pants: '#020617', style: 'armor' },
  'costume-royal-king': { main: '#b91c1c', trim: '#fbbf24', accent: '#fef08a', pants: '#7f1d1d', style: 'armor' },
};

export const BOTTOMS_PALETTE: Record<string, BottomsPalette> = {
  'bottoms-explorer-pants': { main: '#1e293b', trim: '#334155', isShorts: false },
  'bottoms-cargo-shorts': { main: '#78716c', trim: '#57534e', isShorts: true },
  'bottoms-denim-jeans': { main: '#1d4ed8', trim: '#1e3a8a', isShorts: false },
  'bottoms-cyber-greaves': { main: '#0f172a', trim: '#22d3ee', isShorts: false },
  'bottoms-royal-legguards': { main: '#92400e', trim: '#fbbf24', isShorts: false },
  'bottoms-joggers-charcoal': { main: '#334155', trim: '#1e293b', isShorts: false },
  'bottoms-formal-navy': { main: '#1e1b4b', trim: '#312e81', isShorts: false },
};

export const SHOES_PALETTE: Record<string, { main: string; sole: string; accent: string }> = {
  'shoes-boots-brown': { main: '#78350f', sole: '#292524', accent: '#b45309' },
  'shoes-sneakers-sky': { main: '#0284c7', sole: '#f8fafc', accent: '#38bdf8' },
  'shoes-greaves-gold': { main: '#d97706', sole: '#451a03', accent: '#fde047' },
  'shoes-hightops-crimson': { main: '#dc2626', sole: '#f8fafc', accent: '#fca5a5' },
  'shoes-sports-neon': { main: '#84cc16', sole: '#f8fafc', accent: '#fef08a' },
  'shoes-casual-canvas': { main: '#e2e8f0', sole: '#94a3b8', accent: '#334155' },
  'shoes-royal-sneakers': { main: '#eab308', sole: '#ffffff', accent: '#fde047' },
  'shoes-trail-emerald': { main: '#10b981', sole: '#064e3b', accent: '#a7f3d0' },
};

export function makeMat(
  color: string | number,
  opts: {
    roughness?: number;
    metalness?: number;
    emissive?: string | number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.06,
    emissive: opts.emissive !== undefined ? new THREE.Color(opts.emissive) : undefined,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}
