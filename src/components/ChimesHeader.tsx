/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Wind } from 'lucide-react';

interface ChimesHeaderProps {
  activeView: 'circular' | 'linear';
  setActiveView: (view: 'circular' | 'linear') => void;
  isMuted: boolean;
  toggleMute: () => void;
  triggerGust: () => void;
  openSettings: () => void;
}

export const ChimesHeader: React.FC<ChimesHeaderProps> = ({
  activeView,
  setActiveView,
  isMuted,
  toggleMute,
  triggerGust,
  openSettings,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center">
        <span className="font-serif-title text-lg md:text-xl font-bold tracking-wider text-stone-100">
          Resonant Winds
        </span>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-400">
        <button
          type="button"
          onClick={() => setActiveView('circular')}
          className={`hover:text-stone-100 transition-colors cursor-pointer ${
            activeView === 'circular' ? 'text-amber-300 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Circular Chimes
        </button>
        <button
          type="button"
          onClick={() => setActiveView('linear')}
          className={`hover:text-stone-100 transition-colors cursor-pointer ${
            activeView === 'linear' ? 'text-amber-300 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Pavilion Rack
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="hover:text-stone-100 transition-colors cursor-pointer"
        >
          Scales & Materials
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="hover:text-stone-100 transition-colors cursor-pointer"
        >
          Acoustics
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={triggerGust}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-stone-100 bg-stone-800 hover:bg-stone-700 rounded-lg border border-stone-700 transition-colors whitespace-nowrap cursor-pointer active:scale-95 shadow-sm"
          title="Blow a gust of wind across the chimes"
        >
          <Wind className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Blow Gust</span>
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
            isMuted
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
