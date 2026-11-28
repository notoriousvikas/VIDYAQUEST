import * as THREE from 'three';
import { AvatarRig } from './buildBlockAvatar';

export type AvatarAnimationState = 'idle' | 'walk' | 'jump' | 'celebrate';

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function updateAvatarAnimation(
  rig: AvatarRig,
  state: AvatarAnimationState,
  elapsed: number,
  dt: number,
  reducedMotion = false,
): void {
  const safeDt = Math.min(dt, 0.05);
  const blendSpeed = 10;

  if (reducedMotion) {
    rig.bodyGroup.position.y = damp(rig.bodyGroup.position.y, 0, blendSpeed, safeDt);
    rig.bodyGroup.rotation.y = damp(rig.bodyGroup.rotation.y, 0, blendSpeed, safeDt);
    rig.torsoGroup.scale.set(1, 1, 1);
    rig.headGroup.rotation.set(0, 0, 0);
    rig.leftArmGroup.rotation.set(0, 0, 0.06);
    rig.rightArmGroup.rotation.set(0, 0, -0.06);
    rig.leftLegGroup.rotation.set(0, 0, 0);
    rig.rightLegGroup.rotation.set(0, 0, 0);
    return;
  }

  let bodyY = 0;
  let bodyRotY = 0;
  let torsoScaleY = 1;
  let headRotX = 0;
  let headRotY = 0;
  let headRotZ = 0;
  let leftArmX = 0;
  let leftArmZ = 0.08;
  let rightArmX = 0;
  let rightArmZ = -0.08;
  let leftLegX = 0;
  let rightLegX = 0;

  if (state === 'idle') {
    const breath = Math.sin(elapsed * 2.2);
    bodyY = breath * 0.018;
    torsoScaleY = 1 + breath * 0.018;
    headRotY = Math.sin(elapsed * 0.85) * 0.14;
    headRotX = Math.sin(elapsed * 1.15) * 0.05;
    headRotZ = Math.cos(elapsed * 0.7) * 0.03;
    leftArmX = Math.sin(elapsed * 1.6) * 0.05;
    rightArmX = -Math.sin(elapsed * 1.6) * 0.05;
    leftArmZ = 0.08 + Math.sin(elapsed * 2.2) * 0.02;
    rightArmZ = -0.08 - Math.sin(elapsed * 2.2) * 0.02;
  } else if (state === 'walk') {
    const stride = Math.sin(elapsed * 7.2);
    const bounce = Math.abs(Math.sin(elapsed * 7.2));
    bodyY = bounce * 0.06;
    torsoScaleY = 1 + bounce * 0.02;
    headRotY = Math.sin(elapsed * 3.6) * 0.06;
    headRotX = 0.04;
    leftArmX = stride * 0.58;
    rightArmX = -stride * 0.58;
    leftLegX = -stride * 0.62;
    rightLegX = stride * 0.62;
  } else if (state === 'jump') {
    const cycle = (elapsed * 1.8) % 1;
    const arc = Math.sin(cycle * Math.PI);
    bodyY = arc * 0.42;
    torsoScaleY = cycle < 0.15 ? 0.94 : 1.03;
    headRotX = -arc * 0.14;
    leftArmX = -arc * 1.15;
    rightArmX = -arc * 1.15;
    leftArmZ = 0.15 + arc * 0.45;
    rightArmZ = -0.15 - arc * 0.45;
    leftLegX = arc * 0.36;
    rightLegX = -arc * 0.22;
  } else if (state === 'celebrate') {
    const hop = Math.abs(Math.sin(elapsed * 6.5));
    const wave = Math.sin(elapsed * 10);
    bodyY = hop * 0.28;
    bodyRotY = Math.sin(elapsed * 2.4) * 0.35;
    torsoScaleY = 1 + hop * 0.03;
    headRotX = -0.1 + Math.sin(elapsed * 6.5) * 0.08;
    headRotZ = Math.sin(elapsed * 4.5) * 0.1;
    leftArmX = -2.35 + wave * 0.25;
    rightArmX = -2.35 - wave * 0.25;
    leftArmZ = 0.35;
    rightArmZ = -0.35;
    leftLegX = hop * 0.2;
    rightLegX = -hop * 0.15;
  }

  rig.bodyGroup.position.y = damp(rig.bodyGroup.position.y, bodyY, blendSpeed, safeDt);
  rig.bodyGroup.rotation.y = damp(rig.bodyGroup.rotation.y, bodyRotY, blendSpeed, safeDt);
  rig.torsoGroup.scale.y = damp(rig.torsoGroup.scale.y, torsoScaleY, blendSpeed, safeDt);

  rig.headGroup.rotation.x = damp(rig.headGroup.rotation.x, headRotX, blendSpeed, safeDt);
  rig.headGroup.rotation.y = damp(rig.headGroup.rotation.y, headRotY, blendSpeed, safeDt);
  rig.headGroup.rotation.z = damp(rig.headGroup.rotation.z, headRotZ, blendSpeed, safeDt);

  rig.leftArmGroup.rotation.x = damp(rig.leftArmGroup.rotation.x, leftArmX, blendSpeed, safeDt);
  rig.leftArmGroup.rotation.z = damp(rig.leftArmGroup.rotation.z, leftArmZ, blendSpeed, safeDt);
  rig.rightArmGroup.rotation.x = damp(rig.rightArmGroup.rotation.x, rightArmX, blendSpeed, safeDt);
  rig.rightArmGroup.rotation.z = damp(rig.rightArmGroup.rotation.z, rightArmZ, blendSpeed, safeDt);

  rig.leftLegGroup.rotation.x = damp(rig.leftLegGroup.rotation.x, leftLegX, blendSpeed, safeDt);
  rig.rightLegGroup.rotation.x = damp(rig.rightLegGroup.rotation.x, rightLegX, blendSpeed, safeDt);

  // Equipped secondary animations
  if (rig.atomOrbitGroup) {
    rig.atomOrbitGroup.rotation.y = elapsed * 2.4;
    rig.atomOrbitGroup.rotation.z = elapsed * 1.4;
  }
  if (rig.thrusterFlames.length > 0) {
    const pulse = 0.85 + Math.sin(elapsed * 18) * 0.2;
    for (const flame of rig.thrusterFlames) {
      flame.scale.set(1, pulse, 1);
    }
  }
  if (rig.wingsGroup) {
    const flap = Math.sin(elapsed * 3.5) * 0.08;
    rig.wingsGroup.rotation.y = flap;
  }
  if (rig.streakAuraGroup) {
    rig.streakAuraGroup.rotation.y = elapsed * 0.9;
    rig.streakAuraGroup.position.y = Math.sin(elapsed * 2.5) * 0.06;
  }
}
