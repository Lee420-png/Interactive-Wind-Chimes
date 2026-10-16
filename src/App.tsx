/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { GlyphCurtainConfig, SceneMode } from './types/curtain';
import {
  CURTAIN_PRESETS,
  CurtainPreset,
  CurtainMaterial,
} from './data/curtainPresets';
import {
  InteractiveGlyphCurtain,
  InteractiveGlyphCurtainHandle,
} from './components/curtain/InteractiveGlyphCurtain';
import { CurtainControls } from './components/curtain/CurtainControls';
import { ExportCodeModal } from './components/curtain/ExportCodeModal';
import {
  curtainAudio,
  ChimeScaleId,
  CHIME_SCALES,
  DEFAULT_MATERIAL_SCALES,
  ReverbSpace,
  OctaveRegister,
} from './components/curtain/curtainAudio';
import {
  Volume2,
  VolumeX,
  Sliders,
  Code2,
  Eye,
  EyeOff,
  Music,
} from 'lucide-react';

export default function App() {
  const [sceneMode, setSceneMode] = useState<SceneMode>('effect-only');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [audioState, setAudioState] = useState<AudioContextState | 'uninitialized'>('uninitialized');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showCanvasInfo, setShowCanvasInfo] = useState<boolean>(true);

  // Dedicated Sound State (Material, Scale, Octave, Reverb)
  const [soundMaterial, setSoundMaterial] = useState<CurtainMaterial>('furin');
  const [soundScale, setSoundScale] = useState<ChimeScaleId>('akebono');
  const [soundOctave, setSoundOctave] = useState<OctaveRegister>('standard');
  const [soundReverb, setSoundReverb] = useState<ReverbSpace>('temple');

  // Initialize default sound configuration on mount
  useEffect(() => {
    curtainAudio.setMaterial('furin', false);
    curtainAudio.setScale('akebono');
  }, []);

  // Inspector Panel Resizing (hold and drag left border to change width)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resonant_inspector_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 280 && val <= 640) return val;
      }
    }
    return 384;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(640, window.innerWidth - e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('resonant_inspector_width', sidebarWidth.toString());
      } catch {}
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

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
    const newColor =
      canvasTheme === 'dark'
        ? preset.effectOnlyConfig.glyphColor === '#1c1917'
          ? '#e11d48'
          : preset.effectOnlyConfig.glyphColor
        : preset.effectOnlyConfig.glyphColor;

    setEffectConfig({
      ...preset.effectOnlyConfig,
      glyphColor: newColor,
    });
    setEntranceConfig(preset.entranceConfig);

    // Automatically apply signature material and tuned scale
    const targetScale = preset.scale || DEFAULT_MATERIAL_SCALES[preset.material] || 'akebono';
    curtainAudio.setMaterial(preset.material, false);
    curtainAudio.setScale(targetScale);
    setSoundMaterial(preset.material);
    setSoundScale(targetScale);

    if (audioEnabled) {
      curtainAudio.strumScale(0.7);
    }
  };

  const handlePreviewPresetSound = async (preset: CurtainPreset) => {
    await curtainAudio.enable();
    setAudioEnabled(true);
    setAudioState(curtainAudio.getContextState());

    curtainAudio.setMaterial(preset.material, false);
    curtainAudio.setScale(preset.scale || DEFAULT_MATERIAL_SCALES[preset.material] || 'akebono');
    await curtainAudio.strumScale(0.85);

    // If preset is not the actively selected one, restore active sound settings
    if (activePresetId !== preset.id) {
      setTimeout(() => {
        curtainAudio.setMaterial(soundMaterial, false);
        curtainAudio.setScale(soundScale);
      }, 750);
    }
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

  const handleStrumScale = async () => {
    await curtainAudio.enable();
    setAudioEnabled(true);
    setAudioState(curtainAudio.getContextState());
    curtainAudio.strumScale(0.85);
  };

  const handleSoundMaterialChange = (mat: CurtainMaterial) => {
    setSoundMaterial(mat);
    curtainAudio.setMaterial(mat, true);
    setSoundScale(curtainAudio.scaleId);
    if (audioEnabled) {
      curtainAudio.playTestChime();
    }
  };

  const handleSoundScaleChange = (scale: ChimeScaleId) => {
    setSoundScale(scale);
    curtainAudio.setScale(scale);
    if (audioEnabled) {
      curtainAudio.strumScale(0.75);
    }
  };

  const handleSoundOctaveChange = (oct: OctaveRegister) => {
    setSoundOctave(oct);
    curtainAudio.setOctave(oct);
    if (audioEnabled) {
      curtainAudio.playTestChime();
    }
  };

  const handleSoundReverbChange = (rev: ReverbSpace) => {
    setSoundReverb(rev);
    curtainAudio.setReverbSpace(rev);
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

  const handleToggleCanvasTheme = (theme: 'dark' | 'paper') => {
    setCanvasTheme(theme);
    if (theme === 'paper') {
      if (effectConfig.glyphColor === '#e11d48' || effectConfig.glyphColor === '#f43f5e') {
        setEffectConfig({ ...effectConfig, glyphColor: '#1c1917' });
      }
    } else {
      if (effectConfig.glyphColor === '#1c1917') {
        setEffectConfig({ ...effectConfig, glyphColor: '#e11d48' });
      }
    }
  };

  const isSoundActive = audioEnabled && audioState === 'running';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050507] text-stone-100 font-sans antialiased selection:bg-amber-500/30">
      {/* Studio Top Control Bar */}
      <header className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0 bg-[#0c0c10] select-none z-30 shadow-sm">
        {/* Zone 1: Brand & Current Workspace */}
        <div className="flex items-center gap-3">
          <span className="font-serif tracking-widest text-sm font-bold text-stone-100 uppercase">
            Resonant Curtain
          </span>
          <span className="text-[11px] font-mono text-stone-500 hidden sm:inline">
            Physical Audio-Visual Matrix
          </span>
        </div>

        {/* Zone 2: Primary Studio Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Sound Strum */}
          <button
            type="button"
            onClick={handleStrumScale}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
            title="Strum chime scale"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Strum Chimes</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 border border-white/15 transition-all cursor-pointer shadow-xs"
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

      {/* Main Studio Workspace: Full-Height Canvas Stage + Collapsible Resizable Right Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* The Hero Stage (Full Height / Width Interactive Canvas) */}
        <main
          className={`flex-1 relative overflow-hidden transition-colors duration-500 ${
            canvasTheme === 'paper' ? 'bg-[#f4efe6]' : 'bg-[#050507]'
          }`}
        >
          {/* Subtle Studio Canvas Grid & Vignette */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
              canvasTheme === 'paper'
                ? 'opacity-30 bg-[radial-gradient(#a8a29e_1px,transparent_1px)] [background-size:24px_24px]'
                : 'opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]'
            }`}
          />

          {/* Top subtle vignette bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-10 pointer-events-none z-10 transition-colors ${
              canvasTheme === 'paper'
                ? 'bg-gradient-to-b from-[#e5dfd3]/80 to-transparent'
                : 'bg-gradient-to-b from-[#050507]/90 to-transparent'
            }`}
          />

          {/* Interactive Glyph Curtain Canvas */}
          <div className="w-full h-full relative">
            <InteractiveGlyphCurtain
              ref={curtainRef}
              config={currentConfig}
              audioEnabled={isSoundActive}
              reducedMotion={isReducedMotion}
              onDiagnosticsUpdate={setDiagnostics}
              className="w-full h-full"
            />

            {/* Quick Canvas Controls (Theme & HUD toggle) in Canvas Top-Right */}
            <div className="absolute top-3 right-4 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg">
              {/* Dark Theme Button */}
              <button
                type="button"
                onClick={() => handleToggleCanvasTheme('dark')}
                className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
                  canvasTheme === 'dark'
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Dark Stage Theme"
              >
                <span>Dark</span>
              </button>

              {/* Paper Theme Button */}
              <button
                type="button"
                onClick={() => handleToggleCanvasTheme('paper')}
                className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
                  canvasTheme === 'paper'
                    ? 'bg-amber-100 text-stone-900 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Japanese Gallery Paper Theme"
              >
                <span>Paper</span>
              </button>

              <div className="w-px h-3.5 bg-white/10 mx-0.5" />

              {/* HUD / Zen Mode Toggle */}
              <button
                type="button"
                onClick={() => setShowCanvasInfo(prev => !prev)}
                className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
                  showCanvasInfo
                    ? 'text-amber-300 hover:text-amber-200'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={showCanvasInfo ? 'Hide canvas info (Zen mode)' : 'Show canvas info (HUD)'}
              >
                {showCanvasInfo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span className="hidden sm:inline">{showCanvasInfo ? 'HUD' : 'Zen'}</span>
              </button>
            </div>

            {/* Clean Unboxed Metadata in Canvas Bottom-Left */}
            {showCanvasInfo && (
              <div
                className={`absolute bottom-4 left-6 pointer-events-none text-xs font-mono tracking-wide flex items-center gap-2 flex-wrap ${
                  canvasTheme === 'dark' ? 'text-stone-400' : 'text-stone-600'
                }`}
              >
                <span className={canvasTheme === 'dark' ? 'text-stone-200 font-semibold' : 'text-stone-900 font-semibold'}>
                  {activePreset ? activePreset.name : 'Custom Configuration'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{effectConfig.strandCount} Strands</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-medium">
                  {CHIME_SCALES[soundScale]?.name || 'Akebono Scale'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="capitalize text-amber-300 font-medium">
                  {soundMaterial} Chime
                </span>
              </div>
            )}

            {/* Unobtrusive Interaction Hint in Canvas Bottom-Right */}
            {showCanvasInfo && (
              <div
                className={`absolute bottom-4 right-6 pointer-events-none hidden sm:flex items-center gap-3 text-xs font-mono ${
                  canvasTheme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                <span>Hover / drag to part cords</span>
                <span aria-hidden="true">·</span>
                <span>Space to ripple</span>
              </div>
            )}
          </div>
        </main>

        {/* The Studio Inspector Panel (Collapsible & Draggable Resizable Sidebar) */}
        {showControls && (
          <aside
            style={{ width: `${sidebarWidth}px` }}
            className="relative h-full border-l border-white/[0.08] shadow-2xl z-20 shrink-0 flex flex-col bg-[#09090c] animate-in slide-in-from-right duration-200"
          >
            {/* Draggable Left Resize Handle (Hold and drag to change size) */}
            <div
              onMouseDown={e => {
                e.preventDefault();
                setIsResizing(true);
              }}
              className={`absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize z-30 group transition-colors flex items-center justify-center ${
                isResizing ? 'bg-amber-400/40' : 'hover:bg-amber-400/20'
              }`}
              title="Drag to resize Inspector panel width"
            >
              <div
                className={`w-0.5 h-10 rounded-full transition-colors ${
                  isResizing ? 'bg-amber-400' : 'bg-white/20 group-hover:bg-amber-400/70'
                }`}
              />
            </div>

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
              soundMaterial={soundMaterial}
              onChangeSoundMaterial={handleSoundMaterialChange}
              soundScale={soundScale}
              onChangeSoundScale={handleSoundScaleChange}
              soundOctave={soundOctave}
              onChangeSoundOctave={handleSoundOctaveChange}
              soundReverb={soundReverb}
              onChangeSoundReverb={handleSoundReverbChange}
              onStrumScale={handleStrumScale}
              onPreviewPresetSound={handlePreviewPresetSound}
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
        material={soundMaterial}
        volume={volume}
      />
    </div>
  );
}
