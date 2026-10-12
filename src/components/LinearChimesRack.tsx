/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { chimeAudio, ChimeMaterial, ChimeNote, ChimeScale } from '../audio/chimeAudio';

interface LinearChimesRackProps {
  scale: ChimeScale;
  material: ChimeMaterial;
  onChimeStruck?: (note: string, freq: number) => void;
}

export const LinearChimesRack: React.FC<LinearChimesRackProps> = ({
  scale,
  material,
  onChimeStruck,
}) => {
  const [activeTubeIdx, setActiveTubeIdx] = useState<number | null>(null);
  const lastStrikeTimes = useRef<{ [key: number]: number }>({});
  const lastMousePos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: performance.now() });

  const handlePointerEnterTube = (index: number, note: ChimeNote, e: React.PointerEvent) => {
    chimeAudio.init();
    const now = performance.now();
    const last = lastStrikeTimes.current[index] || 0;
    if (now - last < 70) return;
    lastStrikeTimes.current[index] = now;

    // Calculate velocity based on pointer speed
    const dt = Math.max(1, now - lastMousePos.current.time);
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy) / dt;

    lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };

    const velocity = Math.max(0.3, Math.min(1.0, 0.35 + speed * 0.4));
    const pan = ((index / (scale.notes.length - 1)) * 2 - 1) * 0.8;

    chimeAudio.strikeChime(note.freq, velocity, pan);
    setActiveTubeIdx(index);
    if (onChimeStruck) onChimeStruck(note.note, note.freq);

    setTimeout(() => {
      setActiveTubeIdx(prev => (prev === index ? null : prev));
    }, 450);
  };

  const getTubeGradient = () => {
    switch (material) {
      case 'bamboo':
        return 'from-amber-900 via-amber-700 to-amber-950 border-amber-900/60 text-amber-200';
      case 'bronze':
        return 'from-amber-800 via-amber-600 to-yellow-950 border-amber-700/60 text-amber-100';
      case 'glass':
        return 'from-sky-100/80 via-white/90 to-sky-200/70 border-sky-300/80 text-sky-950 backdrop-blur-md';
      case 'furin':
        return 'from-slate-700 via-slate-400 to-slate-900 border-slate-500/50 text-slate-100';
      case 'aluminum':
      default:
        return 'from-stone-400 via-stone-200 to-stone-600 border-stone-400/50 text-stone-900';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Top support beam */}
      <div className="w-full max-w-2xl h-5 rounded-md bg-stone-800 border-b border-stone-700 shadow-xl relative flex items-center justify-center">
        <div className="absolute -top-12 flex items-center gap-12">
          <div className="w-0.5 h-12 bg-stone-600" />
          <div className="w-0.5 h-12 bg-stone-600" />
        </div>
        <span className="text-[10px] tracking-widest uppercase text-stone-500 font-semibold">
          {scale.name} · {scale.element}
        </span>
      </div>

      {/* Rack Chimes Grid */}
      <div className="w-full max-w-2xl flex items-start justify-between gap-2 sm:gap-4 pt-1 pb-12">
        {scale.notes.map((note, idx) => {
          const heightPx = Math.round(180 + (note.lengthRatio || 0.8) * 160);
          const isActive = activeTubeIdx === idx;

          return (
            <div key={note.note + idx} className="flex-1 flex flex-col items-center group relative">
              {/* String from beam */}
              <div className="w-0.5 h-6 bg-stone-500 group-hover:bg-amber-400 transition-colors" />

              {/* Suspension knot */}
              <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mb-0.5" />

              {/* The Chime Tube */}
              <button
                type="button"
                onPointerEnter={e => handlePointerEnterTube(idx, note, e)}
                onPointerDown={e => handlePointerEnterTube(idx, note, e)}
                style={{ height: `${heightPx}px` }}
                className={`w-full max-w-[42px] rounded-t-sm rounded-b-md bg-gradient-to-r ${getTubeGradient()} shadow-lg cursor-pointer transition-all duration-150 transform hover:scale-[1.03] active:scale-95 relative flex flex-col justify-between items-center py-3 border ${
                  isActive
                    ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-stone-950 -translate-y-1'
                    : 'hover:border-amber-300/60'
                }`}
                title={`Strike ${note.note} (${Math.round(note.freq)} Hz)`}
              >
                {/* Nodal suspension hole */}
                <div className="w-2 h-2 rounded-full bg-stone-950/70 border border-black/30 shadow-inner" />

                {/* Sound wave ripple visual on strike */}
                {isActive && (
                  <span className="absolute inset-0 rounded-b-md bg-white/20 animate-pulse pointer-events-none" />
                )}

                {/* Bamboo node lines */}
                {material === 'bamboo' && (
                  <>
                    <div className="w-full h-0.5 bg-amber-950/80 my-auto" />
                    <div className="w-full h-0.5 bg-amber-950/80 my-auto" />
                  </>
                )}

                {/* Note Label */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold font-mono tracking-tight drop-shadow-sm">
                    {note.note}
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {Math.round(note.freq)}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-stone-500 tracking-wide text-center">
        Sweep your cursor across the tubes horizontally to play a resonant glissando
      </p>
    </div>
  );
};
