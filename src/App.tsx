/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GlyphCurtainConfig, SceneMode } from './types/curtain';
import {
  CURTAIN_PRESETS,
  CurtainPreset,
} from './data/curtainPresets';
import {
  InteractiveGlyphCurtain,
  InteractiveGlyphCurtainHandle,
} from './components/curtain/InteractiveGlyphCurtain';
import { ArchitecturalEntrance } from './components/curtain/ArchitecturalEntrance';
import { CurtainControls } from './components/curtain/CurtainControls';
import { ExportCodeModal } from './components/curtain/ExportCodeModal';
import { curtainAudio } from './components/curtain/curtainAudio';
import {
  Volume2,
  VolumeX,
  Sliders,
  Code2,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [sceneMode, setSceneMode] = useState<SceneMode>('effect-only');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [audioState, setAudioState] = useState<AudioContextState | 'uninitialized'>('uninitialized');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Canvas Theme: 'dark' (Nothing Studio Dark) or 'paper' (Warm Japanese Gallery Paper)
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'paper'>('dark');

  // Active Physical Preset (string ID or null for unselected custom mode)
  const [activePresetId, setActivePresetId] = useState<string | null>('edo-furin');
  const activePreset = activePresetId
    ? CURTAIN_PRESETS.find(p => p.id === activePresetId) || null
    : null;

  // Motion preference & testing override
  const [systemPrefersReduced, setSystemPrefersReduced] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Motion mode: 'system' | 'full' (explicit test override) | 'reduced'
  const [motionSetting, setMotionSetting] = useState<'system' | 'full' | 'reduced'>('system');
  const isReducedMotion =
    motionSetting === 'full' ? false : motionSetting === 'reduced' ? true : systemPrefersReduced;

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState({
    pointerX: 0,
    pointerY: 0,
    isInside: false,
    affectedStrands: 0,
  });

  // Imperative handle to trigger test ripple
  const curtainRef = useRef<InteractiveGlyphCurtainHandle | null>(null);

  // Custom uploaded images
  const [customOverlayUrl, setCustomOverlayUrl] = useState<string | null>(null);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);

  // Config per mode initialized from active preset
  const [effectConfig, setEffectConfig] = useState<GlyphCurtainConfig>(() => {
    const preset = CURTAIN_PRESETS.find(p => p.id === 'edo-furin') || CURTAIN_PRESETS[0];
    return {
      ...preset.effectOnlyConfig,
      // If dark canvas theme, default to high-contrast lacquer vermilion
      glyphColor: '#e11d48',
    };
  });

  const [entranceConfig, setEntranceConfig] = useState<GlyphCurtainConfig>(() => {
    const preset = CURTAIN_PRESETS.find(p => p.id === 'edo-furin') || CURTAIN_PRESETS[0];
    return preset.entranceConfig;
  });

  const currentConfig = sceneMode === 'effect-only' ? effectConfig : entranceConfig;

  // Select Preset handler (updates physics, glyphs, density, and sound profile)
  const handleSelectPreset = (preset: CurtainPreset) => {
    // If clicking the active preset, unselect it
    if (activePresetId === preset.id) {
      setActivePresetId(null);
      return;
    }

    setActivePresetId(preset.id);
    const newColor = canvasTheme === 'dark'
      ? (preset.effectOnlyConfig.glyphColor === '#1c1917' ? '#e11d48' : preset.effectOnlyConfig.glyphColor)
      : preset.effectOnlyConfig.glyphColor;

    setEffectConfig({
      ...preset.effectOnlyConfig,
      glyphColor: newColor,
    });
    setEntranceConfig(preset.entranceConfig);
    curtainAudio.setMaterial(preset.material);
  };

  const handleUnselectPreset = () => {
    setActivePresetId(null);
  };

  const handleConfigChange = (newConfig: GlyphCurtainConfig) => {
    if (sceneMode === 'effect-only') {
      setEffectConfig(newConfig);
    } else {
      setEntranceConfig(newConfig);
    }
  };

  // Audio activation directly inside user click handler
  const handleToggleAudio = async () => {
    if (!audioEnabled || audioState !== 'running') {
      const isRunning = await curtainAudio.enable();
      setAudioEnabled(isRunning);
      setAudioState(curtainAudio.getContextState());
    } else {
      curtainAudio.disable();
      setAudioEnabled(false);
      setAudioState(curtainAudio.getContextState());
    }
  };

  const handleTestSound = async () => {
    await curtainAudio.playTestChime();
    setAudioEnabled(true);
    setAudioState(curtainAudio.getContextState());
  };

  const handleTestRipple = () => {
    curtainRef.current?.triggerTestRipple();
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    curtainAudio.setVolume(vol);
  };

  const handleUploadOverlay = (file: File) => {
    const url = URL.createObjectURL(file);
    setCustomOverlayUrl(url);
    setSceneMode('entrance');
  };

  const handleUploadBackground = (file: File) => {
    const url = URL.createObjectURL(file);
    setCustomBackgroundUrl(url);
    setSceneMode('entrance');
  };

  const handleResetDefaults = () => {
    const target = activePreset || CURTAIN_PRESETS[3];
    handleSelectPreset(target);
  };

  const handleCycleMotion = () => {
    if (motionSetting === 'system') {
      setMotionSetting('full');
    } else if (motionSetting === 'full') {
      setMotionSetting('reduced');
    } else {
      setMotionSetting('system');
    }
  };

  // Toggle canvas theme and adjust contrast
  const handleToggleCanvasTheme = (theme: 'dark' | 'paper') => {
    setCanvasTheme(theme);
    if (theme === 'dark' && effectConfig.glyphColor === '#1c1917') {
      setEffectConfig(prev => ({ ...prev, glyphColor: '#e11d48' }));
    } else if (theme === 'paper' && effectConfig.glyphColor === '#ffffff') {
      setEffectConfig(prev => ({ ...prev, glyphColor: '#1c1917' }));
    }
  };

  const isSoundActive = audioEnabled && audioState === 'running' && !isMuted;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#09090b] text-stone-100 select-none antialiased">
      {/* Top Bar Header (SaaS Studio Top Bar) */}
      <header className="h-13 w-full flex items-center justify-between px-5 border-b border-white/[0.08] bg-[#0c0c0e]/95 backdrop-blur-md z-30 shrink-0">
        {/* Zone 1: Wordmark & Scene Mode Switcher */}
        <div className="flex items-center gap-4">
          <span className="font-serif tracking-widest text-sm font-bold text-stone-100 uppercase">
            Resonant Curtain
          </span>

          {/* Mode Switcher Segmented Control */}
          <div className="hidden sm:flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/[0.08] text-xs">
            <button
              type="button"
              onClick={() => setSceneMode('effect-only')}
              className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                sceneMode === 'effect-only'
                  ? 'bg-stone-800 text-amber-300 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Effect Canvas
            </button>
            <button
              type="button"
              onClick={() => setSceneMode('entrance')}
              className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                sceneMode === 'entrance'
                  ? 'bg-stone-800 text-amber-300 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Gateway Arch
            </button>
          </div>
        </div>


        {/* Zone 3: Primary SaaS Actions */}
        <div className="flex items-center gap-2">
          {/* Motion State */}
          <button
            type="button"
            onClick={handleCycleMotion}
            className="hidden xl:inline-block text-[11px] font-mono text-stone-400 hover:text-stone-200 px-2 py-1 rounded border border-transparent hover:border-white/10 transition-colors"
            title="Click to toggle motion mode"
          >
            {motionSetting === 'full' ? 'Full Motion' : motionSetting === 'reduced' ? 'Reduced' : 'Normal'}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isSoundActive
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300 shadow-xs'
                : 'bg-white/[0.03] border-white/10 text-stone-300 hover:text-white hover:bg-white/[0.06]'
            }`}
            title={isSoundActive ? 'Sound is active' : 'Click to Enable Sound'}
          >
            {isSoundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSoundActive ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Export Code / Embed */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
            title="Export and copy embed code"
          >
            <Code2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Export Code</span>
          </button>

          {/* Inspector Panel Toggle */}
          <button
            type="button"
            onClick={() => setShowControls(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              showControls
                ? 'bg-stone-800 text-amber-300 border-white/20 shadow-xs'
                : 'bg-white/[0.03] text-stone-300 border-white/10 hover:bg-white/[0.06]'
            }`}
            title="Toggle Inspector Sidebar"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace: Full-Height Canvas Stage + Collapsible Right Sidebar */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-row">
        {/* The Hero Stage (Full Height / Width Interactive Canvas) */}
        <main
          className={`relative flex-1 h-full overflow-hidden flex items-center justify-center transition-colors ${
            sceneMode === 'effect-only'
              ? canvasTheme === 'dark'
                ? 'bg-[#09090b]'
                : 'bg-[#fbf9f5]'
              : 'bg-[#09090b]'
          }`}
        >
          {/* Floating Expand Tab on Right Edge (when Inspector is collapsed) */}
          {!showControls && (
            <button
              type="button"
              onClick={() => setShowControls(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 py-3.5 px-2 bg-[#141418]/90 hover:bg-[#1e1e24] border-l-0 border border-white/15 rounded-l-xl text-stone-300 hover:text-amber-300 backdrop-blur-md shadow-2xl transition-all cursor-pointer group"
              title="Expand Inspector (Open Settings)"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="[writing-mode:vertical-rl] text-[10px] font-mono tracking-widest uppercase text-stone-400 group-hover:text-stone-200">
                Inspector
              </span>
            </button>
          )}

          {sceneMode === 'effect-only' ? (
            /* Mode 1: Effect Canvas */
            <div className="relative w-full h-full flex items-center justify-center">
              <InteractiveGlyphCurtain
                ref={curtainRef}
                config={effectConfig}
                audioEnabled={isSoundActive}
                reducedMotion={isReducedMotion}
                onDiagnosticsUpdate={setDiagnostics}
                className="w-full h-full"
              />

              {/* Theme Switcher in Canvas Top-Right */}
              <div className="absolute top-4 right-5 z-10 flex items-center gap-1 p-0.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[11px] font-mono shadow-sm">
                <button
                  type="button"
                  onClick={() => handleToggleCanvasTheme('dark')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    canvasTheme === 'dark'
                      ? 'bg-stone-800 text-stone-100 font-semibold shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Studio Void Dark theme"
                >
                  <Moon className="w-3 h-3" />
                  <span>Void</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCanvasTheme('paper')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    canvasTheme === 'paper'
                      ? 'bg-stone-200 text-stone-900 font-semibold shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Japanese Gallery Paper theme"
                >
                  <Sun className="w-3 h-3" />
                  <span>Paper</span>
                </button>
              </div>

              {/* Clean Unboxed Metadata in Canvas Bottom-Left (Zero-Pill Discipline) */}
              <div
                className={`absolute bottom-4 left-6 pointer-events-none text-xs font-mono tracking-wide flex items-center gap-2 ${
                  canvasTheme === 'dark' ? 'text-stone-400' : 'text-stone-600'
                }`}
              >
                <span className={canvasTheme === 'dark' ? 'text-stone-200 font-semibold' : 'text-stone-900 font-semibold'}>
                  {activePreset ? activePreset.name : 'Custom Configuration'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{effectConfig.strandCount} Strands</span>
                <span aria-hidden="true">·</span>
                <span>Pentatonic Scale</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{activePreset ? activePreset.material : curtainAudio.material}</span>
              </div>

              {/* Unobtrusive Interaction Hint in Canvas Bottom-Right */}
              <div
                className={`absolute bottom-4 right-6 pointer-events-none hidden sm:flex items-center gap-3 text-xs font-mono ${
                  canvasTheme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                <span>Hover / drag to part cords</span>
                <span aria-hidden="true">·</span>
                <span>Space to ripple</span>
              </div>
            </div>
          ) : (
            /* Mode 2: Gateway Arch Scene */
            <div className="relative w-full h-full">
              <ArchitecturalEntrance
                ref={curtainRef}
                config={entranceConfig}
                customOverlayUrl={customOverlayUrl}
                customBackgroundUrl={customBackgroundUrl}
                audioEnabled={isSoundActive}
                reducedMotion={isReducedMotion}
                onDiagnosticsUpdate={setDiagnostics}
              />

              {/* Bottom Unboxed Metadata */}
              <div className="absolute bottom-4 left-6 pointer-events-none text-xs font-mono tracking-wide flex items-center gap-2 text-stone-400">
                <span className="text-stone-200 font-semibold">{activePreset ? activePreset.name : 'Custom Gateway'}</span>
                <span aria-hidden="true">·</span>
                <span>Archway Masking Active</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{activePreset ? activePreset.material : curtainAudio.material}</span>
              </div>
            </div>
          )}
        </main>

        {/* The Studio Inspector Panel (Collapsible Right Sidebar) */}
        {showControls && (
          <aside className="w-80 lg:w-96 h-full border-l border-white/[0.08] shadow-2xl z-20 shrink-0 flex flex-col animate-in slide-in-from-right duration-200">
            <CurtainControls
              config={currentConfig}
              onChangeConfig={handleConfigChange}
              sceneMode={sceneMode}
              onChangeSceneMode={setSceneMode}
              audioEnabled={audioEnabled}
              onToggleAudio={handleToggleAudio}
              volume={volume}
              onChangeVolume={handleVolumeChange}
              customOverlayUrl={customOverlayUrl}
              onUploadOverlay={handleUploadOverlay}
              onClearOverlay={() => setCustomOverlayUrl(null)}
              customBackgroundUrl={customBackgroundUrl}
              onUploadBackground={handleUploadBackground}
              onClearBackground={() => setCustomBackgroundUrl(null)}
              onResetDefaults={handleResetDefaults}
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
              onUnselectPreset={handleUnselectPreset}
              motionSetting={motionSetting}
              onChangeMotionSetting={setMotionSetting}
              systemPrefersReduced={systemPrefersReduced}
              audioContextState={audioState}
              onTestSound={handleTestSound}
              onTestRipple={handleTestRipple}
              diagnostics={diagnostics}
              onOpenExportModal={() => setShowExportModal(true)}
              onClose={() => setShowControls(false)}
            />
          </aside>
        )}
      </div>

      {/* Export & Copy Code Modal Dialog */}
      <ExportCodeModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        config={currentConfig}
        presetName={activePreset ? activePreset.name : 'Custom Configuration'}
        material={curtainAudio.material}
        volume={volume}
      />
    </div>
  );
}
