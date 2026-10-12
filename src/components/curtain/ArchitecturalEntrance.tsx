/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from 'react';
import {
  InteractiveGlyphCurtain,
  InteractiveGlyphCurtainHandle,
} from './InteractiveGlyphCurtain';
import { GlyphCurtainConfig } from '../../types/curtain';

export interface ArchitecturalEntranceProps {
  config: GlyphCurtainConfig;
  customOverlayUrl?: string | null;
  customBackgroundUrl?: string | null;
  backgroundColor?: string;
  audioEnabled?: boolean;
  reducedMotion?: boolean;
  onDiagnosticsUpdate?: (diag: {
    pointerX: number;
    pointerY: number;
    isInside: boolean;
    affectedStrands: number;
  }) => void;
}

export const ArchitecturalEntrance = forwardRef<
  InteractiveGlyphCurtainHandle,
  ArchitecturalEntranceProps
>(
  (
    {
      config,
      customOverlayUrl,
      customBackgroundUrl,
      backgroundColor = '#0c0f14',
      audioEnabled,
      reducedMotion,
      onDiagnosticsUpdate,
    },
    ref
  ) => {
    return (
      <div
        className="relative w-full h-full overflow-hidden flex items-center justify-center"
        style={{ backgroundColor }}
      >
        {/* Full-bleed background scene */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {customBackgroundUrl ? (
            <img
              src={customBackgroundUrl}
              alt="Scenic Background"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full bg-gradient-to-b from-[#0a1118] via-[#101b2b] to-[#1c1214]">
              {/* Moon and mountain atmosphere */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-amber-50/80 shadow-[0_0_60px_rgba(254,243,199,0.35)]" />
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[550px] bg-amber-500/10 rounded-full blur-[110px]" />
            </div>
          )}
        </div>

        {/* SHARED SCENE CONTAINER: Locks the 5:4 ratio so curtain, clipping mask, and gateway overlay NEVER drift */}
        <div className="relative w-full h-full max-w-[1250px] aspect-[5/4] max-h-screen z-10 flex items-center justify-center">
          {/* Inner scene backdrop */}
          {!customBackgroundUrl && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <svg
                className="absolute bottom-0 w-full h-64 text-[#0f172a]/70"
                viewBox="0 0 1200 400"
                preserveAspectRatio="none"
              >
                <path d="M0,400 L0,240 Q300,120 600,260 T1200,180 L1200,400 Z" fill="currentColor" />
              </svg>
              <svg
                className="absolute bottom-0 w-full h-44 text-[#080d14]/90"
                viewBox="0 0 1200 300"
                preserveAspectRatio="none"
              >
                <path d="M0,300 L0,180 Q400,60 800,200 T1200,120 L1200,300 Z" fill="currentColor" />
              </svg>
            </div>
          )}

          {/* 2. INTERACTIVE CURTAIN LAYER (In the middle) */}
          <div className="absolute inset-0 z-10">
            <InteractiveGlyphCurtain
              ref={ref}
              config={config}
              audioEnabled={audioEnabled}
              reducedMotion={reducedMotion}
              onDiagnosticsUpdate={onDiagnosticsUpdate}
            />
          </div>

          {/* 3. FOREGROUND ARCHITECTURAL OVERLAY LAYER (In front, pointer-events: none) */}
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            {customOverlayUrl ? (
              <img
                src={customOverlayUrl}
                alt="Foreground Architectural Overlay"
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              /* Built-in architectural gateway with transparent doorway arch (1000x800 viewBox) */
              <svg
                className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                viewBox="0 0 1000 800"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="doorwayShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#000000" floodOpacity="0.8" />
                  </filter>
                  <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="60%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>
                  <linearGradient id="vermilionPillar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7f1d1d" />
                    <stop offset="35%" stopColor="#dc2626" />
                    <stop offset="70%" stopColor="#b91c1c" />
                    <stop offset="100%" stopColor="#450a0a" />
                  </linearGradient>
                  <linearGradient id="goldPlaque" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                </defs>

                {/* Left flank solid wall */}
                <rect x="0" y="240" width="375" height="560" fill="#991b1b" opacity="0.97" />
                <rect x="0" y="240" width="375" height="560" fill="url(#roofGrad)" opacity="0.3" />

                {/* Right flank solid wall */}
                <rect x="625" y="240" width="375" height="560" fill="#991b1b" opacity="0.97" />
                <rect x="625" y="240" width="375" height="560" fill="url(#roofGrad)" opacity="0.3" />

                {/* Upper lintel wall above the door */}
                <rect x="360" y="190" width="280" height="130" fill="#991b1b" />

                {/* Stone base plinths */}
                <rect x="0" y="740" width="1000" height="60" fill="#334155" />
                <rect x="0" y="740" width="1000" height="8" fill="#64748b" />
                <rect x="330" y="710" width="90" height="40" fill="#475569" rx="3" />
                <rect x="580" y="710" width="90" height="40" fill="#475569" rx="3" />

                {/* Vermilion Main Pillars */}
                <rect x="345" y="220" width="45" height="500" fill="url(#vermilionPillar)" rx="2" />
                <rect x="610" y="220" width="45" height="500" fill="url(#vermilionPillar)" rx="2" />
                <rect x="180" y="260" width="35" height="490" fill="url(#vermilionPillar)" rx="2" />
                <rect x="785" y="260" width="35" height="490" fill="url(#vermilionPillar)" rx="2" />

                {/* Doorway Arch Frame Rim (x: 380 to 620, y: 270 to 740) */}
                <path
                  d="M380,740 L380,340 Q380,270 500,270 Q620,270 620,340 L620,740"
                  fill="none"
                  stroke="#450a0a"
                  strokeWidth="20"
                  filter="url(#doorwayShadow)"
                />
                <path
                  d="M385,740 L385,340 Q385,275 500,275 Q615,275 615,340 L615,740"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                />
                <path
                  d="M365,740 L365,340 Q365,250 500,250 Q635,250 635,340 L635,740"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="8"
                />

                {/* Horizontal Beams */}
                <rect x="120" y="220" width="760" height="26" fill="#1e293b" rx="2" />
                <rect x="120" y="222" width="760" height="4" fill="#fbbf24" opacity="0.8" />
                <rect x="140" y="246" width="720" height="14" fill="#0f172a" />

                {/* Upper Plaque with Classical Calligraphy Characters: 朱雀門 */}
                <rect x="420" y="200" width="160" height="48" fill="#1c1917" stroke="url(#goldPlaque)" strokeWidth="3" rx="4" />
                <text
                  x="500"
                  y="232"
                  fill="#fef08a"
                  fontSize="24"
                  fontWeight="bold"
                  fontFamily="'Cinzel', serif"
                  textAnchor="middle"
                  letterSpacing="6"
                >
                  朱雀門
                </text>

                {/* Pagoda Roof Eaves */}
                <path
                  d="M80,230 Q500,195 920,230 Q945,215 905,200 Q500,150 95,200 Q55,215 80,230 Z"
                  fill="url(#roofGrad)"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <path d="M95,200 Q500,150 905,200" fill="none" stroke="#fbbf24" strokeWidth="3" />

                {/* Upper Tier */}
                <rect x="300" y="100" width="400" height="75" fill="#7f1d1d" />
                <rect x="330" y="110" width="340" height="50" fill="#0f172a" rx="2" />

                {/* Top Curved Pagoda Roof */}
                <path
                  d="M160,110 Q500,75 840,110 Q865,95 825,80 Q500,35 175,80 Q135,95 160,110 Z"
                  fill="url(#roofGrad)"
                />
                <path d="M175,80 Q500,35 825,80" fill="none" stroke="#f59e0b" strokeWidth="3" />
                <circle cx="500" cy="30" r="14" fill="#d97706" stroke="#fef08a" strokeWidth="2" />

                {/* Hanging Lanterns */}
                <line x1="280" y1="230" x2="280" y2="280" stroke="#78716c" strokeWidth="2" />
                <rect x="265" y="280" width="30" height="44" fill="#ef4444" rx="6" />
                <rect x="270" y="278" width="20" height="4" fill="#1c1917" />
                <rect x="270" y="324" width="20" height="4" fill="#1c1917" />
                <line x1="280" y1="328" x2="280" y2="350" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="280" cy="302" r="28" fill="#f59e0b" opacity="0.25" filter="url(#doorwayShadow)" />

                <line x1="720" y1="230" x2="720" y2="280" stroke="#78716c" strokeWidth="2" />
                <rect x="705" y="280" width="30" height="44" fill="#ef4444" rx="6" />
                <rect x="710" y="278" width="20" height="4" fill="#1c1917" />
                <rect x="710" y="324" width="20" height="4" fill="#1c1917" />
                <line x1="720" y1="328" x2="720" y2="350" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="720" cy="302" r="28" fill="#f59e0b" opacity="0.25" filter="url(#doorwayShadow)" />

                {/* Cherry blossom tree branch silhouettes on the sides */}
                <path
                  d="M0,450 Q120,420 160,370 Q140,330 110,310"
                  fill="none"
                  stroke="#292524"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="160" cy="370" r="7" fill="#fbcfe8" opacity="0.85" />
                <circle cx="140" cy="350" r="6" fill="#f472b6" opacity="0.85" />
                <circle cx="120" cy="320" r="7" fill="#fbcfe8" opacity="0.85" />
                <circle cx="100" cy="310" r="6" fill="#f472b6" opacity="0.85" />

                <path
                  d="M1000,450 Q880,420 840,370 Q860,330 890,310"
                  fill="none"
                  stroke="#292524"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="840" cy="370" r="7" fill="#fbcfe8" opacity="0.85" />
                <circle cx="860" cy="350" r="6" fill="#f472b6" opacity="0.85" />
                <circle cx="880" cy="320" r="7" fill="#fbcfe8" opacity="0.85" />
                <circle cx="900" cy="310" r="6" fill="#f472b6" opacity="0.85" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ArchitecturalEntrance.displayName = 'ArchitecturalEntrance';
