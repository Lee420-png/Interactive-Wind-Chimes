/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { GlyphCurtainConfig } from '../../types/curtain';
import { CurtainPhysicsEngine, ParticleNode } from './physics';
import { curtainAudio } from './curtainAudio';

export interface InteractiveGlyphCurtainHandle {
  triggerTestRipple: () => void;
}

export interface InteractiveGlyphCurtainProps {
  config: GlyphCurtainConfig;
  className?: string;
  onPointerPassZone?: (normalizedX: number) => void;
  audioEnabled?: boolean;
  reducedMotion?: boolean;
  onDiagnosticsUpdate?: (diag: {
    pointerX: number;
    pointerY: number;
    isInside: boolean;
    affectedStrands: number;
  }) => void;
}

export const InteractiveGlyphCurtain = forwardRef<InteractiveGlyphCurtainHandle, InteractiveGlyphCurtainProps>(
  (
    {
      config,
      className = '',
      onPointerPassZone,
      audioEnabled = false,
      reducedMotion = false,
      onDiagnosticsUpdate,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const physicsRef = useRef<CurtainPhysicsEngine>(new CurtainPhysicsEngine());

    // Mouse & Touch tracking in CSS pixels
    const pointerRef = useRef({
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      vx: 0,
      vy: 0,
      active: false,
      isInside: false,
      lastTime: performance.now(),
    });

    const isOffscreenRef = useRef<boolean>(false);
    const animFrameIdRef = useRef<number | null>(null);

    // Expose imperative handle for manual diagnostic test ripple
    useImperativeHandle(ref, () => ({
      triggerTestRipple: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(2.5, window.devicePixelRatio || 1);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        physicsRef.current.applyRipple(
          w * 0.5,
          h * 0.45,
          45,
          (strandIndex, totalStrands, velocity, normX) => {
            if (audioEnabled) {
              curtainAudio.playStrandChime(strandIndex, totalStrands, velocity, normX);
            }
          }
        );
      },
    }));

    // Handle Resize and Canvas Setup
    const setupCanvasAndPhysics = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);

      // DPR-aware backing store
      canvas.width = Math.max(100, Math.floor(rect.width * dpr));
      canvas.height = Math.max(100, Math.floor(rect.height * dpr));

      // Mobile density adjustment
      const isMobile = rect.width < 640;
      const effectiveStrands = isMobile
        ? Math.max(30, Math.round(config.strandCount * 0.7))
        : config.strandCount;
      const effectiveGlyphs = isMobile
        ? Math.max(20, Math.round(config.glyphsPerStrand * 0.8))
        : config.glyphsPerStrand;

      // Determine curtain width & start position
      let startXOffset: number | undefined;
      let customWidth: number | undefined;

      if (config.clipOpening && config.clipOpening.enabled) {
        startXOffset = rect.width * config.clipOpening.x;
        customWidth = rect.width * config.clipOpening.width;
      } else {
        // Effect Only mode: allow full comfortable centered width
        customWidth = Math.min(rect.width * 0.85, 840);
        startXOffset = (rect.width - customWidth) / 2;
      }

      const topY = config.clipOpening && config.clipOpening.enabled
        ? rect.height * config.clipOpening.y
        : Math.max(24, rect.height * 0.08);

      const curtainHeight = config.clipOpening && config.clipOpening.enabled
        ? rect.height * config.clipOpening.height
        : rect.height * 0.82;

      physicsRef.current.initStrands(
        rect.width,
        rect.height,
        effectiveStrands,
        effectiveGlyphs,
        config.glyphSet,
        topY,
        curtainHeight,
        config.lengthJitter,
        customWidth,
        startXOffset
      );
    }, [config]);

    // Resize listener with ResizeObserver for live drawer resizing
    useEffect(() => {
      setupCanvasAndPhysics();
      const handleResize = () => setupCanvasAndPhysics();
      window.addEventListener('resize', handleResize);

      let ro: ResizeObserver | null = null;
      if (containerRef.current && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
          setupCanvasAndPhysics();
        });
        ro.observe(containerRef.current);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        ro?.disconnect();
      };
    }, [setupCanvasAndPhysics]);

    // Tab visibility & Intersection Observer
    useEffect(() => {
      const handleVisibilityChange = () => {
        isOffscreenRef.current = document.hidden;
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      let observer: IntersectionObserver | null = null;
      if (containerRef.current && window.IntersectionObserver) {
        observer = new IntersectionObserver(([entry]) => {
          isOffscreenRef.current = !entry.isIntersecting;
        });
        observer.observe(containerRef.current);
      }

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (observer) observer.disconnect();
      };
    }, []);

    // Main Render & Simulation Loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let lastTime = performance.now();
      let diagThrottle = 0;

      const render = (currentTime: number) => {
        animFrameIdRef.current = requestAnimationFrame(render);

        // Skip render if offscreen or tab is hidden
        if (isOffscreenRef.current) return;

        const dt = Math.min(0.04, (currentTime - lastTime) / 1000);
        lastTime = currentTime;

        const dpr = Math.min(2.5, window.devicePixelRatio || 1);
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        // Update pointer velocity in CSS pixels per ms
        const p = pointerRef.current;
        const nowMs = performance.now();
        const pDt = Math.max(1, nowMs - p.lastTime);
        p.vx = (p.x - p.prevX) / pDt;
        p.vy = (p.y - p.prevY) / pDt;
        p.prevX = p.x;
        p.prevY = p.y;
        p.lastTime = nowMs;

        // Update physics simulation and trigger chimes per strand hit!
        const physics = physicsRef.current;
        physics.update(
          dt,
          currentTime,
          p,
          {
            gravity: config.gravity,
            damping: config.damping,
            stiffness: config.stiffness,
            interactionRadius: config.interactionRadius,
            interactionStrength: config.interactionStrength,
            breezeStrength: config.breezeStrength,
          },
          reducedMotion,
          (strandIndex, totalStrands, velocity, normX) => {
            // Every chain struck plays its own individual tuned chime!
            if (audioEnabled) {
              curtainAudio.playStrandChime(strandIndex, totalStrands, velocity, normX);
            }
            if (onPointerPassZone) onPointerPassZone(normX);
          }
        );

        // Send diagnostics to parent ~10 times a second
        if (onDiagnosticsUpdate && currentTime - diagThrottle > 100) {
          diagThrottle = currentTime;
          onDiagnosticsUpdate({
            pointerX: Math.round(p.x),
            pointerY: Math.round(p.y),
            isInside: p.isInside && p.active,
            affectedStrands: physics.lastAffectedStrandsCount,
          });
        }

        // Draw canvas
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // Apply clipping mask if configured (e.g. for entrance archways)
        const clip = config.clipOpening;
        if (clip && clip.enabled) {
          const clipX = width * clip.x;
          const clipY = height * clip.y;
          const clipW = width * clip.width;
          const clipH = height * clip.height;
          const archR = clip.archRadius ? clipW * clip.archRadius : 0;

          ctx.beginPath();
          if (archR > 0) {
            ctx.moveTo(clipX, clipY + archR);
            ctx.arcTo(clipX, clipY, clipX + clipW, clipY, archR);
            ctx.arcTo(clipX + clipW, clipY, clipX + clipW, clipY + clipH, archR);
            ctx.lineTo(clipX + clipW, clipY + clipH);
            ctx.lineTo(clipX, clipY + clipH);
            ctx.closePath();
          } else {
            ctx.rect(clipX, clipY, clipW, clipH);
          }
          ctx.clip();
        }

        // Font styling
        ctx.font = `600 ${config.fontSize}px ${config.glyphFontFamily}`;
        ctx.fillStyle = config.glyphColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Render each strand and its glyphs with true arc-length distribution
        const strands = physics.strands;

        for (let sIdx = 0; sIdx < strands.length; sIdx++) {
          const strand = strands[sIdx];
          const nodes = strand.nodes;
          const glyphs = strand.glyphs;
          const totalGlyphs = glyphs.length;

          // Precompute cumulative arc length along the strand polyline
          const segDists = new Float32Array(nodes.length - 1);
          let totalStrandArcLength = 0;
          for (let i = 0; i < nodes.length - 1; i++) {
            const d = Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
            segDists[i] = d;
            totalStrandArcLength += d;
          }

          if (totalStrandArcLength < 1) totalStrandArcLength = strand.totalLength;

          let segIdx = 0;
          let segAccumStart = 0;

          // Strict arc-length distribution ensures characters are always evenly spaced along the cord
          // and can NEVER bunch, stack, or smudge on top of each other!
          for (let g = 0; g < totalGlyphs; g++) {
            const targetDist = (g / Math.max(1, totalGlyphs - 1)) * totalStrandArcLength;

            while (
              segIdx < nodes.length - 2 &&
              segAccumStart + segDists[segIdx] < targetDist
            ) {
              segAccumStart += segDists[segIdx];
              segIdx++;
            }

            const p0: ParticleNode = nodes[segIdx];
            const p1: ParticleNode = nodes[segIdx + 1];
            const segLen = segDists[segIdx] || 0.001;
            const frac = Math.max(0, Math.min(1, (targetDist - segAccumStart) / segLen));

            // Interpolated glyph coordinate
            const gx = p0.x + (p1.x - p0.x) * frac;
            const gy = p0.y + (p1.y - p0.y) * frac;

            // Compute local strand tangent angle
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const localAngle = Math.atan2(dx, dy);

            // Draw individual glyph with subtle local rotation
            ctx.save();
            ctx.translate(gx, gy);
            if (Math.abs(localAngle) > 0.005) {
              ctx.rotate(-localAngle);
            }
            ctx.fillText(glyphs[g], 0, 0);
            ctx.restore();
          }
        }

        ctx.restore();
      };

      animFrameIdRef.current = requestAnimationFrame(render);

      return () => {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
        }
      };
    }, [config, reducedMotion, audioEnabled, onPointerPassZone, onDiagnosticsUpdate]);

    // Check whether a coordinate in CSS pixels is within the interactive opening
    const checkIsInsideOpening = useCallback(
      (x: number, y: number, w: number, h: number): boolean => {
        // In Effect-Only mode, the entire canvas is interactive!
        if (!config.clipOpening || !config.clipOpening.enabled) {
          return x >= 0 && x <= w && y >= 0 && y <= h;
        }

        const clip = config.clipOpening;
        const minX = w * clip.x;
        const maxX = minX + w * clip.width;
        const minY = h * clip.y;
        const maxY = minY + h * clip.height;

        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      },
      [config.clipOpening]
    );

    // Pointer Interaction Handlers
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const isInside = checkIsInsideOpening(x, y, rect.width, rect.height);

      // Wake up physics engine on pointer motion
      physicsRef.current.isSettled = false;

      pointerRef.current.x = x;
      pointerRef.current.y = y;
      pointerRef.current.isInside = isInside;
      pointerRef.current.active = isInside;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      handlePointerMove(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
      pointerRef.current.isInside = false;
      pointerRef.current.x = -9999;
      pointerRef.current.y = -9999;
    };

    // Keyboard accessibility: Arrow keys and spacebar ripple
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const curX = pointerRef.current.x > 0 ? pointerRef.current.x : rect.width * 0.5;
      const curY = pointerRef.current.y > 0 ? pointerRef.current.y : rect.height * 0.45;
      const step = 32;

      let nextX = curX;
      let nextY = curY;
      let triggered = false;

      if (e.key === 'ArrowLeft') {
        nextX = Math.max(10, curX - step);
        triggered = true;
      } else if (e.key === 'ArrowRight') {
        nextX = Math.min(rect.width - 10, curX + step);
        triggered = true;
      } else if (e.key === 'ArrowUp') {
        nextY = Math.max(10, curY - step);
        triggered = true;
      } else if (e.key === 'ArrowDown') {
        nextY = Math.min(rect.height - 10, curY + step);
        triggered = true;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        physicsRef.current.applyRipple(
          curX,
          curY,
          42,
          (strandIndex, totalStrands, velocity, normX) => {
            if (audioEnabled) {
              curtainAudio.playStrandChime(strandIndex, totalStrands, velocity, normX);
            }
          }
        );
        return;
      }

      if (triggered) {
        e.preventDefault();
        physicsRef.current.isSettled = false;
        pointerRef.current.x = nextX;
        pointerRef.current.y = nextY;
        pointerRef.current.active = true;
        pointerRef.current.isInside = true;

        setTimeout(() => {
          if (pointerRef.current.x === nextX && pointerRef.current.y === nextY) {
            pointerRef.current.active = false;
          }
        }, 350);
      }
    };

    return (
      <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive character curtain. Move cursor, drag on touch, or use arrow keys to part the strands."
        onKeyDown={handleKeyDown}
        className={`relative w-full h-full select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${className}`}
      >
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
        />
      </div>
    );
  }
);

InteractiveGlyphCurtain.displayName = 'InteractiveGlyphCurtain';
