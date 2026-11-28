'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ThreeModelLabViewerProps {
  title: string;
  modelUrl: string;
}

/**
 * Reusable Three.js GLB/GLTF 3D model viewer for future model-based labs,
 * with OrbitControls rotation/zoom, camera reset, and clean WebGL disposal.
 */
export function ThreeModelLabViewer({ title, modelUrl }: ThreeModelLabViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError('3D WebGL view is unavailable on this device.');
      setLoading(false);
      return;
    }

    const width = Math.max(container.clientWidth, 240);
    const height = Math.max(container.clientHeight, 240);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#071426');

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(2.8, 2.0, 3.6);
    cameraRef.current = camera;

    const hemi = new THREE.HemisphereLight('#e9dfc7', '#0d1b2d', 1.1);
    scene.add(hemi);
    const key = new THREE.DirectionalLight('#fff8e6', 1.5);
    key.position.set(4, 6, 4);
    scene.add(key);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    let loadedRoot: THREE.Object3D | null = null;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        loadedRoot = gltf.scene;
        const box = new THREE.Box3().setFromObject(loadedRoot);
        const center = box.getCenter(new THREE.Vector3());
        loadedRoot.position.sub(center);
        scene.add(loadedRoot);
        setLoading(false);
      },
      undefined,
      () => {
        setError('Could not load the 3D lab model. Please try again.');
        setLoading(false);
      },
    );

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      if (loadedRoot) {
        loadedRoot.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
      }
      renderer.dispose();
    };
  }, [modelUrl]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(2.8, 2.0, 3.6);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative flex h-full min-h-[440px] w-full flex-col overflow-hidden rounded-xl border border-[#233B59] bg-[#071426]">
      <div className="flex items-center justify-between border-b border-[#1E3350] bg-[#0D1B2D] px-3 py-1.5 text-xs">
        <span className="truncate font-bold text-[#E9DFC7]/85">{title}</span>
        <button
          type="button"
          onClick={handleResetCamera}
          className="inline-flex items-center gap-1 rounded-md border border-[#233B59] bg-[#071426] px-2 py-1 text-[11px] font-bold text-[#E9DFC7]/85 hover:border-[#F5B900]/60 hover:text-[#F5B900]"
        >
          <RotateCcw className="h-3 w-3" />
          Reset View
        </button>
      </div>

      {loading && !error && (
        <div className="absolute inset-0 top-9 z-10 flex flex-col items-center justify-center bg-[#071426]/90">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5B900] border-t-transparent" />
          <p className="mt-2 text-xs font-bold text-[#E9DFC7]">Loading 3D Model...</p>
        </div>
      )}

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-[#F5B900]" />
          <p className="mt-2 text-sm font-bold text-[#E9DFC7]">{error}</p>
        </div>
      ) : (
        <div ref={containerRef} className="h-full w-full flex-1" />
      )}
    </div>
  );
}
