import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { AvatarAppearance, AvatarEquippedItems, FlameTier } from '@/types/student';
import {
  BOTTOMS_PALETTE,
  COSTUME_PALETTE,
  HAIR_PALETTE,
  JACKET_PALETTE,
  makeMat,
  OUTFIT_PALETTE,
  SHOES_PALETTE,
  SKIN_PALETTE,
} from './avatarMaterials';

export interface AvatarRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  atomOrbitGroup: THREE.Group | null;
  thrusterFlames: THREE.Mesh[];
  wingsGroup: THREE.Group | null;
  streakAuraGroup: THREE.Group | null;
}

function rbox(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  radius = 0.04,
  segments = 3,
  castShadow = true,
): THREE.Mesh {
  const geo = new RoundedBoxGeometry(w, h, d, segments, radius);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

function buildHeadDetails(
  headGroup: THREE.Group,
  app: AvatarAppearance,
  eq: AvatarEquippedItems,
  skinHex: string,
  hairHex: string,
) {
  const skinMat = makeMat(skinHex, { roughness: 0.62, metalness: 0.02 });
  const hairMat = makeMat(hairHex, { roughness: 0.55, metalness: 0.08 });
  const darkMat = makeMat('#0f172a', { roughness: 0.35, metalness: 0.1 });
  const whiteMat = makeMat('#ffffff', { roughness: 0.25, metalness: 0.05 });

  // Main stylized cubic head
  const headMesh = rbox(0.84, 0.78, 0.78, skinMat, 0.09, 4);
  headGroup.add(headMesh);

  // Ears
  const leftEar = rbox(0.1, 0.2, 0.14, skinMat, 0.03, 2);
  leftEar.position.set(-0.44, -0.02, 0.02);
  const rightEar = rbox(0.1, 0.2, 0.14, skinMat, 0.03, 2);
  rightEar.position.set(0.44, -0.02, 0.02);
  headGroup.add(leftEar, rightEar);

  // Rosy cheeks
  const cheekMat = makeMat('#fb7185', { roughness: 0.7, transparent: true, opacity: 0.38 });
  const cheekL = rbox(0.12, 0.06, 0.02, cheekMat, 0.02, 2, false);
  cheekL.position.set(-0.24, -0.1, 0.39);
  const cheekR = rbox(0.12, 0.06, 0.02, cheekMat, 0.02, 2, false);
  cheekR.position.set(0.24, -0.1, 0.39);
  headGroup.add(cheekL, cheekR);

  // Eyes
  const eyeZ = 0.395;
  if (app.eyes === 'eyes-visor') {
    const visorFrame = rbox(0.62, 0.16, 0.06, darkMat, 0.03, 2);
    visorFrame.position.set(0, 0.03, eyeZ);
    const glowMat = makeMat('#38bdf8', {
      roughness: 0.2,
      metalness: 0.4,
      emissive: '#0ea5e9',
      emissiveIntensity: 0.9,
    });
    const visorGlow = rbox(0.54, 0.09, 0.03, glowMat, 0.02, 2, false);
    visorGlow.position.set(0, 0.03, eyeZ + 0.022);
    headGroup.add(visorFrame, visorGlow);
  } else {
    for (const side of [-1, 1]) {
      const ex = side * 0.17;
      // Sclera / base
      const eyeBg = rbox(0.13, 0.15, 0.03, whiteMat, 0.025, 2, false);
      eyeBg.position.set(ex, 0.02, eyeZ);
      const pupil = rbox(0.09, 0.12, 0.035, darkMat, 0.02, 2, false);
      pupil.position.set(ex, 0.02, eyeZ + 0.006);
      const glint = rbox(0.035, 0.04, 0.02, whiteMat, 0.01, 1, false);
      glint.position.set(ex - 0.022, 0.055, eyeZ + 0.02);
      headGroup.add(eyeBg, pupil, glint);

      if (app.eyes === 'eyes-sparkle') {
        const starMat = makeMat('#fde047', {
          emissive: '#facc15',
          emissiveIntensity: 0.85,
          roughness: 0.2,
        });
        const star = rbox(0.032, 0.032, 0.02, starMat, 0.01, 1, false);
        star.position.set(ex + 0.022, -0.015, eyeZ + 0.02);
        headGroup.add(star);
      }

      // Eyebrow
      const brow = rbox(0.14, 0.035, 0.03, hairMat, 0.01, 1, false);
      brow.position.set(ex, 0.135, eyeZ + 0.005);
      if (app.face === 'face-focused') {
        brow.rotation.z = side * -0.22;
      }
      headGroup.add(brow);
    }
  }

  // Mouth / Expression
  const mouthMat = makeMat('#5c2314', { roughness: 0.5 });
  if (app.face === 'face-focused') {
    const mouth = rbox(0.18, 0.038, 0.03, mouthMat, 0.01, 1, false);
    mouth.position.set(0, -0.17, eyeZ + 0.004);
    mouth.rotation.z = 0.06;
    headGroup.add(mouth);
  } else if (app.face === 'face-excited') {
    const mouthOuter = rbox(0.24, 0.12, 0.03, makeMat('#9f1239', { roughness: 0.4 }), 0.03, 2, false);
    mouthOuter.position.set(0, -0.18, eyeZ + 0.004);
    const teeth = rbox(0.18, 0.035, 0.02, whiteMat, 0.01, 1, false);
    teeth.position.set(0, -0.145, eyeZ + 0.014);
    headGroup.add(mouthOuter, teeth);
  } else {
    // Cheerful smile
    const smileBase = rbox(0.2, 0.045, 0.03, mouthMat, 0.015, 2, false);
    smileBase.position.set(0, -0.18, eyeZ + 0.004);
    const cornerL = rbox(0.045, 0.045, 0.03, mouthMat, 0.01, 1, false);
    cornerL.position.set(-0.1, -0.155, eyeZ + 0.004);
    const cornerR = rbox(0.045, 0.045, 0.03, mouthMat, 0.01, 1, false);
    cornerR.position.set(0.1, -0.155, eyeZ + 0.004);
    headGroup.add(smileBase, cornerL, cornerR);
  }

  // Hairstyles (skip bulky top hair if astronaut helmet is equipped)
  const hasFullHelmet = eq.headwear === 'headwear-astronaut';
  if (!hasFullHelmet) {
    const capTop = rbox(0.88, 0.18, 0.84, hairMat, 0.06, 3);
    capTop.position.set(0, 0.36, -0.01);
    const backHair = rbox(0.86, 0.56, 0.18, hairMat, 0.05, 3);
    backHair.position.set(0, 0.08, -0.34);
    headGroup.add(capTop, backHair);

    if (app.hairstyle === 'hair-explorer') {
      const bangs = rbox(0.76, 0.15, 0.18, hairMat, 0.04, 2);
      bangs.position.set(0.04, 0.29, 0.34);
      bangs.rotation.z = -0.08;
      const sideL = rbox(0.1, 0.32, 0.52, hairMat, 0.03, 2);
      sideL.position.set(-0.41, 0.18, -0.08);
      const sideR = rbox(0.1, 0.32, 0.52, hairMat, 0.03, 2);
      sideR.position.set(0.41, 0.18, -0.08);
      headGroup.add(bangs, sideL, sideR);
    } else if (app.hairstyle === 'hair-waves') {
      const waveL = rbox(0.14, 0.66, 0.58, hairMat, 0.05, 3);
      waveL.position.set(-0.43, 0.02, -0.06);
      const waveR = rbox(0.14, 0.66, 0.58, hairMat, 0.05, 3);
      waveR.position.set(0.43, 0.02, -0.06);
      const bangs = rbox(0.8, 0.14, 0.16, hairMat, 0.04, 2);
      bangs.position.set(0, 0.31, 0.34);
      headGroup.add(waveL, waveR, bangs);
    } else if (app.hairstyle === 'hair-ponytail') {
      const band = rbox(0.16, 0.16, 0.1, makeMat('#f59e0b', { roughness: 0.4 }), 0.04, 2);
      band.position.set(0, 0.16, -0.45);
      const tail = rbox(0.24, 0.52, 0.24, hairMat, 0.07, 3);
      tail.position.set(0, 0.02, -0.56);
      tail.rotation.x = 0.25;
      const bangs = rbox(0.74, 0.12, 0.14, hairMat, 0.04, 2);
      bangs.position.set(0, 0.31, 0.34);
      headGroup.add(band, tail, bangs);
    } else if (app.hairstyle === 'hair-spiky') {
      const spikeOffsets = [
        [-0.24, 0.48, 0.1, 0.2],
        [0, 0.52, 0.12, 0],
        [0.24, 0.48, 0.1, -0.2],
        [-0.14, 0.46, -0.14, 0.15],
        [0.14, 0.46, -0.14, -0.15],
      ];
      for (const [sx, sy, sz, rz] of spikeOffsets) {
        const spike = rbox(0.2, 0.28, 0.2, hairMat, 0.03, 2);
        spike.position.set(sx, sy, sz);
        spike.rotation.z = rz;
        spike.rotation.x = 0.18;
        headGroup.add(spike);
      }
    } else if (app.hairstyle === 'hair-bob') {
      const sideL = rbox(0.14, 0.54, 0.62, hairMat, 0.04, 2);
      sideL.position.set(-0.42, 0.08, -0.02);
      const sideR = rbox(0.14, 0.54, 0.62, hairMat, 0.04, 2);
      sideR.position.set(0.42, 0.08, -0.02);
      const bangs = rbox(0.78, 0.14, 0.16, hairMat, 0.04, 2);
      bangs.position.set(0, 0.29, 0.34);
      headGroup.add(sideL, sideR, bangs);
    } else if (app.hairstyle === 'hair-curly') {
      const puffs = [
        [-0.26, 0.44, 0.18],
        [0, 0.48, 0.2],
        [0.26, 0.44, 0.18],
        [-0.36, 0.32, -0.05],
        [0.36, 0.32, -0.05],
        [0, 0.46, -0.18],
      ];
      for (const [px, py, pz] of puffs) {
        const puff = rbox(0.32, 0.28, 0.32, hairMat, 0.1, 3);
        puff.position.set(px, py, pz);
        headGroup.add(puff);
      }
    }
  }

  // Glasses
  if (eq.glasses === 'glasses-round') {
    const frameMat = makeMat('#fbbf24', { roughness: 0.25, metalness: 0.7 });
    const lensMat = makeMat('#e0f2fe', {
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.28,
    });
    for (const side of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 20), frameMat);
      ring.position.set(side * 0.17, 0.02, 0.43);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), lensMat);
      lens.position.set(side * 0.17, 0.02, 0.425);
      headGroup.add(ring, lens);
    }
    const bridge = rbox(0.12, 0.025, 0.025, frameMat, 0.008, 1, false);
    bridge.position.set(0, 0.03, 0.43);
    headGroup.add(bridge);
  } else if (eq.glasses === 'glasses-goggles') {
    const goggleFrame = makeMat('#f59e0b', { roughness: 0.3, metalness: 0.4 });
    const goggleLens = makeMat('#38bdf8', {
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.45,
      emissive: '#0284c7',
      emissiveIntensity: 0.25,
    });
    const strap = rbox(0.88, 0.09, 0.82, makeMat('#334155', { roughness: 0.7 }), 0.02, 2, false);
    strap.position.set(0, 0.03, -0.01);
    headGroup.add(strap);
    for (const side of [-1, 1]) {
      const box = rbox(0.24, 0.19, 0.08, goggleFrame, 0.04, 2);
      box.position.set(side * 0.18, 0.03, 0.42);
      const lens = rbox(0.18, 0.13, 0.03, goggleLens, 0.02, 2, false);
      lens.position.set(side * 0.18, 0.03, 0.455);
      headGroup.add(box, lens);
    }
  }

  // Headwear
  if (eq.headwear === 'headwear-cap') {
    const capRed = makeMat('#ef4444', { roughness: 0.5 });
    const capDark = makeMat('#b91c1c', { roughness: 0.5 });
    const dome = rbox(0.88, 0.22, 0.86, capRed, 0.07, 3);
    dome.position.set(0, 0.41, 0);
    const brim = rbox(0.76, 0.05, 0.38, capDark, 0.02, 2);
    brim.position.set(0, 0.32, 0.5);
    brim.rotation.x = 0.08;
    const emblem = rbox(0.14, 0.1, 0.04, makeMat('#fbbf24', { metalness: 0.5, roughness: 0.3 }), 0.02, 1);
    emblem.position.set(0, 0.42, 0.43);
    headGroup.add(dome, brim, emblem);
  } else if (eq.headwear === 'headwear-wizard') {
    const hatMat = makeMat('#6d28d9', { roughness: 0.5 });
    const goldMat = makeMat('#fbbf24', { roughness: 0.25, metalness: 0.65 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.64, 0.06, 16), hatMat);
    brim.position.set(0, 0.4, 0);
    brim.castShadow = true;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.1, 16), goldMat);
    band.position.set(0, 0.46, 0);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.68, 12), hatMat);
    cone.position.set(0, 0.8, -0.03);
    cone.rotation.x = -0.12;
    cone.castShadow = true;
    headGroup.add(brim, band, cone);
  } else if (
    eq.headwear === 'headwear-crown' ||
    eq.headwear === 'headwear-crown-math' ||
    eq.headwear === 'headwear-crown-atom' ||
    eq.headwear === 'headwear-crown-alchemy' ||
    eq.headwear === 'headwear-crown-nature' ||
    eq.headwear === 'headwear-crown-cyber'
  ) {
    const crownPalette: Record<string, { metal: string; gem: string }> = {
      'headwear-crown': { metal: '#fbbf24', gem: '#10b981' },
      'headwear-crown-math': { metal: '#fbbf24', gem: '#38bdf8' },
      'headwear-crown-atom': { metal: '#38bdf8', gem: '#fde047' },
      'headwear-crown-alchemy': { metal: '#c084fc', gem: '#f472b6' },
      'headwear-crown-nature': { metal: '#22c55e', gem: '#fbbf24' },
      'headwear-crown-cyber': { metal: '#06b6d4', gem: '#22d3ee' },
    };
    const cp = crownPalette[eq.headwear] ?? crownPalette['headwear-crown'];
    const goldMat = makeMat(cp.metal, {
      roughness: 0.2,
      metalness: 0.8,
      emissive: cp.metal,
      emissiveIntensity: 0.18,
    });
    const base = rbox(0.64, 0.12, 0.64, goldMat, 0.03, 2);
    base.position.set(0, 0.45, 0);
    headGroup.add(base);
    const peaks = [
      [-0.22, 0.22],
      [0, 0.25],
      [0.22, 0.22],
      [-0.22, -0.22],
      [0.22, -0.22],
    ];
    for (const [px, pz] of peaks) {
      const peak = rbox(0.11, 0.19, 0.11, goldMat, 0.02, 2);
      peak.position.set(px, 0.56, pz);
      headGroup.add(peak);
    }
    const gem = rbox(
      0.11,
      0.11,
      0.05,
      makeMat(cp.gem, { emissive: cp.gem, emissiveIntensity: 0.8 }),
      0.02,
      1,
    );
    gem.position.set(0, 0.46, 0.32);
    headGroup.add(gem);
  } else if (eq.headwear === 'headwear-wizard-word') {
    const hatMat = makeMat('#be185d', { roughness: 0.5 });
    const goldMat = makeMat('#fde047', { roughness: 0.25, metalness: 0.65 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.64, 0.06, 16), hatMat);
    brim.position.set(0, 0.4, 0);
    brim.castShadow = true;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.1, 16), goldMat);
    band.position.set(0, 0.46, 0);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.68, 12), hatMat);
    cone.position.set(0, 0.8, -0.03);
    cone.rotation.x = -0.12;
    cone.castShadow = true;
    headGroup.add(brim, band, cone);
  } else if (eq.headwear === 'headwear-explorer-geo') {
    const hatMat = makeMat('#92400e', { roughness: 0.65 });
    const bandMat = makeMat('#10b981', { roughness: 0.4 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.66, 0.05, 16), hatMat);
    brim.position.set(0, 0.39, 0);
    brim.castShadow = true;
    const crown = rbox(0.56, 0.24, 0.56, hatMat, 0.06, 2);
    crown.position.set(0, 0.52, 0);
    const band = rbox(0.58, 0.07, 0.58, bandMat, 0.02, 2);
    band.position.set(0, 0.44, 0);
    headGroup.add(brim, crown, band);
  } else if (eq.headwear === 'headwear-headphones-neon') {
    const bandMat = makeMat('#0f172a', { roughness: 0.35, metalness: 0.5 });
    const glowMat = makeMat('#22d3ee', {
      emissive: '#06b6d4',
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const arc = rbox(0.94, 0.08, 0.14, bandMat, 0.03, 2);
    arc.position.set(0, 0.44, 0);
    headGroup.add(arc);
    for (const side of [-1, 1]) {
      const cup = rbox(0.12, 0.28, 0.24, bandMat, 0.04, 2);
      cup.position.set(side * 0.47, 0.04, 0);
      const ring = rbox(0.04, 0.18, 0.16, glowMat, 0.02, 1);
      ring.position.set(side * 0.53, 0.04, 0);
      headGroup.add(cup, ring);
    }
  } else if (eq.headwear === 'headwear-beanie') {
    const beanieMat = makeMat('#0d9488', { roughness: 0.75 });
    const cuffMat = makeMat('#14b8a6', { roughness: 0.7 });
    const dome = rbox(0.88, 0.28, 0.86, beanieMat, 0.1, 3);
    dome.position.set(0, 0.42, 0);
    const cuff = rbox(0.92, 0.12, 0.9, cuffMat, 0.04, 2);
    cuff.position.set(0, 0.31, 0);
    const pom = rbox(0.18, 0.18, 0.18, makeMat('#fde047', { roughness: 0.7 }), 0.07, 3);
    pom.position.set(0, 0.6, -0.02);
    headGroup.add(dome, cuff, pom);
  } else if (eq.headwear === 'headwear-astronaut') {
    const shellMat = makeMat('#f8fafc', { roughness: 0.25, metalness: 0.3 });
    const glassMat = makeMat('#38bdf8', {
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.32,
    });
    const frame = rbox(1.04, 0.98, 1.02, shellMat, 0.14, 3);
    frame.position.set(0, 0.02, -0.04);
    const visor = rbox(0.84, 0.68, 0.12, glassMat, 0.08, 3, false);
    visor.position.set(0, 0.04, 0.46);
    const antenna = rbox(0.05, 0.24, 0.05, makeMat('#f59e0b', { metalness: 0.6 }), 0.01, 1);
    antenna.position.set(0.42, 0.56, -0.1);
    headGroup.add(frame, visor, antenna);
  }
}

export function buildBlockAvatar(
  appearanceInput?: Partial<AvatarAppearance>,
  equippedInput?: Partial<AvatarEquippedItems>,
  flameTier: FlameTier = 'none',
): AvatarRig {
  const app: AvatarAppearance = {
    skinTone: appearanceInput?.skinTone ?? 'skin-warm',
    hairstyle: appearanceInput?.hairstyle ?? 'hair-explorer',
    hairColor: appearanceInput?.hairColor ?? 'haircolor-espresso',
    face: appearanceInput?.face ?? 'face-smile',
    eyes: appearanceInput?.eyes ?? 'eyes-bright',
    outfit: appearanceInput?.outfit ?? 'outfit-tunic-emerald',
    jacket: appearanceInput?.jacket ?? 'jacket-none',
    bottoms: appearanceInput?.bottoms ?? 'bottoms-explorer-pants',
    shoes: appearanceInput?.shoes ?? 'shoes-boots-brown',
    costume: appearanceInput?.costume ?? 'costume-none',
  };

  const eq: AvatarEquippedItems = {
    headwear: equippedInput?.headwear ?? 'headwear-none',
    glasses: equippedInput?.glasses ?? 'glasses-none',
    backpack: equippedInput?.backpack ?? 'backpack-canvas',
    cape: equippedInput?.cape ?? 'cape-none',
    aura: equippedInput?.aura ?? 'aura-none',
    neckwear: equippedInput?.neckwear ?? 'neckwear-none',
    wristwear: equippedInput?.wristwear ?? 'wristwear-none',
    badge: equippedInput?.badge ?? 'badge-none',
    accessory: equippedInput?.accessory ?? 'accessory-none',
  };

  const skinHex = SKIN_PALETTE[app.skinTone] ?? SKIN_PALETTE['skin-warm'];
  const hairHex = HAIR_PALETTE[app.hairColor] ?? HAIR_PALETTE['haircolor-espresso'];
  const activeCostume =
    app.costume && app.costume !== 'costume-none' ? COSTUME_PALETTE[app.costume] : undefined;
  const activeJacket =
    !activeCostume && app.jacket && app.jacket !== 'jacket-none'
      ? JACKET_PALETTE[app.jacket]
      : undefined;
  const outfit = activeCostume
    ? { main: activeCostume.main, trim: activeCostume.trim, accent: activeCostume.accent, style: activeCostume.style }
    : (OUTFIT_PALETTE[app.outfit] ?? OUTFIT_PALETTE['outfit-tunic-emerald']);
  const bottoms = activeCostume
    ? { main: activeCostume.pants, trim: activeCostume.trim, isShorts: false }
    : (BOTTOMS_PALETTE[app.bottoms ?? 'bottoms-explorer-pants'] ?? BOTTOMS_PALETTE['bottoms-explorer-pants']);
  const shoes = SHOES_PALETTE[app.shoes] ?? SHOES_PALETTE['shoes-boots-brown'];

  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Pedestal base (sleek game-lobby platform grounded on y=0)
  const pedestalMat = makeMat('#0f172a', { roughness: 0.35, metalness: 0.65 });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.12, 0.1, 8), pedestalMat);
  pedestal.position.y = -0.05;
  pedestal.receiveShadow = true;
  const innerPadMat = makeMat('#1e293b', { roughness: 0.4, metalness: 0.4 });
  const innerPad = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.78, 0.02, 8), innerPadMat);
  innerPad.position.y = 0.005;
  innerPad.receiveShadow = true;
  const ringMat = makeMat('#fbbf24', {
    roughness: 0.25,
    metalness: 0.6,
    emissive: '#f59e0b',
    emissiveIntensity: 0.45,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.022, 8, 8), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.rotation.z = Math.PI / 8;
  ring.position.y = 0.0;
  root.add(pedestal, innerPad, ring);

  // Materials
  const skinMat = makeMat(skinHex, { roughness: 0.62, metalness: 0.02 });
  const outfitMat = makeMat(outfit.main, {
    roughness: outfit.style === 'armor' ? 0.3 : 0.55,
    metalness: outfit.style === 'armor' ? 0.45 : 0.06,
  });
  const trimMat = makeMat(outfit.trim, { roughness: 0.45, metalness: 0.15 });
  const accentMat = makeMat(outfit.accent, { roughness: 0.35, metalness: 0.35 });
  const bottomsMat = makeMat(bottoms.main, { roughness: 0.65, metalness: 0.05 });
  const bottomsTrimMat = makeMat(bottoms.trim, {
    roughness: 0.35,
    metalness: 0.3,
    emissive: app.bottoms === 'bottoms-cyber-greaves' ? '#22d3ee' : '#000000',
    emissiveIntensity: app.bottoms === 'bottoms-cyber-greaves' ? 0.5 : 0,
  });
  const shoeMainMat = makeMat(shoes.main, { roughness: 0.45, metalness: 0.15 });
  const shoeSoleMat = makeMat(shoes.sole, { roughness: 0.7 });
  const shoeAccentMat = makeMat(shoes.accent, { roughness: 0.3, metalness: 0.4 });

  // Torso Group (centered around y=1.12)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.12, 0);
  bodyGroup.add(torsoGroup);

  const torsoMesh = rbox(0.76, 0.82, 0.44, outfitMat, 0.06, 3);
  torsoGroup.add(torsoMesh);

  // Outfit collar & belt details
  const collar = rbox(0.42, 0.1, 0.46, accentMat, 0.02, 2);
  collar.position.set(0, 0.35, 0.01);
  const belt = rbox(0.78, 0.1, 0.46, trimMat, 0.02, 2);
  belt.position.set(0, -0.3, 0);
  const buckle = rbox(0.16, 0.12, 0.05, makeMat('#fbbf24', { metalness: 0.75, roughness: 0.2 }), 0.02, 2);
  buckle.position.set(0, -0.3, 0.23);
  torsoGroup.add(collar, belt, buckle);

  if (outfit.style === 'hoodie') {
    const pocket = rbox(0.46, 0.2, 0.06, trimMat, 0.03, 2);
    pocket.position.set(0, -0.12, 0.22);
    const hood = rbox(0.62, 0.18, 0.22, trimMat, 0.05, 2);
    hood.position.set(0, 0.34, -0.24);
    torsoGroup.add(pocket, hood);
  } else if (outfit.style === 'armor') {
    for (const side of [-1, 1]) {
      const pauldron = rbox(0.28, 0.16, 0.48, accentMat, 0.04, 2);
      pauldron.position.set(side * 0.42, 0.34, 0);
      torsoGroup.add(pauldron);
    }
  } else if (outfit.style === 'blazer') {
    const tie = rbox(0.1, 0.34, 0.04, makeMat('#f59e0b', { roughness: 0.4 }), 0.015, 2);
    tie.position.set(0, 0.12, 0.225);
    torsoGroup.add(tie);
  }

  // Chest Badge
  if (eq.badge !== 'badge-none') {
    const badgeColor =
      eq.badge === 'badge-curious'
        ? '#f59e0b'
        : eq.badge === 'badge-first-steps'
          ? '#38bdf8'
          : eq.badge === 'badge-flame-streak'
            ? '#f97316'
            : eq.badge === 'badge-inferno-crest'
              ? '#a855f7'
              : '#34d399';
    const badgeMat = makeMat(badgeColor, {
      metalness: 0.65,
      roughness: 0.2,
      emissive: badgeColor,
      emissiveIntensity: 0.35,
    });
    const badge = rbox(0.14, 0.14, 0.04, badgeMat, 0.03, 2);
    badge.position.set(0.2, 0.16, 0.25);
    torsoGroup.add(badge);
  }

  // Layered 3D Jacket (renders over shirt when equipped)
  if (activeJacket) {
    const jMain = makeMat(activeJacket.main, {
      roughness: activeJacket.kind === 'leather' ? 0.35 : 0.6,
      metalness: activeJacket.kind === 'leather' ? 0.25 : 0.05,
    });
    const jTrim = makeMat(activeJacket.trim, { roughness: 0.5 });
    const jAccent = makeMat(activeJacket.accent, { roughness: 0.35, metalness: 0.3 });

    // Open front jacket panels on left/right + back shell
    const backShell = rbox(0.8, 0.8, 0.26, jMain, 0.06, 3);
    backShell.position.set(0, 0.01, -0.12);
    const panelL = rbox(0.28, 0.78, 0.24, jMain, 0.05, 2);
    panelL.position.set(-0.26, 0.01, 0.12);
    const panelR = rbox(0.28, 0.78, 0.24, jMain, 0.05, 2);
    panelR.position.set(0.26, 0.01, 0.12);
    torsoGroup.add(backShell, panelL, panelR);

    if (activeJacket.kind === 'hoodie') {
      const hood = rbox(0.64, 0.2, 0.24, jTrim, 0.06, 2);
      hood.position.set(0, 0.34, -0.25);
      const pocket = rbox(0.52, 0.22, 0.06, jTrim, 0.03, 2);
      pocket.position.set(0, -0.16, 0.23);
      torsoGroup.add(hood, pocket);
    } else if (activeJacket.kind === 'zipup' || activeJacket.kind === 'denim') {
      const zip = rbox(0.05, 0.72, 0.04, jAccent, 0.01, 1);
      zip.position.set(0, 0.0, 0.23);
      torsoGroup.add(zip);
    } else if (activeJacket.kind === 'puffer') {
      for (const py of [-0.18, 0.04, 0.24]) {
        const rib = rbox(0.82, 0.14, 0.49, jMain, 0.05, 2);
        rib.position.set(0, py, 0);
        torsoGroup.add(rib);
      }
    } else if (activeJacket.kind === 'coat') {
      const coatTail = rbox(0.78, 0.28, 0.45, jMain, 0.04, 2);
      coatTail.position.set(0, -0.44, -0.02);
      torsoGroup.add(coatTail);
    }
  }

  // Neckwear (Scarf or Gold Chain)
  if (eq.neckwear === 'neckwear-scarf-crimson') {
    const scarfMat = makeMat('#dc2626', { roughness: 0.75 });
    const ringScarf = rbox(0.54, 0.14, 0.48, scarfMat, 0.05, 2);
    ringScarf.position.set(0, 0.41, 0);
    const tail = rbox(0.18, 0.36, 0.06, scarfMat, 0.03, 2);
    tail.position.set(0.14, 0.2, 0.25);
    torsoGroup.add(ringScarf, tail);
  } else if (eq.neckwear === 'neckwear-gold-chain') {
    const chainMat = makeMat('#fbbf24', { metalness: 0.85, roughness: 0.2 });
    const chain = rbox(0.36, 0.06, 0.38, chainMat, 0.02, 2);
    chain.position.set(0, 0.36, 0.06);
    const medal = rbox(0.12, 0.14, 0.04, chainMat, 0.02, 1);
    medal.position.set(0, 0.24, 0.24);
    torsoGroup.add(chain, medal);
  }

  // Backpack (attached to torsoGroup)
  const thrusterFlames: THREE.Mesh[] = [];
  let wingsGroup: THREE.Group | null = null;

  if (eq.backpack === 'backpack-canvas') {
    const packMat = makeMat('#92400e', { roughness: 0.7 });
    const flapMat = makeMat('#b45309', { roughness: 0.6 });
    const pack = rbox(0.56, 0.58, 0.26, packMat, 0.06, 3);
    pack.position.set(0, 0.02, -0.34);
    const flap = rbox(0.58, 0.2, 0.28, flapMat, 0.05, 2);
    flap.position.set(0, 0.22, -0.34);
    const strap = rbox(0.46, 0.06, 0.06, makeMat('#fbbf24', { metalness: 0.5 }), 0.02, 1);
    strap.position.set(0, 0.12, -0.46);
    torsoGroup.add(pack, flap, strap);
  } else if (eq.backpack === 'backpack-jetpack') {
    const bodyMat = makeMat('#e2e8f0', { roughness: 0.3, metalness: 0.5 });
    const tankMat = makeMat('#0ea5e9', { roughness: 0.25, metalness: 0.6 });
    const flameMat = makeMat('#fbbf24', {
      emissive: '#f97316',
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const bridge = rbox(0.54, 0.24, 0.14, bodyMat, 0.04, 2);
    bridge.position.set(0, 0.08, -0.28);
    torsoGroup.add(bridge);
    for (const side of [-1, 1]) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.54, 14), tankMat);
      tank.position.set(side * 0.2, 0.04, -0.36);
      tank.castShadow = true;
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 10), flameMat);
      flame.position.set(side * 0.2, -0.32, -0.36);
      flame.rotation.x = Math.PI;
      thrusterFlames.push(flame);
      torsoGroup.add(tank, flame);
    }
  } else if (eq.backpack === 'backpack-wings-nova' || eq.backpack === 'backpack-leaf-wings') {
    wingsGroup = new THREE.Group();
    wingsGroup.position.set(0, 0.1, -0.26);
    const isLeaf = eq.backpack === 'backpack-leaf-wings';
    const wingMat = makeMat(isLeaf ? '#22c55e' : '#38bdf8', {
      roughness: 0.25,
      metalness: isLeaf ? 0.15 : 0.4,
      emissive: isLeaf ? '#16a34a' : '#0ea5e9',
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const coreMat = makeMat('#fbbf24', { metalness: 0.7, roughness: 0.2 });
    const hub = rbox(0.22, 0.22, 0.1, coreMat, 0.03, 2);
    wingsGroup.add(hub);
    for (const side of [-1, 1]) {
      const upper = rbox(0.62, 0.24, 0.05, wingMat, 0.03, 2);
      upper.position.set(side * 0.4, 0.16, -0.06);
      upper.rotation.z = side * 0.35;
      upper.rotation.y = side * -0.25;
      const lower = rbox(0.44, 0.16, 0.05, wingMat, 0.03, 2);
      lower.position.set(side * 0.33, -0.06, -0.06);
      lower.rotation.z = side * 0.12;
      lower.rotation.y = side * -0.25;
      wingsGroup.add(upper, lower);
    }
    torsoGroup.add(wingsGroup);
  } else if (eq.backpack === 'backpack-calculator-gold') {
    const goldPack = rbox(0.54, 0.62, 0.2, makeMat('#f59e0b', { metalness: 0.7, roughness: 0.25 }), 0.05, 2);
    goldPack.position.set(0, 0.02, -0.32);
    const screen = rbox(0.38, 0.16, 0.04, makeMat('#bae6fd', { emissive: '#38bdf8', emissiveIntensity: 0.5 }), 0.02, 1);
    screen.position.set(0, 0.16, -0.43);
    torsoGroup.add(goldPack, screen);
  } else if (eq.backpack === 'backpack-atom-glow') {
    const pack = rbox(0.5, 0.52, 0.2, makeMat('#0f172a', { metalness: 0.5, roughness: 0.3 }), 0.05, 2);
    pack.position.set(0, 0.02, -0.32);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 14),
      makeMat('#38bdf8', { emissive: '#0ea5e9', emissiveIntensity: 0.9 }),
    );
    orb.position.set(0, 0.04, -0.44);
    torsoGroup.add(pack, orb);
  } else if (eq.backpack === 'backpack-potion') {
    const rack = rbox(0.56, 0.22, 0.14, makeMat('#475569', { metalness: 0.5 }), 0.03, 2);
    rack.position.set(0, 0.06, -0.29);
    const tankL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.48, 12),
      makeMat('#a855f7', { emissive: '#9333ea', emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }),
    );
    tankL.position.set(-0.16, 0.04, -0.37);
    const tankR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.48, 12),
      makeMat('#10b981', { emissive: '#059669', emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }),
    );
    tankR.position.set(0.16, 0.04, -0.37);
    torsoGroup.add(rack, tankL, tankR);
  } else if (eq.backpack === 'backpack-digital') {
    const pack = rbox(0.54, 0.58, 0.22, makeMat('#0f172a', { metalness: 0.5, roughness: 0.3 }), 0.05, 2);
    pack.position.set(0, 0.02, -0.32);
    const strip = rbox(0.38, 0.38, 0.04, makeMat('#06b6d4', { emissive: '#22d3ee', emissiveIntensity: 0.85 }), 0.02, 1);
    strip.position.set(0, 0.02, -0.43);
    torsoGroup.add(pack, strip);
  } else if (eq.backpack === 'backpack-book-magic') {
    const cover = rbox(0.54, 0.62, 0.18, makeMat('#9d174d', { roughness: 0.5 }), 0.04, 2);
    cover.position.set(0, 0.02, -0.31);
    const pages = rbox(0.46, 0.54, 0.14, makeMat('#fef3c7', { roughness: 0.7 }), 0.02, 1);
    pages.position.set(0, 0.02, -0.34);
    const star = rbox(0.16, 0.16, 0.04, makeMat('#fbbf24', { emissive: '#f59e0b', emissiveIntensity: 0.6 }), 0.02, 1);
    star.position.set(0, 0.06, -0.42);
    torsoGroup.add(cover, pages, star);
  } else if (eq.backpack === 'backpack-globe') {
    const pack = rbox(0.46, 0.46, 0.16, makeMat('#92400e', { roughness: 0.65 }), 0.04, 2);
    pack.position.set(0, 0.02, -0.3);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      makeMat('#0ea5e9', { roughness: 0.35, emissive: '#0284c7', emissiveIntensity: 0.25 }),
    );
    globe.position.set(0, 0.06, -0.46);
    torsoGroup.add(pack, globe);
  }

  // Royal / Adventure Capes (draped behind torso)
  if (eq.cape && eq.cape !== 'cape-none') {
    const capeColors: Record<string, { main: string; trim: string }> = {
      'cape-math-royal': { main: '#b91c1c', trim: '#fbbf24' },
      'cape-nature-guardian': { main: '#15803d', trim: '#fde047' },
      'cape-adventure': { main: '#0f766e', trim: '#f59e0b' },
    };
    const cc = capeColors[eq.cape] ?? capeColors['cape-math-royal'];
    const capeMesh = rbox(0.76, 1.02, 0.06, makeMat(cc.main, { roughness: 0.65 }), 0.02, 2);
    capeMesh.position.set(0, -0.14, -0.26);
    capeMesh.rotation.x = 0.12;
    const capeTrim = rbox(0.78, 0.1, 0.07, makeMat(cc.trim, { metalness: 0.5, roughness: 0.3 }), 0.02, 2);
    capeTrim.position.set(0, -0.6, -0.31);
    capeTrim.rotation.x = 0.12;
    torsoGroup.add(capeMesh, capeTrim);
  }

  // Neck + Head Group (pivoted at y=1.55)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 12), skinMat);
  neck.position.set(0, 0.46, 0);
  torsoGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.96, 0);
  bodyGroup.add(headGroup);
  buildHeadDetails(headGroup, app, eq, skinHex, hairHex);

  // Arms (pivoted at shoulder y=1.44, x=±0.52)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.52, 1.44, 0);
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.52, 1.44, 0);
  bodyGroup.add(leftArmGroup, rightArmGroup);

  const sleeveMat = activeJacket ? makeMat(activeJacket.trim, { roughness: 0.55 }) : outfitMat;
  for (const armGroup of [leftArmGroup, rightArmGroup]) {
    const sleeve = rbox(0.25, 0.48, 0.28, sleeveMat, 0.05, 3);
    sleeve.position.set(0, -0.2, 0);
    const cuff = rbox(0.26, 0.08, 0.29, trimMat, 0.02, 2);
    cuff.position.set(0, -0.44, 0);
    const hand = rbox(0.22, 0.2, 0.22, skinMat, 0.05, 2);
    hand.position.set(0, -0.56, 0);
    armGroup.add(sleeve, cuff, hand);
  }

  // Wristwear (Watch on left wrist)
  if (eq.wristwear === 'wristwear-smartwatch' || eq.wristwear === 'wristwear-gold-watch') {
    const isGold = eq.wristwear === 'wristwear-gold-watch';
    const strap = rbox(
      0.26,
      0.07,
      0.26,
      makeMat(isGold ? '#fbbf24' : '#0f172a', { metalness: isGold ? 0.8 : 0.4, roughness: 0.25 }),
      0.02,
      2,
    );
    strap.position.set(0, -0.48, 0);
    const dial = rbox(
      0.1,
      0.09,
      0.05,
      makeMat(isGold ? '#fef08a' : '#38bdf8', {
        emissive: isGold ? '#f59e0b' : '#0ea5e9',
        emissiveIntensity: 0.55,
      }),
      0.015,
      1,
    );
    dial.position.set(0, -0.48, 0.13);
    leftArmGroup.add(strap, dial);
  }

  // Handheld Accessory on Right Hand
  let atomOrbitGroup: THREE.Group | null = null;
  if (eq.accessory === 'accessory-compass') {
    const compMat = makeMat('#fbbf24', { metalness: 0.75, roughness: 0.2 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), compMat);
    disc.position.set(0, -0.66, 0.12);
    disc.rotation.x = Math.PI / 2;
    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16),
      makeMat('#e0f2fe', { emissive: '#38bdf8', emissiveIntensity: 0.4 }),
    );
    face.position.copy(disc.position);
    face.rotation.x = Math.PI / 2;
    rightArmGroup.add(disc, face);
  } else if (eq.accessory === 'accessory-flask') {
    const glass = makeMat('#a855f7', {
      emissive: '#9333ea',
      emissiveIntensity: 0.55,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), glass);
    bulb.position.set(0, -0.7, 0.12);
    const neckFlask = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 10), glass);
    neckFlask.position.set(0, -0.58, 0.12);
    rightArmGroup.add(bulb, neckFlask);
  } else if (eq.accessory === 'accessory-atom') {
    atomOrbitGroup = new THREE.Group();
    atomOrbitGroup.position.set(0, -0.7, 0.14);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      makeMat('#38bdf8', { emissive: '#0ea5e9', emissiveIntensity: 1.0 }),
    );
    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.015, 8, 24),
      makeMat('#fde047', { emissive: '#facc15', emissiveIntensity: 0.7 }),
    );
    const ringB = ringA.clone();
    ringB.rotation.x = Math.PI / 2.2;
    ringB.rotation.y = Math.PI / 3;
    atomOrbitGroup.add(core, ringA, ringB);
    rightArmGroup.add(atomOrbitGroup);
  } else if (eq.accessory === 'accessory-flame-torch') {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.03, 0.34, 10),
      makeMat('#78350f', { roughness: 0.7 }),
    );
    handle.position.set(0, -0.66, 0.14);
    handle.rotation.x = Math.PI / 4;
    const flameCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.22, 8),
      makeMat('#f97316', { emissive: '#fbbf24', emissiveIntensity: 1.1, roughness: 0.2 }),
    );
    flameCone.position.set(0, -0.52, 0.28);
    flameCone.rotation.x = Math.PI / 4;
    thrusterFlames.push(flameCone);
    rightArmGroup.add(handle, flameCone);
  }

  // Legs (pivoted at hip y=0.71, x=±0.20)
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.2, 0.71, 0);
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.2, 0.71, 0);
  bodyGroup.add(leftLegGroup, rightLegGroup);

  for (const legGroup of [leftLegGroup, rightLegGroup]) {
    if (bottoms.isShorts) {
      const upper = rbox(0.3, 0.3, 0.34, bottomsMat, 0.04, 2);
      upper.position.set(0, -0.15, 0);
      const lowerSkin = rbox(0.24, 0.24, 0.26, skinMat, 0.04, 2);
      lowerSkin.position.set(0, -0.4, 0);
      legGroup.add(upper, lowerSkin);
    } else {
      const pants = rbox(0.3, 0.52, 0.34, bottomsMat, 0.045, 3);
      pants.position.set(0, -0.26, 0);
      const stripe = rbox(0.31, 0.08, 0.35, bottomsTrimMat, 0.02, 2);
      stripe.position.set(0, -0.44, 0);
      legGroup.add(pants, stripe);
    }

    // 3D Shoe
    const shoeUpper = rbox(0.32, 0.16, 0.42, shoeMainMat, 0.04, 3);
    shoeUpper.position.set(0, -0.58, 0.04);
    const shoeSole = rbox(0.34, 0.06, 0.44, shoeSoleMat, 0.02, 2);
    shoeSole.position.set(0, -0.66, 0.04);
    const shoeAccent = rbox(0.28, 0.05, 0.12, shoeAccentMat, 0.02, 2);
    shoeAccent.position.set(0, -0.54, 0.19);
    legGroup.add(shoeUpper, shoeSole, shoeAccent);
  }

  // Streak Flame Aura OR Equipped Subject Aura (floating ember/rune crystals)
  let streakAuraGroup: THREE.Group | null = null;
  const equippedAuraColor: Record<string, { color: string; emissive: string; count: number }> = {
    'aura-numbers': { color: '#fbbf24', emissive: '#f59e0b', count: 6 },
    'aura-energy': { color: '#38bdf8', emissive: '#0ea5e9', count: 6 },
    'aura-chemical': { color: '#c084fc', emissive: '#9333ea', count: 6 },
    'aura-code': { color: '#22d3ee', emissive: '#06b6d4', count: 7 },
  };
  const customAura = eq.aura && eq.aura !== 'aura-none' ? equippedAuraColor[eq.aura] : undefined;

  if (flameTier !== 'none' || customAura) {
    streakAuraGroup = new THREE.Group();
    const tierConfig: Record<Exclude<FlameTier, 'none'>, { color: string; emissive: string; count: number }> = {
      spark: { color: '#fbbf24', emissive: '#f59e0b', count: 3 },
      blaze: { color: '#fb923c', emissive: '#ea580c', count: 5 },
      phoenix: { color: '#f87171', emissive: '#dc2626', count: 6 },
      inferno: { color: '#c084fc', emissive: '#9333ea', count: 7 },
      cosmic: { color: '#38bdf8', emissive: '#0ea5e9', count: 8 },
    };
    const cfg = customAura ?? tierConfig[flameTier as Exclude<FlameTier, 'none'>];
    const emberMat = makeMat(cfg.color, {
      emissive: cfg.emissive,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2;
      const radius = 0.88;
      const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), emberMat);
      ember.position.set(
        Math.cos(angle) * radius,
        0.25 + (i % 3) * 0.22,
        Math.sin(angle) * radius,
      );
      streakAuraGroup.add(ember);
    }
    root.add(streakAuraGroup);
  }

  return {
    root,
    bodyGroup,
    torsoGroup,
    headGroup,
    leftArmGroup,
    rightArmGroup,
    leftLegGroup,
    rightLegGroup,
    atomOrbitGroup,
    thrusterFlames,
    wingsGroup,
    streakAuraGroup,
  };
}

export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
