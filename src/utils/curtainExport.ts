/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GlyphCurtainConfig } from '../types/curtain';
import { CurtainMaterial } from '../data/curtainPresets';

/**
 * Returns acoustic harmonic synthesis logic for the selected material.
 */
function getMaterialAudioLogic(material: CurtainMaterial): string {
  switch (material) {
    case 'bamboo':
      return `
    const decay = 2.2;
    const partials = [{ r: 1.0, a: 1.0, t: 'triangle' }, { r: 1.48, a: 0.55, t: 'sine' }, { r: 2.12, a: 0.28, t: 'sine' }];
    playTransient(now, strikeVel, panner, 680, 0.035);
      `;
    case 'bronze':
      return `
    const decay = 5.6;
    const partials = [{ r: 1.0, a: 1.0, t: 'sine' }, { r: (freq + 0.55)/freq, a: 0.82, t: 'sine' }, { r: 1.98, a: 0.35, t: 'sine' }, { r: 2.756, a: 0.45, t: 'sine' }, { r: 4.12, a: 0.16, t: 'sine' }];
    playTransient(now, strikeVel, panner, 1200, 0.028);
      `;
    case 'furin':
      return `
    const decay = 3.6;
    const partials = [{ r: 1.0, a: 1.0, t: 'sine' }, { r: (freq + 1.1)/freq, a: 0.72, t: 'sine' }, { r: 2.95, a: 0.42, t: 'sine' }, { r: 5.8, a: 0.15, t: 'sine' }];
    playTransient(now, strikeVel, panner, 4200, 0.018);
      `;
    case 'bowl':
      return `
    const decay = 6.8;
    const partials = [{ r: 1.0, a: 1.0, t: 'sine' }, { r: (freq + 0.38)/freq, a: 0.88, t: 'sine' }, { r: 2.76, a: 0.48, t: 'sine' }, { r: 4.18, a: 0.22, t: 'sine' }];
    playTransient(now, strikeVel, panner, 540, 0.040);
      `;
    case 'silver':
      return `
    const decay = 4.2;
    const partials = [{ r: 1.0, a: 1.0, t: 'sine' }, { r: 2.01, a: 0.65, t: 'sine' }, { r: 3.14, a: 0.38, t: 'sine' }, { r: 5.82, a: 0.18, t: 'sine' }];
    playTransient(now, strikeVel, panner, 5200, 0.015);
      `;
    case 'stone':
      return `
    const decay = 1.8;
    const partials = [{ r: 1.0, a: 1.0, t: 'triangle' }, { r: 1.62, a: 0.52, t: 'sine' }, { r: 2.38, a: 0.24, t: 'triangle' }];
    playTransient(now, strikeVel, panner, 420, 0.030);
      `;
    case 'harp':
      return `
    const decay = 5.2;
    const partials = [{ r: 1.0, a: 1.0, t: 'sine' }, { r: 2.0, a: 0.55, t: 'sine' }, { r: 3.0, a: 0.32, t: 'sine' }, { r: 4.0, a: 0.16, t: 'sine' }];
    playTransient(now, strikeVel, panner, 1600, 0.025);
      `;
    case 'crystal':
    default:
      return `
    const decay = 4.8;
    const partials = [{ r: 1.0, a: 1.0, t: 'sine' }, { r: (freq + 0.85)/freq, a: 0.78, t: 'sine' }, { r: 2.756, a: 0.32, t: 'sine' }, { r: 5.404, a: 0.12, t: 'sine' }];
    playTransient(now, strikeVel, panner, 3600, 0.020);
      `;
  }
}

/**
 * Generates a complete, self-contained App.tsx that can be dropped directly into
 * ANY new AI Studio, Vite, or React project.
 * It builds instantly without any extra packages, and runs full-screen with full physics and audio.
 */
export function generateStandaloneAppTsxCode(
  config: GlyphCurtainConfig,
  presetName: string = 'Curtain Studio Model',
  material: CurtainMaterial = 'crystal',
  volume: number = 0.85
): string {
  const jsonConfig = JSON.stringify(config, null, 2);

  return `/**
 * Standalone Interactive Glyph Curtain & Chimes Application
 * Preset: ${presetName} | Material: ${material}
 * 
 * =========================================================================
 * HOW TO BUILD IN A NEW AI STUDIO / VITE / REACT PROJECT:
 * 1. Open your project's "src/App.tsx".
 * 2. Replace the ENTIRE contents of "src/App.tsx" with this code.
 * 3. Save! It will compile and run immediately (Zero external packages needed).
 * =========================================================================
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';

// Baked Physical & Visual Parameters
export const CURTAIN_CONFIG = ${jsonConfig};

// 20 Tuned Pentatonic Frequencies (D3 to G6)
const PENTATONIC_FREQUENCIES = [
  146.83, 164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00,
  440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00, 987.77,
  1046.50, 1174.66, 1318.51, 1567.98
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  // Initialize Web Audio API on first user interaction
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => setAudioReady(true));
      }
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();

      // Master Dynamics Compressor / Limiter for clean acoustics without distortion
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-2.5, ctx.currentTime);
      comp.knee.setValueAtTime(8, ctx.currentTime);
      comp.ratio.setValueAtTime(14, ctx.currentTime);
      comp.attack.setValueAtTime(0.003, ctx.currentTime);
      comp.release.setValueAtTime(0.18, ctx.currentTime);

      const master = ctx.createGain();
      master.gain.setValueAtTime(${volume.toFixed(2)}, ctx.currentTime);
      master.connect(comp);
      comp.connect(ctx.destination);

      // Algorithmic convolution reverb buffer for lush lingering sustain
      try {
        const rate = ctx.sampleRate;
        const length = rate * 3.0;
        const impulse = ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
          const data = impulse.getChannelData(ch);
          for (let i = 0; i < length; i++) {
            const t = i / rate;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2.2);
          }
        }
        const reverb = ctx.createConvolver();
        reverb.buffer = impulse;
        const revGain = ctx.createGain();
        revGain.gain.setValueAtTime(0.32, ctx.currentTime);
        reverb.connect(revGain);
        revGain.connect(master);
        reverbNodeRef.current = reverb;
      } catch {}

      audioCtxRef.current = ctx;
      masterGainRef.current = master;
      setAudioReady(true);
    } catch (e) {
      console.warn('AudioContext requires interaction', e);
    }
  }, []);

  // Strike noise transient generator
  const playTransient = useCallback(
    (now: number, vel: number, out: AudioNode, centerFreq = 3600, dur = 0.02) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      try {
        const len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(centerFreq, now);
        filter.Q.setValueAtTime(2.6, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(out);
        src.start(now);
        src.stop(now + dur + 0.01);
      } catch {}
    },
    []
  );

  // Play physical chime note
  const playChime = useCallback(
    (strandRatio: number, velocity: number) => {
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master || ctx.state !== 'running') return;

      const scaleIdx = Math.min(
        PENTATONIC_FREQUENCIES.length - 1,
        Math.floor(strandRatio * PENTATONIC_FREQUENCIES.length)
      );
      let freq = PENTATONIC_FREQUENCIES[scaleIdx];
      ${
        material === 'bronze'
          ? 'freq *= 0.75; // Deep temple gong'
          : material === 'furin'
          ? 'freq *= 1.15; // Bright porcelain'
          : material === 'bowl'
          ? 'freq *= 0.65; // Meditative drone'
          : ''
      }

      const now = ctx.currentTime;
      const strikeVel = Math.max(0.35, Math.min(1.0, velocity));

      let panner: StereoPannerNode | GainNode;
      if (ctx.createStereoPanner) {
        const sp = ctx.createStereoPanner();
        sp.pan.setValueAtTime(Math.max(-0.75, Math.min(0.75, (strandRatio * 2 - 1) * 0.75)), now);
        sp.connect(master);
        if (reverbNodeRef.current) sp.connect(reverbNodeRef.current);
        panner = sp;
      } else {
        panner = master;
      }

      // Material Harmonic Profile
      ${getMaterialAudioLogic(material)}

      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.38 * strikeVel, now + 0.005);
      voiceGain.gain.exponentialRampToValueAtTime(0.00006, now + decay);
      voiceGain.connect(panner);

      partials.forEach(({ r, a, t }) => {
        if (!ctx) return;
        const pFreq = freq * r;
        if (pFreq > 18000) return;
        const osc = ctx.createOscillator();
        const pGain = ctx.createGain();
        osc.type = (t || 'sine') as OscillatorType;
        osc.frequency.setValueAtTime(pFreq, now);
        pGain.gain.setValueAtTime(a, now);
        osc.connect(pGain);
        pGain.connect(voiceGain);
        osc.start(now);
        osc.stop(now + decay + 0.05);
      });
    },
    [playTransient]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = CURTAIN_CONFIG;
    let animId: number;
    const nodesPerStrand = 16;

    interface Particle {
      x: number;
      y: number;
      px: number;
      py: number;
      targetRestX: number;
    }

    interface Strand {
      pinX: number;
      pinY: number;
      totalLength: number;
      segmentLength: number;
      nodes: Particle[];
      glyphs: string[];
      phaseOffset: number;
      lastStruckTime: number;
    }

    let strands: Strand[] = [];
    let strandSpacing = 20;

    const initStrands = (w: number, h: number) => {
      strands = [];
      const numStrands = Math.max(16, Math.min(80, cfg.strandCount));
      const totalWidth = Math.min(w * 0.92, 920);
      const startX = (w - totalWidth) / 2;
      strandSpacing = totalWidth / Math.max(1, numStrands - 1);
      const baseLen = h * 0.82;
      const glyphChars = Array.from(cfg.glyphSet || '✦✧❖⬡◈◇');

      for (let s = 0; s < numStrands; s++) {
        const pinX = startX + s * strandSpacing;
        const pinY = Math.max(16, h * 0.06);
        const jitter = (Math.sin(s * 12.34) * 0.5) * (cfg.lengthJitter || 0.08);
        const totalLength = baseLen * (1 + jitter);
        const segLen = totalLength / (nodesPerStrand - 1);

        const nodes: Particle[] = [];
        for (let i = 0; i < nodesPerStrand; i++) {
          const y = pinY + i * segLen;
          nodes.push({ x: pinX, y, px: pinX, py: y, targetRestX: pinX });
        }

        const glyphs: string[] = [];
        const gCount = Math.max(12, cfg.glyphsPerStrand || 34);
        for (let g = 0; g < gCount; g++) {
          const idx = Math.abs(Math.sin(s * 73 + g * 37) * 10000) % glyphChars.length;
          glyphs.push(glyphChars[Math.floor(idx)]);
        }

        strands.push({
          pinX,
          pinY,
          totalLength,
          segmentLength: segLen,
          nodes,
          glyphs,
          phaseOffset: Math.sin(s * 0.85) * 1.5,
          lastStruckTime: 0,
        });
      }
    };

    const pointer = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      vx: 0,
      vy: 0,
      active: false,
      lastTime: performance.now(),
    };

    const handlePointerMove = (e: PointerEvent) => {
      initAudio();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const dt = Math.max(1, now - pointer.lastTime);
      pointer.vx = (x - pointer.prevX) / dt;
      pointer.vy = (y - pointer.prevY) / dt;
      pointer.prevX = x;
      pointer.prevY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.lastTime = now;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointerdown', handlePointerMove);

    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        initStrands(w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const radius = cfg.interactionRadius || 88;
      const speed = Math.hypot(pointer.vx, pointer.vy);

      // Physics integration
      for (let sIdx = 0; sIdx < strands.length; sIdx++) {
        const strand = strands[sIdx];
        const nodes = strand.nodes;

        for (let i = 1; i < nodes.length; i++) {
          const node = nodes[i];
          const depthRatio = i / (nodes.length - 1);
          const vx = (node.x - node.px) * cfg.damping;
          const vy = (node.y - node.py) * cfg.damping;

          let fx = 0;
          let fy = (cfg.gravity || 1.1) * 980;

          // Restoring spring tension
          const springTension = 14 * (cfg.stiffness || 3) * (node.targetRestX - node.x);
          fx += springTension;

          // Ambient natural breeze
          if (cfg.breezeStrength > 0) {
            const wind =
              Math.sin(currentTime * 0.0018 + strand.phaseOffset + i * 0.2) *
              (cfg.breezeStrength * 160) *
              depthRatio;
            fx += wind;
          }

          // Pointer interaction & collision deflection
          if (pointer.active) {
            const dx = node.x - pointer.x;
            const dy = node.y - pointer.y;
            const dist = Math.hypot(dx, dy);

            if (dist < radius && dist > 0.001) {
              const pushFactor = (1 - dist / radius) * (cfg.interactionStrength || 1.15);
              const pushX = (dx / dist) * pushFactor * 320;
              const pushY = (dy / dist) * pushFactor * 120;
              fx += pushX;
              fy += pushY;

              // Trigger acoustic chime strike
              const timeSinceHit = currentTime - strand.lastStruckTime;
              if (timeSinceHit > 80 && speed > 0.08) {
                strand.lastStruckTime = currentTime;
                const ratio = sIdx / Math.max(1, strands.length - 1);
                playChime(ratio, Math.min(1.0, speed * 0.45 + 0.3));
              }
            }
          }

          node.px = node.x;
          node.py = node.y;
          node.x = node.x + vx + fx * (dt * dt);
          node.y = node.y + vy + fy * (dt * dt);
        }

        // Distance constraint solver
        for (let iter = 0; iter < 4; iter++) {
          nodes[0].x = strand.pinX;
          nodes[0].y = strand.pinY;
          for (let i = 0; i < nodes.length - 1; i++) {
            const n1 = nodes[i];
            const n2 = nodes[i + 1];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const diff = (dist - strand.segmentLength) / dist;
            if (i === 0) {
              n2.x -= dx * diff;
              n2.y -= dy * diff;
            } else {
              n1.x += dx * 0.5 * diff;
              n1.y += dy * 0.5 * diff;
              n2.x -= dx * 0.5 * diff;
              n2.y -= dy * 0.5 * diff;
            }
          }
        }
      }

      // Anti-jamming pass
      const minGap = Math.max(6, strandSpacing * 0.45);
      for (let s = 0; s < strands.length - 1; s++) {
        for (let i = 1; i < nodesPerStrand; i++) {
          const gap = strands[s + 1].nodes[i].x - strands[s].nodes[i].x;
          if (gap < minGap) {
            const push = (minGap - gap) * 0.5;
            strands[s].nodes[i].x -= push;
            strands[s + 1].nodes[i].x += push;
          }
        }
      }

      // Canvas Rendering
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      ctx.font = \`600 \${cfg.fontSize}px \${cfg.glyphFontFamily || 'sans-serif'}\`;
      ctx.fillStyle = cfg.glyphColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let sIdx = 0; sIdx < strands.length; sIdx++) {
        const strand = strands[sIdx];
        const nodes = strand.nodes;
        const glyphs = strand.glyphs;
        const segDists = new Float32Array(nodes.length - 1);
        let totalLen = 0;
        for (let i = 0; i < nodes.length - 1; i++) {
          const d = Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
          segDists[i] = d;
          totalLen += d;
        }
        if (totalLen < 1) totalLen = strand.totalLength;

        let segIdx = 0;
        let segAccum = 0;
        for (let g = 0; g < glyphs.length; g++) {
          const target = (g / Math.max(1, glyphs.length - 1)) * totalLen;
          while (segIdx < nodes.length - 2 && segAccum + segDists[segIdx] < target) {
            segAccum += segDists[segIdx];
            segIdx++;
          }
          const p0 = nodes[segIdx];
          const p1 = nodes[segIdx + 1];
          const frac = Math.max(0, Math.min(1, (target - segAccum) / (segDists[segIdx] || 0.001)));
          const gx = p0.x + (p1.x - p0.x) * frac;
          const gy = p0.y + (p1.y - p0.y) * frac;
          const angle = Math.atan2(p1.x - p0.x, p1.y - p0.y);
          ctx.save();
          ctx.translate(gx, gy);
          if (Math.abs(angle) > 0.005) ctx.rotate(-angle);
          ctx.fillText(glyphs[g], 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointerdown', handlePointerMove);
    };
  }, [playChime, initAudio]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#09090b',
        overflow: 'hidden',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      />

      {/* Audio Activation Button (Automatically hides once audio is unlocked) */}
      {!audioReady && (
        <button
          type="button"
          onClick={initAudio}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            zIndex: 20,
            padding: '8px 16px',
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            color: '#f5f5f4',
            backgroundColor: 'rgba(24, 24, 27, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          🔊 Tap to Enable Chimes
        </button>
      )}

      {/* Unobtrusive info watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '24px',
          pointerEvents: 'none',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.35)',
          letterSpacing: '0.05em',
        }}
      >
        <span>${presetName}</span> · <span>${material}</span> · <span>Hover / Drag to chime</span>
      </div>
    </div>
  );
}
`;
}

/**
 * Generates standalone reusable React Component (ResonantGlyphCurtain.tsx)
 */
export function generateStandaloneReactCode(
  config: GlyphCurtainConfig,
  presetName: string = 'Custom Resonant Curtain',
  material: CurtainMaterial = 'crystal',
  volume: number = 0.85
): string {
  const jsonConfig = JSON.stringify(config, null, 2);

  return `/**
 * Standalone Interactive Glyph Curtain & Chimes Component
 * Preset: ${presetName} | Material: ${material}
 * Zero external dependencies (Pure React + Web APIs)
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface GlyphCurtainProps {
  className?: string;
  autoEnableAudioOnTouch?: boolean;
  onPointerPass?: (normX: number) => void;
}

export const CURTAIN_CONFIG = ${jsonConfig};

const PENTATONIC_FREQUENCIES = [
  146.83, 164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00,
  440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00, 987.77,
  1046.50, 1174.66, 1318.51, 1567.98
];

export default function ResonantGlyphCurtain({
  className = 'w-full h-full min-h-[500px]',
  autoEnableAudioOnTouch = true,
  onPointerPass,
}: GlyphCurtainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => setAudioReady(true));
      }
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-2.5, ctx.currentTime);
      comp.knee.setValueAtTime(8, ctx.currentTime);
      comp.ratio.setValueAtTime(14, ctx.currentTime);
      comp.attack.setValueAtTime(0.003, ctx.currentTime);
      comp.release.setValueAtTime(0.18, ctx.currentTime);

      const master = ctx.createGain();
      master.gain.setValueAtTime(${volume.toFixed(2)}, ctx.currentTime);
      master.connect(comp);
      comp.connect(ctx.destination);

      try {
        const rate = ctx.sampleRate;
        const length = rate * 3.0;
        const impulse = ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
          const data = impulse.getChannelData(ch);
          for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / rate) * 2.2);
          }
        }
        const reverb = ctx.createConvolver();
        reverb.buffer = impulse;
        const revGain = ctx.createGain();
        revGain.gain.setValueAtTime(0.32, ctx.currentTime);
        reverb.connect(revGain);
        revGain.connect(master);
        reverbNodeRef.current = reverb;
      } catch {}

      audioCtxRef.current = ctx;
      masterGainRef.current = master;
      setAudioReady(true);
    } catch {}
  }, []);

  const playTransient = useCallback((now: number, vel: number, out: AudioNode, centerFreq = 3600, dur = 0.02) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(centerFreq, now);
      filter.Q.setValueAtTime(2.6, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * 0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start(now);
      src.stop(now + dur + 0.01);
    } catch {}
  }, []);

  const playChime = useCallback((strandRatio: number, velocity: number) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master || ctx.state !== 'running') return;

    const scaleIdx = Math.min(
      PENTATONIC_FREQUENCIES.length - 1,
      Math.floor(strandRatio * PENTATONIC_FREQUENCIES.length)
    );
    let freq = PENTATONIC_FREQUENCIES[scaleIdx];
    const now = ctx.currentTime;
    const strikeVel = Math.max(0.35, Math.min(1.0, velocity));

    let panner: StereoPannerNode | GainNode;
    if (ctx.createStereoPanner) {
      const sp = ctx.createStereoPanner();
      sp.pan.setValueAtTime(Math.max(-0.75, Math.min(0.75, (strandRatio * 2 - 1) * 0.75)), now);
      sp.connect(master);
      if (reverbNodeRef.current) sp.connect(reverbNodeRef.current);
      panner = sp;
    } else {
      panner = master;
    }

    ${getMaterialAudioLogic(material)}

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(0.38 * strikeVel, now + 0.005);
    voiceGain.gain.exponentialRampToValueAtTime(0.00006, now + decay);
    voiceGain.connect(panner);

    partials.forEach(({ r, a, t }) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();
      osc.type = (t || 'sine') as OscillatorType;
      osc.frequency.setValueAtTime(freq * r, now);
      pGain.gain.setValueAtTime(a, now);
      osc.connect(pGain);
      pGain.connect(voiceGain);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  }, [playTransient]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = CURTAIN_CONFIG;
    let animId: number;
    const nodesPerStrand = 16;

    interface Particle {
      x: number;
      y: number;
      px: number;
      py: number;
      targetRestX: number;
    }

    interface Strand {
      pinX: number;
      pinY: number;
      totalLength: number;
      segmentLength: number;
      nodes: Particle[];
      glyphs: string[];
      phaseOffset: number;
      lastStruckTime: number;
    }

    let strands: Strand[] = [];
    let strandSpacing = 20;

    const initStrands = (w: number, h: number) => {
      strands = [];
      const numStrands = Math.max(16, Math.min(80, cfg.strandCount));
      const totalWidth = Math.min(w * 0.92, 920);
      const startX = (w - totalWidth) / 2;
      strandSpacing = totalWidth / Math.max(1, numStrands - 1);
      const baseLen = h * 0.82;
      const glyphChars = Array.from(cfg.glyphSet || '✦✧❖⬡◈◇');

      for (let s = 0; s < numStrands; s++) {
        const pinX = startX + s * strandSpacing;
        const pinY = Math.max(16, h * 0.06);
        const jitter = (Math.sin(s * 12.34) * 0.5) * (cfg.lengthJitter || 0.08);
        const totalLength = baseLen * (1 + jitter);
        const segLen = totalLength / (nodesPerStrand - 1);

        const nodes: Particle[] = [];
        for (let i = 0; i < nodesPerStrand; i++) {
          const y = pinY + i * segLen;
          nodes.push({ x: pinX, y, px: pinX, py: y, targetRestX: pinX });
        }

        const glyphs: string[] = [];
        const gCount = Math.max(12, cfg.glyphsPerStrand || 34);
        for (let g = 0; g < gCount; g++) {
          const idx = Math.abs(Math.sin(s * 73 + g * 37) * 10000) % glyphChars.length;
          glyphs.push(glyphChars[Math.floor(idx)]);
        }

        strands.push({
          pinX,
          pinY,
          totalLength,
          segmentLength: segLen,
          nodes,
          glyphs,
          phaseOffset: Math.sin(s * 0.85) * 1.5,
          lastStruckTime: 0,
        });
      }
    };

    const pointer = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, vx: 0, vy: 0, active: false, lastTime: performance.now() };

    const handlePointerMove = (e: PointerEvent) => {
      if (autoEnableAudioOnTouch) initAudio();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const dt = Math.max(1, now - pointer.lastTime);
      pointer.vx = (x - pointer.prevX) / dt;
      pointer.vy = (y - pointer.prevY) / dt;
      pointer.prevX = x;
      pointer.prevY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.lastTime = now;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointerdown', handlePointerMove);

    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        initStrands(w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      const radius = cfg.interactionRadius || 88;
      const speed = Math.hypot(pointer.vx, pointer.vy);

      for (let sIdx = 0; sIdx < strands.length; sIdx++) {
        const strand = strands[sIdx];
        const nodes = strand.nodes;

        for (let i = 1; i < nodes.length; i++) {
          const node = nodes[i];
          const depthRatio = i / (nodes.length - 1);
          const vx = (node.x - node.px) * cfg.damping;
          const vy = (node.y - node.py) * cfg.damping;

          let fx = 0;
          let fy = (cfg.gravity || 1.1) * 980;

          const springTension = 14 * (cfg.stiffness || 3) * (node.targetRestX - node.x);
          fx += springTension;

          if (cfg.breezeStrength > 0) {
            const wind = Math.sin(currentTime * 0.0018 + strand.phaseOffset + i * 0.2) * (cfg.breezeStrength * 160) * depthRatio;
            fx += wind;
          }

          if (pointer.active) {
            const dx = node.x - pointer.x;
            const dy = node.y - pointer.y;
            const dist = Math.hypot(dx, dy);

            if (dist < radius && dist > 0.001) {
              const pushFactor = (1 - dist / radius) * (cfg.interactionStrength || 1.15);
              fx += (dx / dist) * pushFactor * 320;
              fy += (dy / dist) * pushFactor * 120;

              const timeSinceHit = currentTime - strand.lastStruckTime;
              if (timeSinceHit > 80 && speed > 0.08) {
                strand.lastStruckTime = currentTime;
                const ratio = sIdx / Math.max(1, strands.length - 1);
                playChime(ratio, Math.min(1.0, speed * 0.45 + 0.3));
                onPointerPass?.(ratio);
              }
            }
          }

          node.px = node.x;
          node.py = node.y;
          node.x = node.x + vx + fx * (dt * dt);
          node.y = node.y + vy + fy * (dt * dt);
        }

        for (let iter = 0; iter < 4; iter++) {
          nodes[0].x = strand.pinX;
          nodes[0].y = strand.pinY;
          for (let i = 0; i < nodes.length - 1; i++) {
            const n1 = nodes[i];
            const n2 = nodes[i + 1];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const diff = (dist - strand.segmentLength) / dist;
            if (i === 0) {
              n2.x -= dx * diff;
              n2.y -= dy * diff;
            } else {
              n1.x += dx * 0.5 * diff;
              n1.y += dy * 0.5 * diff;
              n2.x -= dx * 0.5 * diff;
              n2.y -= dy * 0.5 * diff;
            }
          }
        }
      }

      const minGap = Math.max(6, strandSpacing * 0.45);
      for (let s = 0; s < strands.length - 1; s++) {
        for (let i = 1; i < nodesPerStrand; i++) {
          const gap = strands[s + 1].nodes[i].x - strands[s].nodes[i].x;
          if (gap < minGap) {
            const push = (minGap - gap) * 0.5;
            strands[s].nodes[i].x -= push;
            strands[s + 1].nodes[i].x += push;
          }
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      ctx.font = \`600 \${cfg.fontSize}px \${cfg.glyphFontFamily || 'sans-serif'}\`;
      ctx.fillStyle = cfg.glyphColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let sIdx = 0; sIdx < strands.length; sIdx++) {
        const strand = strands[sIdx];
        const nodes = strand.nodes;
        const glyphs = strand.glyphs;
        const segDists = new Float32Array(nodes.length - 1);
        let totalLen = 0;
        for (let i = 0; i < nodes.length - 1; i++) {
          const d = Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
          segDists[i] = d;
          totalLen += d;
        }
        if (totalLen < 1) totalLen = strand.totalLength;

        let segIdx = 0;
        let segAccum = 0;
        for (let g = 0; g < glyphs.length; g++) {
          const target = (g / Math.max(1, glyphs.length - 1)) * totalLen;
          while (segIdx < nodes.length - 2 && segAccum + segDists[segIdx] < target) {
            segAccum += segDists[segIdx];
            segIdx++;
          }
          const p0 = nodes[segIdx];
          const p1 = nodes[segIdx + 1];
          const frac = Math.max(0, Math.min(1, (target - segAccum) / (segDists[segIdx] || 0.001)));
          const gx = p0.x + (p1.x - p0.x) * frac;
          const gy = p0.y + (p1.y - p0.y) * frac;
          const angle = Math.atan2(p1.x - p0.x, p1.y - p0.y);
          ctx.save();
          ctx.translate(gx, gy);
          if (Math.abs(angle) > 0.005) ctx.rotate(-angle);
          ctx.fillText(glyphs[g], 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointerdown', handlePointerMove);
    };
  }, [playChime, initAudio, onPointerPass, autoEnableAudioOnTouch]);

  return (
    <div className={\`relative overflow-hidden \${className}\`} style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
      />
      {!audioReady && (
        <button
          type="button"
          onClick={initAudio}
          className="absolute bottom-4 right-4 text-xs px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg backdrop-blur-sm transition-all border border-white/10"
        >
          🔊 Enable Chimes
        </button>
      )}
    </div>
  );
}
`;
}

/**
 * Generates plain HTML + Vanilla JS snippet for WordPress, Webflow, Shopify, Squarespace, or static websites.
 */
export function generateVanillaHtmlCode(
  config: GlyphCurtainConfig,
  presetName: string = 'Curtain Chimes',
  material: CurtainMaterial = 'crystal',
  volume: number = 0.85
): string {
  const jsonConfig = JSON.stringify(config, null, 2);

  return `<!-- ============================================================== -->
<!-- Interactive Resonant Glyph Curtain & Chimes                    -->
<!-- Preset: ${presetName} | Material: ${material}                   -->
<!-- Drop this into ANY website (WordPress, Webflow, Shopify, HTML)  -->
<!-- Zero dependencies • Real-time Verlet Physics • Web Audio Chimes -->
<!-- ============================================================== -->

<div id="resonant-chime-container" style="position: relative; width: 100%; height: 640px; background: #09090b; overflow: hidden; touch-action: none;">
  <canvas id="glyph-curtain-canvas" style="display: block; width: 100%; height: 100%; touch-action: none; cursor: crosshair;"></canvas>
  <button id="chime-sound-toggle" style="position: absolute; bottom: 16px; right: 20px; z-index: 10; padding: 7px 15px; font-size: 12px; font-family: system-ui, sans-serif; font-weight: 600; color: #f5f5f4; background: rgba(28,25,23,0.85); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; backdrop-filter: blur(8px); cursor: pointer; transition: all 0.2s ease;">
    🔊 Tap to Enable Chimes
  </button>
</div>

<script>
(function() {
  const container = document.getElementById('resonant-chime-container');
  const canvas = document.getElementById('glyph-curtain-canvas');
  const soundBtn = document.getElementById('chime-sound-toggle');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const cfg = ${jsonConfig};

  const FREQS = [
    146.83, 164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00,
    440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00, 987.77,
    1046.50, 1174.66, 1318.51, 1567.98
  ];

  let audioCtx = null;
  let masterGain = null;
  let reverbNode = null;
  let audioUnlocked = false;

  function initAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
          audioUnlocked = true;
          if (soundBtn) soundBtn.style.display = 'none';
        });
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      const comp = audioCtx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-2.5, audioCtx.currentTime);
      comp.knee.setValueAtTime(8, audioCtx.currentTime);
      comp.ratio.setValueAtTime(14, audioCtx.currentTime);
      comp.attack.setValueAtTime(0.003, audioCtx.currentTime);
      comp.release.setValueAtTime(0.18, audioCtx.currentTime);

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(${volume.toFixed(2)}, audioCtx.currentTime);
      masterGain.connect(comp);
      comp.connect(audioCtx.destination);

      try {
        const rate = audioCtx.sampleRate;
        const len = rate * 3.0;
        const imp = audioCtx.createBuffer(2, len, rate);
        for (let ch = 0; ch < 2; ch++) {
          const d = imp.getChannelData(ch);
          for (let i = 0; i < len; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / rate) * 2.2);
          }
        }
        reverbNode = audioCtx.createConvolver();
        reverbNode.buffer = imp;
        const revGain = audioCtx.createGain();
        revGain.gain.setValueAtTime(0.32, audioCtx.currentTime);
        reverbNode.connect(revGain);
        revGain.connect(masterGain);
      } catch(e) {}

      audioUnlocked = true;
      if (soundBtn) soundBtn.style.display = 'none';
    } catch(e) {}
  }

  if (soundBtn) soundBtn.addEventListener('click', initAudio);

  function playTransient(now, vel, out, centerFreq, dur) {
    if (!audioCtx) return;
    try {
      const len = Math.floor(audioCtx.sampleRate * dur);
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(centerFreq, now);
      filter.Q.setValueAtTime(2.6, now);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(vel * 0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start(now);
      src.stop(now + dur + 0.01);
    } catch(e) {}
  }

  function playChime(strandRatio, vel) {
    if (!audioCtx || !masterGain || audioCtx.state !== 'running') return;
    const scaleIdx = Math.min(FREQS.length - 1, Math.floor(strandRatio * FREQS.length));
    let freq = FREQS[scaleIdx];
    ${
      material === 'bronze'
        ? 'freq *= 0.75;'
        : material === 'furin'
        ? 'freq *= 1.15;'
        : material === 'bowl'
        ? 'freq *= 0.65;'
        : ''
    }

    const now = audioCtx.currentTime;
    const strikeVel = Math.max(0.35, Math.min(1.0, vel));

    let panner = masterGain;
    if (audioCtx.createStereoPanner) {
      const sp = audioCtx.createStereoPanner();
      sp.pan.setValueAtTime(Math.max(-0.75, Math.min(0.75, (strandRatio * 2 - 1) * 0.75)), now);
      sp.connect(masterGain);
      if (reverbNode) sp.connect(reverbNode);
      panner = sp;
    }

    ${getMaterialAudioLogic(material)}

    const voiceGain = audioCtx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(0.38 * strikeVel, now + 0.005);
    voiceGain.gain.exponentialRampToValueAtTime(0.00006, now + decay);
    voiceGain.connect(panner);

    partials.forEach(p => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const pGain = audioCtx.createGain();
      osc.type = p.t || 'sine';
      osc.frequency.setValueAtTime(freq * p.r, now);
      pGain.gain.setValueAtTime(p.a, now);
      osc.connect(pGain);
      pGain.connect(voiceGain);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  }

  const nodesPerStrand = 16;
  let strands = [];
  let strandSpacing = 20;

  function initStrands(w, h) {
    strands = [];
    const numStrands = Math.max(16, Math.min(80, cfg.strandCount));
    const totalWidth = Math.min(w * 0.92, 920);
    const startX = (w - totalWidth) / 2;
    strandSpacing = totalWidth / Math.max(1, numStrands - 1);
    const baseLen = h * 0.82;
    const glyphChars = Array.from(cfg.glyphSet || '✦✧❖⬡◈◇');

    for (let s = 0; s < numStrands; s++) {
      const pinX = startX + s * strandSpacing;
      const pinY = Math.max(16, h * 0.06);
      const jitter = (Math.sin(s * 12.34) * 0.5) * (cfg.lengthJitter || 0.08);
      const totalLength = baseLen * (1 + jitter);
      const segLen = totalLength / (nodesPerStrand - 1);

      const nodes = [];
      for (let i = 0; i < nodesPerStrand; i++) {
        const y = pinY + i * segLen;
        nodes.push({ x: pinX, y: y, px: pinX, py: y, targetRestX: pinX });
      }

      const glyphs = [];
      const gCount = Math.max(12, cfg.glyphsPerStrand || 34);
      for (let g = 0; g < gCount; g++) {
        const idx = Math.abs(Math.sin(s * 73 + g * 37) * 10000) % glyphChars.length;
        glyphs.push(glyphChars[Math.floor(idx)]);
      }

      strands.push({
        pinX: pinX,
        pinY: pinY,
        totalLength: totalLength,
        segmentLength: segLen,
        nodes: nodes,
        glyphs: glyphs,
        phaseOffset: Math.sin(s * 0.85) * 1.5,
        lastStruckTime: 0
      });
    }
  }

  const pointer = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, vx: 0, vy: 0, active: false, lastTime: performance.now() };

  function handlePointerMove(e) {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    const dt = Math.max(1, now - pointer.lastTime);
    pointer.vx = (x - pointer.prevX) / dt;
    pointer.vy = (y - pointer.prevY) / dt;
    pointer.prevX = x;
    pointer.prevY = y;
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    pointer.lastTime = now;
  }

  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerdown', handlePointerMove);
  canvas.addEventListener('pointerleave', function() { pointer.active = false; });

  function resize() {
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const w = container ? container.clientWidth : window.innerWidth;
    const h = container ? container.clientHeight : 640;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      initStrands(w, h);
    }
  }

  resize();
  window.addEventListener('resize', resize);

  let lastTime = performance.now();

  function loop(currentTime) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const radius = cfg.interactionRadius || 88;
    const speed = Math.hypot(pointer.vx, pointer.vy);

    for (let sIdx = 0; sIdx < strands.length; sIdx++) {
      const strand = strands[sIdx];
      const nodes = strand.nodes;

      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const depthRatio = i / (nodes.length - 1);
        const vx = (node.x - node.px) * cfg.damping;
        const vy = (node.y - node.py) * cfg.damping;

        let fx = (14 * (cfg.stiffness || 3) * (node.targetRestX - node.x));
        let fy = (cfg.gravity || 1.1) * 980;

        if (cfg.breezeStrength > 0) {
          fx += Math.sin(currentTime * 0.0018 + strand.phaseOffset + i * 0.2) * (cfg.breezeStrength * 160) * depthRatio;
        }

        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const dist = Math.hypot(dx, dy);

          if (dist < radius && dist > 0.001) {
            const pushFactor = (1 - dist / radius) * (cfg.interactionStrength || 1.15);
            fx += (dx / dist) * pushFactor * 320;
            fy += (dy / dist) * pushFactor * 120;

            if (currentTime - strand.lastStruckTime > 80 && speed > 0.08) {
              strand.lastStruckTime = currentTime;
              playChime(sIdx / Math.max(1, strands.length - 1), Math.min(1.0, speed * 0.45 + 0.3));
            }
          }
        }

        node.px = node.x;
        node.py = node.y;
        node.x = node.x + vx + fx * (dt * dt);
        node.y = node.y + vy + fy * (dt * dt);
      }

      for (let iter = 0; iter < 4; iter++) {
        nodes[0].x = strand.pinX;
        nodes[0].y = strand.pinY;
        for (let i = 0; i < nodes.length - 1; i++) {
          const n1 = nodes[i];
          const n2 = nodes[i + 1];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const diff = (dist - strand.segmentLength) / dist;
          if (i === 0) {
            n2.x -= dx * diff;
            n2.y -= dy * diff;
          } else {
            n1.x += dx * 0.5 * diff;
            n1.y += dy * 0.5 * diff;
            n2.x -= dx * 0.5 * diff;
            n2.y -= dy * 0.5 * diff;
          }
        }
      }
    }

    const minGap = Math.max(6, strandSpacing * 0.45);
    for (let s = 0; s < strands.length - 1; s++) {
      for (let i = 1; i < nodesPerStrand; i++) {
        const gap = strands[s + 1].nodes[i].x - strands[s].nodes[i].x;
        if (gap < minGap) {
          const push = (minGap - gap) * 0.5;
          strands[s].nodes[i].x -= push;
          strands[s + 1].nodes[i].x += push;
        }
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    ctx.font = '600 ' + cfg.fontSize + 'px ' + (cfg.glyphFontFamily || 'sans-serif');
    ctx.fillStyle = cfg.glyphColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let sIdx = 0; sIdx < strands.length; sIdx++) {
      const strand = strands[sIdx];
      const nodes = strand.nodes;
      const glyphs = strand.glyphs;
      const segDists = new Float32Array(nodes.length - 1);
      let totalLen = 0;
      for (let i = 0; i < nodes.length - 1; i++) {
        const d = Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
        segDists[i] = d;
        totalLen += d;
      }
      if (totalLen < 1) totalLen = strand.totalLength;

      let segIdx = 0;
      let segAccum = 0;
      for (let g = 0; g < glyphs.length; g++) {
        const target = (g / Math.max(1, glyphs.length - 1)) * totalLen;
        while (segIdx < nodes.length - 2 && segAccum + segDists[segIdx] < target) {
          segAccum += segDists[segIdx];
          segIdx++;
        }
        const p0 = nodes[segIdx];
        const p1 = nodes[segIdx + 1];
        const frac = Math.max(0, Math.min(1, (target - segAccum) / (segDists[segIdx] || 0.001)));
        const gx = p0.x + (p1.x - p0.x) * frac;
        const gy = p0.y + (p1.y - p0.y) * frac;
        const angle = Math.atan2(p1.x - p0.x, p1.y - p0.y);
        ctx.save();
        ctx.translate(gx, gy);
        if (Math.abs(angle) > 0.005) ctx.rotate(-angle);
        ctx.fillText(glyphs[g], 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  requestAnimationFrame(loop);
})();
<\/script>
`;
}

/**
 * Returns clean JSON configuration.
 */
export function generateConfigJson(
  config: GlyphCurtainConfig,
  presetName: string = 'Custom',
  material: CurtainMaterial = 'crystal',
  volume: number = 0.85
): string {
  const exportPayload = {
    metadata: {
      presetName,
      materialAcoustics: material,
      volume,
      scale: '20-Tuned Pentatonic (D3 - G6)',
      exportDate: new Date().toISOString(),
    },
    config,
  };
  return JSON.stringify(exportPayload, null, 2);
}
