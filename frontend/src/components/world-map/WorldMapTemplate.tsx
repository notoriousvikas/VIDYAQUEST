'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { LevelNode, LevelStatus, RegionInfo } from '@/types/worldMap';
import type { MapLandmark } from '@/data/subjectMaps';
import { LevelMarker } from './LevelMarker';
import { MapBorderFrame, MapBorderVariant } from './MapBorderFrame';
import { MapMinimap } from './MapMinimap';

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

export interface WorldMapLevelItem {
  level: LevelNode;
  status: LevelStatus;
  stars: 0 | 1 | 2 | 3;
}

export interface WorldMapTemplateProps {
  /** Unique key for the current map (triggers auto-fit when switched). */
  mapKey?: string;
  mapName: string;
  mapImageUrl: string;
  mapWidth?: number;
  mapHeight?: number;
  minScale?: number;
  maxScale?: number;
  defaultCenterX?: number;
  defaultCenterY?: number;
  oceanColor?: string;
  borderVariant?: MapBorderVariant;
  showBorderCompass?: boolean;
  regions: RegionInfo[];
  landmarks?: MapLandmark[];
  levels: WorldMapLevelItem[];
  selectedLevelId?: string | null;
  onSelectLevel: (level: LevelNode, status: LevelStatus) => void;
  /** Optional slots for HUD, banners, side panels, and modals */
  topHud?: React.ReactNode;
  banners?: React.ReactNode;
  extraControls?: React.ReactNode;
  onResetAction?: () => void;
  resetActionTitle?: string;
  children?: React.ReactNode;
}

const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 960;
const DEFAULT_MIN_SCALE = 0.25;
const DEFAULT_MAX_SCALE = 2.5;
const PAN_OVERSCROLL_PX = 48;

function computeContainScale(
  vpWidth: number,
  vpHeight: number,
  mapWidth: number,
  mapHeight: number,
): number {
  const padX = vpWidth < 640 ? 8 : 24;
  const padY = vpWidth < 640 ? 72 : 56;
  const usableW = Math.max(120, vpWidth - padX * 2);
  const usableH = Math.max(120, vpHeight - padY * 2);
  return Math.min(usableW / mapWidth, usableH / mapHeight);
}

/**
 * Reusable, responsive interactive world map template.
 * Automatically scales to fit any screen size (mobile, tablet, desktop, ultrawide)
 * using contain-fit math and ResizeObserver, with smooth pan, wheel zoom, and pinch-to-zoom.
 */
export function WorldMapTemplate({
  mapKey,
  mapName,
  mapImageUrl,
  mapWidth = DEFAULT_WIDTH,
  mapHeight = DEFAULT_HEIGHT,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
  defaultCenterX = 50,
  defaultCenterY = 50,
  oceanColor = '#1b5e7a',
  borderVariant = 'classic-gold',
  showBorderCompass = true,
  regions,
  landmarks = [],
  levels,
  selectedLevelId,
  onSelectLevel,
  topHud,
  banners,
  extraControls,
  onResetAction,
  resetActionTitle = 'Reset View',
  children,
}: WorldMapTemplateProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasUserInteractedRef = useRef(false);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    camX: number;
    camY: number;
  } | null>(null);

  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });
  const viewportSizeRef = useRef(viewportSize);
  viewportSizeRef.current = viewportSize;
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [smoothCamera, setSmoothCamera] = useState(false);

  const getEffectiveMinScale = useCallback(
    (vp: { width: number; height: number }) => {
      const containScale = computeContainScale(vp.width, vp.height, mapWidth, mapHeight);
      return Math.max(0.15, Math.min(minScale, containScale * 0.9));
    },
    [mapHeight, mapWidth, minScale],
  );

  const clampCamera = useCallback(
    (next: CameraState, vp = viewportSizeRef.current): CameraState => {
      const effectiveMin = getEffectiveMinScale(vp);
      const clampedScale = Math.max(effectiveMin, Math.min(maxScale, next.scale));
      const scaledW = mapWidth * clampedScale;
      const scaledH = mapHeight * clampedScale;

      let minX: number;
      let maxX: number;
      if (scaledW <= vp.width) {
        const centeredX = (vp.width - scaledW) / 2;
        minX = centeredX - PAN_OVERSCROLL_PX;
        maxX = centeredX + PAN_OVERSCROLL_PX;
      } else {
        minX = vp.width - scaledW - PAN_OVERSCROLL_PX;
        maxX = PAN_OVERSCROLL_PX;
      }

      let minY: number;
      let maxY: number;
      if (scaledH <= vp.height) {
        const centeredY = (vp.height - scaledH) / 2;
        minY = centeredY - PAN_OVERSCROLL_PX;
        maxY = centeredY + PAN_OVERSCROLL_PX;
      } else {
        minY = vp.height - scaledH - PAN_OVERSCROLL_PX;
        maxY = PAN_OVERSCROLL_PX;
      }

      return {
        scale: clampedScale,
        x: Math.max(minX, Math.min(maxX, next.x)),
        y: Math.max(minY, Math.min(maxY, next.y)),
      };
    },
    [getEffectiveMinScale, mapHeight, mapWidth, maxScale],
  );

  const computeFitCamera = useCallback(
    (vp: { width: number; height: number }): CameraState => {
      const containScale = computeContainScale(vp.width, vp.height, mapWidth, mapHeight);
      const effectiveMin = getEffectiveMinScale(vp);
      const fitScale = Math.max(effectiveMin, Math.min(maxScale, containScale));
      const x = vp.width / 2 - (defaultCenterX / 100) * mapWidth * fitScale;
      const y = vp.height / 2 - (defaultCenterY / 100) * mapHeight * fitScale;
      return clampCamera({ x, y, scale: fitScale }, vp);
    },
    [
      clampCamera,
      defaultCenterX,
      defaultCenterY,
      getEffectiveMinScale,
      mapHeight,
      mapWidth,
      maxScale,
    ],
  );

  const centerOnPercent = useCallback(
    (xPercent: number, yPercent: number, targetScale?: number, vp = viewportSize) => {
      setSmoothCamera(true);
      setCamera((prev) => {
        const scale = targetScale ?? prev.scale;
        const targetX = vp.width / 2 - (xPercent / 100) * mapWidth * scale;
        const targetY = vp.height / 2 - (yPercent / 100) * mapHeight * scale;
        return clampCamera({ x: targetX, y: targetY, scale }, vp);
      });
    },
    [clampCamera, mapHeight, mapWidth, viewportSize],
  );

  // Reset auto-fit whenever the active map changes
  useEffect(() => {
    hasUserInteractedRef.current = false;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const vp = { width: rect.width, height: rect.height };
      setViewportSize((prev) =>
        prev.width === vp.width && prev.height === vp.height ? prev : vp,
      );
      setSmoothCamera(false);
      setCamera(computeFitCamera(vp));
    }
  }, [mapKey, mapWidth, mapHeight, computeFitCamera]);

  // Keep map fitted on container/screen resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const vp = { width: rect.width, height: rect.height };
      setViewportSize((prev) =>
        prev.width === vp.width && prev.height === vp.height ? prev : vp,
      );
      setCamera((prev) => {
        if (!hasUserInteractedRef.current) {
          return computeFitCamera(vp);
        }
        return clampCamera(prev, vp);
      });
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [clampCamera, computeFitCamera]);

  const handleFitToScreen = useCallback(() => {
    hasUserInteractedRef.current = false;
    setSmoothCamera(true);
    setCamera(computeFitCamera(viewportSize));
  }, [computeFitCamera, viewportSize]);

  const handleZoomToCurrentLevel = useCallback(() => {
    const current =
      levels.find((item) => item.status === 'current' || item.status === 'in_progress') ??
      levels[0];
    if (current) {
      hasUserInteractedRef.current = true;
      const containScale = computeContainScale(
        viewportSize.width,
        viewportSize.height,
        mapWidth,
        mapHeight,
      );
      const focusScale = Math.min(maxScale, Math.max(containScale * 1.4, 1.15));
      centerOnPercent(current.level.xPercent, current.level.yPercent, focusScale);
    }
  }, [centerOnPercent, levels, mapHeight, mapWidth, maxScale, viewportSize.height, viewportSize.width]);

  const handleZoomStep = useCallback(
    (delta: number) => {
      hasUserInteractedRef.current = true;
      setSmoothCamera(true);
      setCamera((prev) => {
        const nextScale = prev.scale + delta;
        const clamped = clampCamera({ ...prev, scale: nextScale });
        const ratio = clamped.scale / prev.scale;
        const cx = viewportSize.width / 2;
        const cy = viewportSize.height / 2;
        return clampCamera({
          x: cx - (cx - prev.x) * ratio,
          y: cy - (cy - prev.y) * ratio,
          scale: clamped.scale,
        });
      });
    },
    [clampCamera, viewportSize.height, viewportSize.width],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      hasUserInteractedRef.current = true;
      setSmoothCamera(false);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;

      setCamera((prev) => {
        const effectiveMin = getEffectiveMinScale(viewportSize);
        const nextScale = Math.max(effectiveMin, Math.min(maxScale, prev.scale * zoomFactor));
        const ratio = nextScale / prev.scale;
        return clampCamera({
          x: pointerX - (pointerX - prev.x) * ratio,
          y: pointerY - (pointerY - prev.y) * ratio,
          scale: nextScale,
        });
      });
    },
    [clampCamera, getEffectiveMinScale, maxScale, viewportSize],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    hasUserInteractedRef.current = true;
    setSmoothCamera(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRef.current = { distance: dist, scale: camera.scale };
      setIsDragging(false);
      dragStartRef.current = null;
    } else {
      setIsDragging(true);
      dragStartRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        camX: camera.x,
        camY: camera.y,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (pinchStartRef.current.distance > 0) {
        const ratio = dist / pinchStartRef.current.distance;
        const targetScale = pinchStartRef.current.scale * ratio;
        const rect = containerRef.current?.getBoundingClientRect();
        const midX = (pts[0].x + pts[1].x) / 2 - (rect?.left ?? 0);
        const midY = (pts[0].y + pts[1].y) / 2 - (rect?.top ?? 0);
        setCamera((prev) => {
          const effectiveMin = getEffectiveMinScale(viewportSize);
          const nextScale = Math.max(effectiveMin, Math.min(maxScale, targetScale));
          const scaleRatio = nextScale / prev.scale;
          return clampCamera({
            x: midX - (midX - prev.x) * scaleRatio,
            y: midY - (midY - prev.y) * scaleRatio,
            scale: nextScale,
          });
        });
      }
      return;
    }

    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setCamera((prev) =>
      clampCamera({
        ...prev,
        x: dragStartRef.current!.camX + dx,
        y: dragStartRef.current!.camY + dy,
      }),
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleSelectLevelInternal = useCallback(
    (level: LevelNode, status: LevelStatus) => {
      if (status !== 'locked') {
        hasUserInteractedRef.current = true;
        const containScale = computeContainScale(
          viewportSize.width,
          viewportSize.height,
          mapWidth,
          mapHeight,
        );
        const targetScale = Math.min(maxScale, Math.max(camera.scale, containScale * 1.25));
        centerOnPercent(level.xPercent, level.yPercent, targetScale);
      }
      onSelectLevel(level, status);
    },
    [camera.scale, centerOnPercent, mapHeight, mapWidth, maxScale, onSelectLevel, viewportSize.height, viewportSize.width],
  );

  const minimapViewportRect = useMemo(() => {
    const scaledW = mapWidth * camera.scale;
    const scaledH = mapHeight * camera.scale;
    return {
      xPercent: (-camera.x / scaledW) * 100,
      yPercent: (-camera.y / scaledH) * 100,
      widthPercent: (viewportSize.width / scaledW) * 100,
      heightPercent: (viewportSize.height / scaledH) * 100,
    };
  }, [camera.scale, camera.x, camera.y, mapHeight, mapWidth, viewportSize.height, viewportSize.width]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ backgroundColor: oceanColor }}
      className={`relative h-[100dvh] w-full overflow-hidden select-none touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Transformed World Layer */}
      <div
        style={{
          width: mapWidth,
          height: mapHeight,
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`,
          transformOrigin: '0 0',
          transition: smoothCamera ? 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
        className="relative will-change-transform"
      >
        <img
          src={mapImageUrl}
          alt={mapName}
          width={mapWidth}
          height={mapHeight}
          draggable={false}
          className="pointer-events-none h-full w-full rounded-xl object-cover"
        />

        {/* Cartography Border Frame Template */}
        <MapBorderFrame
          variant={borderVariant}
          mapTitle={mapName}
          showCompassDirections={showBorderCompass}
        />

        {/* Subtle drifting clouds overlay */}
        <motion.div
          aria-hidden
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-[12%] top-[8%] h-14 w-36 rounded-full bg-white/15 blur-xl"
        />
        <motion.div
          aria-hidden
          animate={{ x: [0, -70, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute right-[15%] top-[16%] h-16 w-44 rounded-full bg-white/15 blur-xl"
        />

        {/* Connecting Quest Trail Lines */}
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {levels.map(({ level }) =>
            level.prerequisites.map((prereqId) => {
              const prereqItem = levels.find((item) => item.level.id === prereqId);
              if (!prereqItem) return null;
              const isTrailUnlocked = prereqItem.status === 'completed';
              return (
                <line
                  key={`${prereqId}-${level.id}`}
                  x1={(prereqItem.level.xPercent / 100) * mapWidth}
                  y1={(prereqItem.level.yPercent / 100) * mapHeight}
                  x2={(level.xPercent / 100) * mapWidth}
                  y2={(level.yPercent / 100) * mapHeight}
                  stroke={isTrailUnlocked ? '#fde047' : '#334155'}
                  strokeWidth={isTrailUnlocked ? 4 : 3}
                  strokeDasharray={isTrailUnlocked ? '10 6' : '6 8'}
                  strokeOpacity={isTrailUnlocked ? 0.85 : 0.55}
                />
              );
            }),
          )}
        </svg>

        {/* Region / Zone Name Signposts */}
        {regions.map((region) => (
          <div
            key={region.id}
            style={{
              left: `${region.xPercent}%`,
              top: `${region.yPercent - 7}%`,
            }}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="rounded-md border border-amber-200/70 bg-slate-950/75 px-2.5 py-1 text-center shadow-lg backdrop-blur-[2px]">
              <p className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
                {region.name}
                {typeof region.completionPercentage === 'number' &&
                  ` · ${region.completionPercentage}%`}
              </p>
            </div>
          </div>
        ))}

        {/* World Landmarks */}
        {landmarks.map((lm) => (
          <div
            key={lm.id}
            style={{ left: `${lm.xPercent}%`, top: `${lm.yPercent}%` }}
            title={`${lm.name}: ${lm.description}`}
            className="group pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="flex items-center gap-1 rounded-full border border-amber-300/60 bg-slate-950/75 px-2 py-0.5 text-[10px] font-bold text-amber-100 shadow-md backdrop-blur-[2px] transition group-hover:border-amber-300 group-hover:bg-slate-950">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              <span className="whitespace-nowrap">{lm.name}</span>
            </div>
          </div>
        ))}

        {/* Interactive Level Markers */}
        {levels.map(({ level, status, stars }) => (
          <LevelMarker
            key={level.id}
            level={level}
            status={status}
            stars={stars}
            isSelected={selectedLevelId === level.id}
            onSelect={handleSelectLevelInternal}
          />
        ))}
      </div>

      {/* Top HUD Slot */}
      {topHud}

      {/* Banners Slot */}
      {banners}

      {/* Minimap - Bottom Left */}
      <div className="fixed bottom-3 left-3 z-40">
        <MapMinimap
          mapImageUrl={mapImageUrl}
          regions={regions}
          viewportRect={minimapViewportRect}
          onJumpToPercent={(xPct, yPct) => {
            hasUserInteractedRef.current = true;
            centerOnPercent(xPct, yPct);
          }}
        />
      </div>

      {/* Camera & Template Controls - Bottom Right */}
      <div
        className="fixed bottom-3 right-3 z-40 flex items-center gap-1 rounded-xl border-2 border-amber-300/70 bg-slate-950/85 p-1.5 text-slate-100 shadow-xl backdrop-blur-md sm:gap-1.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => handleZoomStep(0.25)}
          title="Zoom In"
          aria-label="Zoom In"
          className="rounded-lg p-2 transition hover:bg-slate-800 hover:text-amber-300"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoomStep(-0.25)}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="rounded-lg p-2 transition hover:bg-slate-800 hover:text-amber-300"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomToCurrentLevel}
          title="Focus Current Quest"
          aria-label="Focus Current Quest"
          className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/30"
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Current Quest</span>
        </button>
        <button
          type="button"
          onClick={handleFitToScreen}
          title="Fit Full Map to Screen"
          aria-label="Fit Full Map to Screen"
          className="flex items-center gap-1 rounded-lg p-2 transition hover:bg-slate-800 hover:text-amber-300"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden md:inline text-xs font-bold">Fit</span>
        </button>
        {extraControls}
        {onResetAction && (
          <button
            type="button"
            onClick={onResetAction}
            title={resetActionTitle}
            aria-label={resetActionTitle}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-300"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Panels, Toasts, Modals Slot */}
      {children}
    </div>
  );
}
