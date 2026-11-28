'use client';

import React from 'react';

/**
 * Lightweight, zero-network SVG fantasy village base camp backdrop
 * for the Student Dashboard centerpiece.
 */
export function VillageBackdrop({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="vq-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#071426" />
            <stop offset="65%" stopColor="#0D1B2D" />
            <stop offset="100%" stopColor="#142942" />
          </linearGradient>
          <radialGradient id="vq-lantern" cx="50%" cy="62%" r="45%">
            <stop offset="0%" stopColor="#F5B900" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F5B900" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Night sky */}
        <rect width="1200" height="560" fill="url(#vq-sky)" />

        {/* Subtle stars */}
        <g fill="#E9DFC7" opacity="0.45">
          <circle cx="140" cy="70" r="1.5" />
          <circle cx="290" cy="48" r="1.2" />
          <circle cx="430" cy="92" r="1.6" />
          <circle cx="620" cy="54" r="1.3" />
          <circle cx="790" cy="84" r="1.5" />
          <circle cx="960" cy="44" r="1.8" />
          <circle cx="1090" cy="98" r="1.2" />
        </g>

        {/* Crescent moon */}
        <circle cx="990" cy="96" r="24" fill="#E9DFC7" opacity="0.18" />
        <circle cx="1000" cy="90" r="21" fill="#071426" />

        {/* Distant mountain ridge */}
        <path
          d="M0 390 L140 275 L270 345 L410 250 L560 350 L730 265 L890 340 L1050 260 L1200 330 L1200 560 L0 560 Z"
          fill="#0B192C"
        />

        {/* Midground hill & pines */}
        <path
          d="M0 430 Q300 370 600 410 T1200 400 L1200 560 L0 560 Z"
          fill="#10233B"
        />

        {/* Left village watchtower & cottage silhouettes */}
        <g fill="#0A1728" opacity="0.92">
          {/* Watchtower */}
          <rect x="95" y="290" width="52" height="145" rx="2" />
          <polygon points="86,292 121,252 156,292" />
          <rect x="115" y="314" width="12" height="18" rx="2" fill="#F5B900" opacity="0.7" />
          {/* Cottage */}
          <rect x="165" y="348" width="94" height="86" rx="2" />
          <polygon points="154,350 212,310 270,350" />
          <rect x="192" y="374" width="16" height="18" rx="2" fill="#F5B900" opacity="0.65" />
          <rect x="224" y="374" width="16" height="18" rx="2" fill="#F5B900" opacity="0.55" />
        </g>

        {/* Right village library / windmill silhouette */}
        <g fill="#0A1728" opacity="0.92">
          <rect x="950" y="325" width="110" height="110" rx="2" />
          <polygon points="940,327 1005,278 1070,327" />
          <rect x="982" y="355" width="18" height="22" rx="2" fill="#F5B900" opacity="0.7" />
          <rect x="1014" y="355" width="18" height="22" rx="2" fill="#F5B900" opacity="0.5" />
          {/* Pine trees */}
          <polygon points="885,425 910,350 935,425" />
          <polygon points="1085,430 1112,340 1140,430" />
        </g>

        {/* Warm plaza lantern glow behind character */}
        <ellipse cx="600" cy="360" rx="340" ry="210" fill="url(#vq-lantern)" />

        {/* Cobblestone base-camp plaza */}
        <path
          d="M0 448 Q600 422 1200 448 L1200 560 L0 560 Z"
          fill="#0E1E33"
        />
        <ellipse
          cx="600"
          cy="474"
          rx="230"
          ry="28"
          fill="#182F4D"
          stroke="#F5B900"
          strokeOpacity="0.28"
          strokeWidth="2"
        />
        <ellipse
          cx="600"
          cy="474"
          rx="165"
          ry="17"
          fill="#1F3B5E"
        />
      </svg>
    </div>
  );
}
