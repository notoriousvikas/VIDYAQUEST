'use client';

import React from 'react';

/**
 * Lightweight SVG armory / customization room backdrop for the 3D Avatar Studio.
 */
export function StudioBackdrop({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 600 520"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="vq-studio-spot" cx="50%" cy="46%" r="50%">
            <stop offset="0%" stopColor="#F5B900" stopOpacity="0.16" />
            <stop offset="65%" stopColor="#1B3657" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#071426" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="600" height="520" fill="#0A182B" />

        {/* Subtle wall arch & armory shelves */}
        <path
          d="M90 440 L90 165 Q300 55 510 165 L510 440 Z"
          fill="#0F2138"
          stroke="#253F61"
          strokeWidth="2"
        />
        <rect x="115" y="190" width="76" height="8" rx="2" fill="#1C3554" />
        <rect x="409" y="190" width="76" height="8" rx="2" fill="#1C3554" />
        <rect x="115" y="275" width="76" height="8" rx="2" fill="#1C3554" />
        <rect x="409" y="275" width="76" height="8" rx="2" fill="#1C3554" />

        {/* Spotlight */}
        <ellipse cx="300" cy="255" rx="235" ry="205" fill="url(#vq-studio-spot)" />

        {/* Stone pedestal */}
        <ellipse
          cx="300"
          cy="432"
          rx="155"
          ry="24"
          fill="#162C47"
          stroke="#F5B900"
          strokeOpacity="0.35"
          strokeWidth="2"
        />
        <ellipse cx="300" cy="430" rx="112" ry="14" fill="#213E63" />
      </svg>
    </div>
  );
}
