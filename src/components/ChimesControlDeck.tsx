/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ChimeMaterial,
  ChimeScaleKey,
  ReverbEnvironment,
  AmbienceType,
  ChimeScale,
} from '../audio/chimeAudio';
import { Wind, Sliders, Music, Sparkles } from 'lucide-react';

interface ChimesControlDeckProps {
  currentMaterial: ChimeMaterial;
  setMaterial: (mat: ChimeMaterial) => void;
  currentScaleKey: ChimeScaleKey;
  setScaleKey: (key: ChimeScaleKey) => void;
  scalesMap: Record<ChimeScaleKey, ChimeScale>;
  reverbEnv: ReverbEnvironment;
  setReverbEnv: (env: ReverbEnvironment) => void;
  ambience: AmbienceType;
  setAmbience: (type: AmbienceType) => void;
  windStrength: number;
  setWindStrength: (strength: number) => void;
  triggerGust: () => void;
  pitchStandard: number;
  setPitchStandard: (pitch: number) => void;
  volume: number;
  setVolume: (vol: number) => void;
  onPlayNotePad: (index: number) => void;
}

const MATERIALS: { id: ChimeMaterial; name: string; subtitle: string }[] = [
  { id: 'aluminum', name: 'Celestial Silver', subtitle: 'Tuned aluminum with crystalline shimmer' },
  { id: 'bronze', name: 'Tibetan Bronze', subtitle: 'Deep meditative temple sustain & undertones' },
  { id: 'bamboo', name: 'Kyoto Bamboo', subtitle: 'Warm organic hollow wood knocks' },
  { id: 'glass', name: 'Bohemian Crystal', subtitle: 'Delicate high-frequency glass tinkling' },
  { id: 'furin', name: 'Japanese Fūrin', subtitle: 'Clear wind bell with fluttering strip' },
];

const REVERB_SPACES: { id: ReverbEnvironment; name: string; desc: string }[] = [
  { id: 'porch', name: 'Covered Veranda', desc: 'Warm wooden reflections' },
  { id: 'temple', name: 'Mountain Temple', desc: 'Deep cathedral decay' },
  { id: 'garden', name: 'Open Zen Garden', desc: 'Diffuse open-air acoustics' },
];

const AMBIENCE_CHOICES: { id: AmbienceType; name: string }[] = [
  { id: 'evening', name: 'Summer Porch' },
  { id: 'stream', name: 'Bamboo Brook' },
  { id: 'breeze', name: 'Mountain Air' },
  { id: 'none', name: 'Silent' },
];

export const ChimesControlDeck: React.FC<ChimesControlDeckProps> = ({
  currentMaterial,
  setMaterial,
  currentScaleKey,
  setScaleKey,
  scalesMap,
  reverbEnv,
  setReverbEnv,
  ambience,
  setAmbience,
  windStrength,
  setWindStrength,
  triggerGust,
  pitchStandard,
  setPitchStandard,
  volume,
  setVolume,
  onPlayNotePad,
}) => {
  const currentScale = scalesMap[currentScaleKey];

  return (
    <div className="w-full bg-stone-900/90 border-t border-stone-800 backdrop-blur-xl px-4 py-5 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Row 1: Interactive Note Strike Strip & Scales */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          {/* Note pads */}
          <div className="w-full lg:w-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-300" />
                Tuned Chime Tubes
              </span>
              <div className="text-xs text-stone-500">
                <span>{currentScale.name}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>{currentScale.element}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentScale.notes.map((n, i) => (
                <button
                  key={n.note + i}
                  type="button"
                  onClick={() => onPlayNotePad(i)}
                  className="flex-1 sm:w-11 h-12 rounded-lg bg-stone-800/80 hover:bg-stone-700 active:bg-amber-500/20 border border-stone-700/80 hover:border-amber-400/60 transition-all flex flex-col items-center justify-center cursor-pointer group shadow-sm"
                  title={`Ring ${n.note} (${Math.round(n.freq)} Hz)`}
                >
                  <span className="text-xs font-bold text-stone-100 group-hover:text-amber-300 font-mono">
                    {n.note}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {Math.round(n.freq)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scale Selector segmented bar */}
          <div className="w-full lg:w-auto">
            <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Harmonic Scales
            </div>
            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-stone-950/80 rounded-lg border border-stone-800">
              {(Object.keys(scalesMap) as ChimeScaleKey[]).map(key => {
                const s = scalesMap[key];
                const active = currentScaleKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setScaleKey(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap text-center ${
                      active
                        ? 'bg-stone-800 text-amber-300 shadow-sm border border-stone-700 font-semibold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Material Selection & Environment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Chime Material */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-300" />
                Chime Material Physics
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {MATERIALS.map(m => {
                const active = currentMaterial === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaterial(m.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-stone-800/90 border-amber-400/50 text-stone-100 shadow-sm'
                        : 'bg-stone-950/40 border-stone-800/80 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-medium ${active ? 'text-amber-300 font-semibold' : ''}`}>
                        {m.name}
                      </div>
                      <div className="text-[11px] text-stone-400 leading-tight">
                        {m.subtitle}
                      </div>
                    </div>
                    {active && <span className="text-amber-400 text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Wind & Gust Controls */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-amber-300" />
              Wind Dynamics
            </div>

            <div className="p-3.5 rounded-lg bg-stone-950/60 border border-stone-800 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Ambient Wind Strength</span>
                  <span className="text-stone-200 font-mono">
                    {windStrength === 0
                      ? 'Still Air'
                      : windStrength < 0.35
                      ? 'Gentle Breeze'
                      : windStrength < 0.7
                      ? 'Steady Wind'
                      : 'Mountain Gust'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={windStrength}
                  onChange={e => setWindStrength(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg appearance-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={triggerGust}
                  className="flex-1 py-2 px-3 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <Wind className="w-3.5 h-3.5" />
                  Trigger Natural Gust
                </button>
              </div>

              {/* Pitch Reference: 440 vs 432 Hz */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                <span className="text-stone-400">Concert Reference</span>
                <div className="flex items-center gap-1 p-0.5 bg-stone-900 rounded border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setPitchStandard(440)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                      pitchStandard === 440
                        ? 'bg-stone-800 text-white font-semibold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    440 Hz
                  </button>
                  <button
                    type="button"
                    onClick={() => setPitchStandard(432)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                      pitchStandard === 432
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    432 Hz (Verdi)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Space Acoustics & Nature Soundscape */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Acoustic Environment
            </div>

            <div className="p-3.5 rounded-lg bg-stone-950/60 border border-stone-800 space-y-3.5">
              {/* Reverb selection */}
              <div>
                <label className="text-xs text-stone-400 block mb-1.5">Reverb Space</label>
                <div className="grid grid-cols-3 gap-1">
                  {REVERB_SPACES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReverbEnv(r.id)}
                      className={`px-2 py-1.5 text-xs rounded border text-center transition-all cursor-pointer ${
                        reverbEnv === r.id
                          ? 'bg-stone-800 border-amber-400/50 text-amber-300 font-medium'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                      title={r.desc}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nature soundscape */}
              <div>
                <label className="text-xs text-stone-400 block mb-1.5">Background Ambience</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AMBIENCE_CHOICES.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAmbience(a.id)}
                      className={`px-2.5 py-1.5 text-xs rounded border text-left transition-all cursor-pointer ${
                        ambience === a.id
                          ? 'bg-stone-800 border-amber-400/50 text-amber-300 font-medium'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Volume */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Master Chime Volume</span>
                  <span className="text-stone-300 font-mono">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-800 rounded-lg appearance-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quiet footer metadata */}
        <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-stone-400 border-t border-stone-800/60">
          <div className="flex items-center gap-2">
            <span>Euler-Bernoulli Modal Physics</span>
            <span aria-hidden="true">·</span>
            <span>Spatial Stereo Panning</span>
            <span aria-hidden="true">·</span>
            <span>Acoustic Tube Chorus Splitting</span>
          </div>
          <div className="text-stone-400">
            Resonant Winds Interactive Studio
          </div>
        </div>
      </div>
    </div>
  );
};
