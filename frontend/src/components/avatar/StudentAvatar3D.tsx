'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AvatarAppearance, AvatarEquippedItems, FlameTier } from '@/types/student';
import { StudentAvatar2D } from './StudentAvatar2D';
import { AvatarAnimationState, updateAvatarAnimation } from './three/avatarAnimations';
import { AvatarRig, buildBlockAvatar, disposeObject3D } from './three/buildBlockAvatar';

export interface StudentAvatar3DProps {
  appearance?: Partial<AvatarAppearance>;
  equippedItems?: Partial<AvatarEquippedItems>;
  animation?: AvatarAnimationState;
  interactive?: boolean;
  celebrateTrigger?: number;
  reducedMotion?: boolean;
  variant?: 'card' | 'stage';
  flameTier?: FlameTier;
  className?: string;
  fallbackSize?: 'sm' | 'md' | 'lg' | 'xl';
  onInteract?: () => void;
}

function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

export function StudentAvatar3D({
  appearance,
  equippedItems,
  animation = 'idle',
  interactive = true,
  celebrateTrigger = 0,
  reducedMotion = false,
  variant = 'card',
  flameTier = 'none',
  className = '',
  fallbackSize = 'lg',
  onInteract,
}: StudentAvatar3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [tempAnim, setTempAnim] = useState<AvatarAnimationState | null>(null);

  const rigRef = useRef<AvatarRig | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animStateRef = useRef<AvatarAnimationState>(animation);
  const reducedMotionRef = useRef<boolean>(reducedMotion);

  const activeAnimation = tempAnim ?? animation;
  animStateRef.current = activeAnimation;
  reducedMotionRef.current = reducedMotion;

  // Trigger brief celebration on external celebrateTrigger increment
  useEffect(() => {
    if (celebrateTrigger <= 0) return;
    setTempAnim('celebrate');
    const timer = window.setTimeout(() => setTempAnim(null), 2400);
    return () => window.clearTimeout(timer);
  }, [celebrateTrigger]);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = Math.max(container.clientWidth, 120);
    const height = Math.max(container.clientHeight, 120);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglSupported(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
    camera.position.set(0.28, 1.72, 6.0);

    // 3-point + hemisphere studio lighting
    const hemiLight = new THREE.HemisphereLight('#e0f2fe', '#0f172a', 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#fffbeb', 1.75);
    keyLight.position.set(3.2, 5.2, 4.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(512, 512);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 14;
    keyLight.shadow.camera.left = -2.2;
    keyLight.shadow.camera.right = 2.2;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -1;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#7dd3fc', 0.65);
    fillLight.position.set(-3.5, 2.2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#fbbf24', 0.85);
    rimLight.position.set(0, 3.0, -3.8);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.32, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = interactive;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = Math.PI / 3.4;
    controls.maxPolarAngle = Math.PI / 1.9;
    controls.update();

    // Build initial character
    const initialRig = buildBlockAvatar(appearance, equippedItems, flameTier);
    scene.add(initialRig.root);
    rigRef.current = initialRig;

    // Visibility & offscreen throttling for low-end devices
    let isVisible = true;
    let isTabVisible = !document.hidden;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
    });
    resizeObserver.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const animate = (now: number) => {
      rafId = window.requestAnimationFrame(animate);
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isVisible || !isTabVisible) return;

      elapsed += Math.min(dt, 0.05);
      if (rigRef.current) {
        updateAvatarAnimation(
          rigRef.current,
          animStateRef.current,
          elapsed,
          dt,
          reducedMotionRef.current,
        );
      }
      controls.update();
      renderer.render(scene, camera);
    };
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
      if (rigRef.current) {
        scene.remove(rigRef.current.root);
        disposeObject3D(rigRef.current.root);
        rigRef.current = null;
      }
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // Rebuild modular character meshes when customization changes
  const appearanceKey = JSON.stringify(appearance ?? {});
  const equippedKey = JSON.stringify(equippedItems ?? {});

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (rigRef.current) {
      scene.remove(rigRef.current.root);
      disposeObject3D(rigRef.current.root);
    }

    const nextRig = buildBlockAvatar(appearance, equippedItems, flameTier);
    scene.add(nextRig.root);
    rigRef.current = nextRig;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearanceKey, equippedKey, flameTier]);

  // Distinguish click vs drag for fun character interaction
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !pointerDownPos.current) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    pointerDownPos.current = null;

    if (Math.hypot(dx, dy) < 6) {
      setTempAnim((prev) => (prev === 'celebrate' ? 'jump' : 'celebrate'));
      window.setTimeout(() => setTempAnim(null), 1800);
      onInteract?.();
    }
  };

  if (!webglSupported) {
    return (
      <StudentAvatar2D
        appearance={appearance}
        equippedItems={equippedItems}
        size={fallbackSize}
        className={className}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label="Interactive 3D Student Avatar — drag to rotate, click to celebrate"
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setTempAnim('celebrate');
          window.setTimeout(() => setTempAnim(null), 1800);
          onInteract?.();
        }
      }}
      className={`relative select-none overflow-hidden ${
        variant === 'stage'
          ? 'bg-transparent'
          : 'rounded-2xl border-2 border-amber-300/70 bg-[radial-gradient(circle_at_50%_30%,rgba(56,189,248,0.18),rgba(15,23,42,0.96)_72%)] shadow-xl'
      } ${interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
    />
  );
}
