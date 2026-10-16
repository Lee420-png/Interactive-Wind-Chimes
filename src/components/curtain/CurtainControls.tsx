/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  GlyphCurtainConfig,
  SceneMode,
} from '../../types/curtain';
import {
  CURTAIN_PRESETS,
  CurtainPreset,
  PresetCategory,
  CurtainMaterial,
} from '../../data/curtainPresets';
import {
  ChimeScaleId,
  CHIME_SCALES,
  ReverbSpace,
  OctaveRegister,
  curtainAudio,
} from './curtainAudio';
import {
  Sliders,
  Volume2,
  VolumeX,
  Upload,
  RotateCcw,
  Play,
  Waves,
  PanelRightClose,
  Code2,
  Check,
  Star,
  Search,
  X,
  Sparkles,
  Info,
  Music,
  Radio,
  Disc,
} from 'lucide-react';

export interface CurtainControlsProps {
  config: GlyphCurtainConfig;
  onChangeConfig: (newConfig: GlyphCurtainConfig) => void;
  sceneMode: SceneMode;
  onChangeSceneMode: (newMode: SceneMode) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  customOverlayUrl: string | null;
  onUploadOverlay: (file: File) => void;
  onClearOverlay: () => void;
  customBackgroundUrl: string | null;
  onUploadBackground: (file: File) => void;
  onClearBackground: () => void;
  onResetDefaults: () => void;
  activePresetId: string | null;
  onSelectPreset: (preset: CurtainPreset) => void;
  onUnselectPreset?: () => void;
  motionSetting: 'system' | 'full' | 'reduced';
  onChangeMotionSetting: (mode: 'system' | 'full' | 'reduced') => void;
  systemPrefersReduced: boolean;
  audioContextState: AudioContextState | 'uninitialized';
  onTestSound: () => void;
  onTestRipple: () => void;
  diagnostics: {
    pointerX: number;
    pointerY: number;
    isInside: boolean;
    affectedStrands: number;
  };
  // Dedicated Sound System Props
  soundMaterial: CurtainMaterial;
  onChangeSoundMaterial: (mat: CurtainMaterial) => void;
  soundScale: ChimeScaleId;
  onChangeSoundScale: (scale: ChimeScaleId) => void;
  soundOctave: OctaveRegister;
  onChangeSoundOctave: (oct: OctaveRegister) => void;
  soundReverb: ReverbSpace;
  onChangeSoundReverb: (rev: ReverbSpace) => void;
  onStrumScale: () => void;
  onPreviewPresetSound?: (preset: CurtainPreset) => void;
  onOpenExportModal?: () => void;
  onClose?: () => void;
}

const MATERIAL_OPTIONS: {
  id: CurtainMaterial;
  emoji: string;
  name: string;
  badge: string;
  subtitle: string;
  color: string;
}[] = [
  {
    id: 'furin',
    emoji: '🎐',
    name: 'Edo Fūrin',
    badge: '3.8s Glass Bell',
    subtitle: 'High-frequency porcelain wind bell with sparkling breeze flutter',
    color: '#f43f5e',
  },
  {
    id: 'bamboo',
    emoji: '🎋',
    name: 'Kyoto Bamboo',
    badge: '1.1s Hollow Wood',
    subtitle: 'Warm organic hollow wood knocks with earthy Helmholtz resonance',
    color: '#d97706',
  },
  {
    id: 'bronze',
    emoji: '🔔',
    name: 'Temple Bronze',
    badge: '6.8s Gong Sustain',
    subtitle: 'Deep Tibetan temple gong with rich singing undertones & sub-bass',
    color: '#f59e0b',
  },
  {
    id: 'bowl',
    emoji: '🥣',
    name: 'Singing Bowl',
    badge: '7.8s Sacred Drone',
    subtitle: 'Himalayan singing bowl with meditative binaural acoustic beating',
    color: '#14b8a6',
  },
  {
    id: 'crystal',
    emoji: '💎',
    name: 'Crystal Koshi',
    badge: '5.0s Crystalline',
    subtitle: 'Pyrenean crystal rods with pure Koshi harmonic series',
    color: '#38bdf8',
  },
  {
    id: 'silver',
    emoji: '✨',
    name: 'Frost Silver',
    badge: '5.4s Aluminum',
    subtitle: 'Extruded aluminum tubular chime with crisp singing overtone',
    color: '#e879f9',
  },
  {
    id: 'stone',
    emoji: '🪨',
    name: 'River Stone',
    badge: '0.5s Lithophone',
    subtitle: 'Carved obsidian lithophone with dry tactile organic mineral clacks',
    color: '#a8a29e',
  },
  {
    id: 'harp',
    emoji: '🪕',
    name: 'Aeolian Harp',
    badge: '4.8s Wind Strings',
    subtitle: 'Open-air wind harp with rich string harmonics & plucked attack',
    color: '#818cf8',
  },
];

const REVERB_OPTIONS: { id: ReverbSpace; name: string; desc: string }[] = [
  { id: 'temple', name: 'Mountain Temple', desc: '4.8s deep cathedral decay' },
  { id: 'veranda', name: 'Covered Veranda', desc: '2.4s warm wood reflections' },
  { id: 'garden', name: 'Open Zen Garden', desc: '1.5s crisp open-air clarity' },
  { id: 'cathedral', name: 'Cosmic Cathedral', desc: '6.0s monumental shimmering tail' },
];

export const CurtainControls: React.FC<CurtainControlsProps> = ({
  config,
  onChangeConfig,
  sceneMode,
  onChangeSceneMode,
  audioEnabled,
  onToggleAudio,
  volume,
  onChangeVolume,
  customOverlayUrl,
  onUploadOverlay,
  onClearOverlay,
  customBackgroundUrl,
  onUploadBackground,
  onClearBackground,
  onResetDefaults,
  activePresetId,
  onSelectPreset,
  onUnselectPreset,
  motionSetting,
  onChangeMotionSetting,
  systemPrefersReduced,
  audioContextState,
  onTestSound,
  onTestRipple,
  diagnostics,
  soundMaterial,
  onChangeSoundMaterial,
  soundScale,
  onChangeSoundScale,
  soundOctave,
  onChangeSoundOctave,
  soundReverb,
  onChangeSoundReverb,
  onStrumScale,
  onPreviewPresetSound,
  onOpenExportModal,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'sound' | 'visuals' | 'physics'>('presets');
  const [customText, setCustomText] = useState<string>(config.glyphSet);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'favorites'>('all');
  const [loadNotice, setLoadNotice] = useState<string | null>(null);

  // Persistent Favorites (localStorage)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('resonant_curtain_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return ['edo-furin', 'koshi-crystal', 'cyber-matrix'];
  });

  const handleToggleFavorite = (presetId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavoriteIds(prev => {
      const next = prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId];
      try {
        localStorage.setItem('resonant_curtain_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Sync custom text field with active config
  useEffect(() => {
    setCustomText(config.glyphSet);
  }, [config.glyphSet]);

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onChangeConfig({
      ...config,
      glyphSet: text.length > 0 ? text : '✦',
    });
  };

  const activePreset = useMemo(() => {
    if (!activePresetId) return null;
    return CURTAIN_PRESETS.find(p => p.id === activePresetId) || null;
  }, [activePresetId]);

  // Filtered presets based on search query and category/favorite tab
  const filteredPresets = useMemo(() => {
    let list = CURTAIN_PRESETS;
    if (selectedCategory === 'favorites') {
      list = list.filter(p => favoriteIds.includes(p.id));
    } else if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.audioDescription.toLowerCase().includes(q) ||
          p.effectOnlyConfig.glyphSet.includes(q)
      );
    }
    return list;
  }, [selectedCategory, favoriteIds, searchQuery]);

  const handlePresetClick = (preset: CurtainPreset) => {
    if (activePresetId === preset.id) {
      // Toggle unselect
      if (onUnselectPreset) {
        onUnselectPreset();
      } else {
        onSelectPreset(preset);
      }
      setLoadNotice(`Unselected ${preset.name} · Entered Custom Mode`);
      setTimeout(() => setLoadNotice(null), 3000);
      return;
    }
    onSelectPreset(preset);
    setLoadNotice(`✓ Loaded all visuals & physics for ${preset.name}`);
    setTimeout(() => setLoadNotice(null), 3000);
  };

  const QUICK_PALETTES = [
    { label: 'Vermilion', color: '#e11d48' },
    { label: 'Cyber Emerald', color: '#10b981' },
    { label: 'Polar Cyan', color: '#06b6d4' },
    { label: 'Temple Bronze', color: '#d97706' },
    { label: 'Molten Gold', color: '#f59e0b' },
    { label: 'Neon Magenta', color: '#ec4899' },
    { label: 'River Stone', color: '#a8a29e' },
    { label: 'Ghost White', color: '#f5f5f4' },
  ];

  const QUICK_GLYPH_SETS = [
    { label: 'Hiragana', chars: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん' },
    { label: 'Zen Kanji', chars: '靜思風涼清夏空流月光響響竹波水鈴香雲影心無道' },
    { label: 'Matrix Code', chars: 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789' },
    { label: 'Celestial', chars: '✦✧❖⬡◈◇⊛⊕⊗⨁⊙⊚⋇⋈⋉⋊⌖⌗⌾⍟⎈⎇⏣⏥' },
    { label: 'Nordic Runes', chars: 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛈᛇᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ' },
    { label: 'Alchemical', chars: '🜂🜄🜁🜃🜔🜕🜖🝡🝢☉☽☿♀♂♃♄☼✦☥' },
  ];

  const currentScaleDef = CHIME_SCALES[soundScale] || CHIME_SCALES.akebono;

  return (
    <div className="w-full h-full flex flex-col bg-[#09090c] text-stone-200 border-stone-800/80 overflow-hidden select-none">
      {/* Studio Inspector Header (SaaS Modern Toolbar) */}
      <div className="px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0e0e12]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-xs font-bold tracking-wider uppercase text-stone-200 font-mono shrink-0">
            Inspector
          </span>
          <span className="text-[10px] text-stone-500 font-mono truncate">
            · {activePreset ? activePreset.name : 'Custom Mode'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Reset Defaults */}
          <button
            type="button"
            onClick={onResetDefaults}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Reset to default tuning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Explicit Collapse Sidebar Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer shadow-xs"
              title="Collapse Inspector (Hide Sidebar)"
            >
              <PanelRightClose className="w-3.5 h-3.5 text-amber-400" />
              <span>Collapse</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern SaaS Segmented Tabs (4 TABS including SOUND) */}
      <div className="px-3 pt-2.5 pb-2 border-b border-white/[0.06] bg-[#0c0c10] shrink-0">
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#050508] rounded-lg border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer truncate ${
              activeTab === 'presets'
                ? 'bg-stone-800 text-amber-300 shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Models ({CURTAIN_PRESETS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sound')}
            className={`py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
              activeTab === 'sound'
                ? 'bg-stone-800 text-amber-300 shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Sound</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visuals')}
            className={`py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer truncate ${
              activeTab === 'visuals'
                ? 'bg-stone-800 text-amber-300 shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Visuals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('physics')}
            className={`py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer truncate ${
              activeTab === 'physics'
                ? 'bg-stone-800 text-amber-300 shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Physics
          </button>
        </div>
      </div>

      {/* Real-time Load Notice Toast */}
      {loadNotice && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <span className="truncate">{loadNotice}</span>
          <button
            type="button"
            onClick={() => setLoadNotice(null)}
            className="text-amber-400/70 hover:text-amber-300 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Scrollable Inspector Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-4">
        {/* ======================================================== */}
        {/* TAB 1: PRE-MADE MODELS & FAVORITES                       */}
        {/* ======================================================== */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            {/* Active Preset Status & Explicit Unselect Button */}
            <div className="p-2.5 rounded-xl border bg-white/[0.02] border-white/[0.08] flex items-center justify-between">
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                  Status:
                </span>
                {activePreset ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-300 truncate">
                      {activePreset.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-xs font-medium text-amber-300">
                      Custom Mode (Unconstrained)
                    </span>
                  </div>
                )}
              </div>

              {activePreset && (
                <button
                  type="button"
                  onClick={() => {
                    if (onUnselectPreset) onUnselectPreset();
                    setLoadNotice('Switched to Custom Mode');
                    setTimeout(() => setLoadNotice(null), 3000);
                  }}
                  className="px-2 py-1 text-[11px] font-medium text-stone-400 hover:text-stone-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
                  title="Unselect active preset and allow free custom edits"
                >
                  Unselect
                </button>
              )}
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search models, sound, glyphs..."
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-400/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'favorites', label: `★ Favorites (${favoriteIds.length})` },
                  { id: 'acoustic', label: 'Acoustic' },
                  { id: 'elemental', label: 'Elemental' },
                  { id: 'sacred', label: 'Sacred' },
                  { id: 'cyber', label: 'Cyber' },
                ] as const
              ).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-semibold'
                      : 'bg-white/[0.03] text-stone-400 hover:text-stone-200 border border-white/[0.06]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Presets List */}
            {filteredPresets.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                No matching models found.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPresets.map(p => {
                  const isActive = activePresetId === p.id;
                  const isFavorited = favoriteIds.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handlePresetClick(p)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer group relative ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-950/40 via-stone-900/90 to-stone-900 border-amber-400/60 shadow-lg ring-1 ring-amber-400/30'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {/* Card Header: Color chip + Name + Star */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/20"
                            style={{ backgroundColor: p.effectOnlyConfig.glyphColor }}
                          />
                          <span
                            className={`text-xs font-semibold truncate ${
                              isActive ? 'text-amber-200' : 'text-stone-200 group-hover:text-white'
                            }`}
                          >
                            {p.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive ? (
                            <span
                              className="text-[9px] font-mono font-semibold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30"
                              title="Active Model (Click again to deselect)"
                            >
                              Active ✓
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-stone-500 capitalize bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {p.category}
                            </span>
                          )}

                          {/* Star Favorite Button */}
                          <button
                            type="button"
                            onClick={e => handleToggleFavorite(p.id, e)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isFavorited
                                ? 'text-amber-400 hover:text-amber-300'
                                : 'text-stone-600 hover:text-amber-400/80 group-hover:text-stone-400'
                            }`}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites ★'}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                isFavorited ? 'fill-amber-400 stroke-amber-400' : 'stroke-current'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Tagline */}
                      <p className="text-[11px] text-stone-400 leading-relaxed mb-2 line-clamp-2">
                        {p.tagline}
                      </p>

                      {/* Specs Row: Sound Material, Strands, Sample Glyphs + HEAR SOUND Button */}
                      <div className="text-[10px] text-stone-500 font-mono border-t border-white/[0.06] pt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-amber-300/90 font-medium">
                            {p.material === 'furin' && '🎐 '}
                            {p.material === 'bamboo' && '🎋 '}
                            {p.material === 'bronze' && '🔔 '}
                            {p.material === 'bowl' && '🥣 '}
                            {p.material === 'crystal' && '💎 '}
                            {p.material === 'silver' && '✨ '}
                            {p.material === 'stone' && '🪨 '}
                            {p.material === 'harp' && '🪕 '}
                            {p.material}
                          </span>
                          <span>·</span>
                          <span>{p.effectOnlyConfig.strandCount} cords</span>
                        </div>

                        {/* Direct Sound Preview Button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (onPreviewPresetSound) {
                              onPreviewPresetSound(p);
                            } else {
                              onSelectPreset(p);
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] hover:bg-amber-400/20 text-stone-300 hover:text-amber-300 border border-white/[0.08] transition-all cursor-pointer"
                          title="Preview authentic chime sound for this selection"
                        >
                          <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                          <span>Preview Sound</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions (Test Chime & Test Ripple) */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Acoustic Impulse
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onTestSound}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 border border-white/[0.08] transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>Strike Note</span>
                </button>
                <button
                  type="button"
                  onClick={onTestRipple}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 border border-white/[0.08] transition-all cursor-pointer"
                >
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                  <span>Wave Ripple</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DEDICATED SOUND & MATERIAL CUSTOMIZER             */}
        {/* ======================================================== */}
        {activeTab === 'sound' && (
          <div className="space-y-4">
            {/* Master Audio Card */}
            <div className="p-3 rounded-xl border bg-gradient-to-b from-[#14141c] to-[#0e0e14] border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      audioEnabled && audioContextState === 'running'
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-stone-600'
                    }`}
                  />
                  <span className="text-xs font-bold font-mono tracking-wider text-stone-200">
                    Acoustic Engine
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleAudio}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    audioEnabled
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                      : 'bg-white/[0.04] border-white/10 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {audioEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  <span>{audioEnabled ? 'Active' : 'Enable'}</span>
                </button>
              </div>

              {/* Master Volume */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-stone-400 font-mono">
                  <span>Output Volume</span>
                  <span className="text-amber-300 font-semibold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={volume}
                  onChange={e => onChangeVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Strum & Test Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onStrumScale}
                  className="py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Strum Chimes</span>
                </button>
                <button
                  type="button"
                  onClick={onTestSound}
                  className="py-1.5 px-2.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 border border-white/[0.08] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-stone-300" />
                  <span>Strike Note</span>
                </button>
              </div>
            </div>

            {/* Chime Material Selector (8 Distinct Physical Materials) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono">
                  Physical Sound Material
                </span>
                <span className="text-[10px] font-mono text-amber-300/80 capitalize">
                  Current: {soundMaterial}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {MATERIAL_OPTIONS.map(mat => {
                  const isSelected = soundMaterial === mat.id;
                  return (
                    <div
                      key={mat.id}
                      onClick={() => onChangeSoundMaterial(mat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{mat.emoji}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-amber-400/20 text-amber-300 font-semibold'
                              : 'bg-white/[0.04] text-stone-500'
                          }`}
                        >
                          {mat.badge}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-stone-200 group-hover:text-white truncate">
                        {mat.name}
                      </div>
                      <div className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed mt-0.5">
                        {mat.subtitle}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cultural Tuning Scale Selector (8 Scales) */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono">
                  Harmonic Tuning Scale
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  {currentScaleDef.origin}
                </span>
              </div>

              <div className="space-y-1.5">
                {(Object.keys(CHIME_SCALES) as ChimeScaleId[]).map(scaleKey => {
                  const s = CHIME_SCALES[scaleKey];
                  const isSelected = soundScale === scaleKey;
                  return (
                    <div
                      key={scaleKey}
                      onClick={() => onChangeSoundScale(scaleKey)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400/60 text-amber-200'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] text-stone-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-medium truncate flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                          <span>{s.name}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {s.description}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-stone-500 uppercase shrink-0">
                        {s.notes.length} notes
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Octave & Pitch Register */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Octave & Register
              </span>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/40 rounded-lg border border-white/10 text-xs">
                {(
                  [
                    { id: 'deep', label: 'Deep (-1 Oct)' },
                    { id: 'standard', label: 'Concert Pitch' },
                    { id: 'celestial', label: 'Celestial (+1)' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeSoundOctave(item.id)}
                    className={`py-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      soundOctave === item.id
                        ? 'bg-stone-800 text-amber-300 font-semibold shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Acoustic Space (Reverb Environment) */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Acoustic Space (Convolver Reverb)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {REVERB_OPTIONS.map(rev => (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => onChangeSoundReverb(rev.id)}
                    className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      soundReverb === rev.id
                        ? 'bg-stone-800 border-amber-400/60 text-amber-300'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{rev.name}</div>
                    <div className="text-[10px] text-stone-500 font-mono">{rev.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Note Strip (Direct Play) */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Interactive Chime Note Keys
              </span>
              <p className="text-[10px] text-stone-500 font-mono">
                Click any chime key below to play individual notes with the active material:
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1">
                {currentScaleDef.notes.slice(0, 10).map((freq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      curtainAudio.enable().then(() => {
                        curtainAudio.playNoteIndex(idx, 0.85);
                      });
                    }}
                    className="py-2 text-[10px] font-mono font-medium rounded bg-white/[0.04] hover:bg-amber-400/20 hover:text-amber-300 text-stone-300 border border-white/[0.08] transition-colors cursor-pointer text-center"
                    title={`Strike ${Math.round(freq)} Hz`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: VISUALS & CHARACTER SETS                          */}
        {/* ======================================================== */}
        {activeTab === 'visuals' && (
          <div className="space-y-4">
            {/* Glyph Color */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Glyph Color
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.glyphColor.startsWith('#') ? config.glyphColor : '#e11d48'}
                  onChange={e => onChangeConfig({ ...config, glyphColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={config.glyphColor}
                  onChange={e => onChangeConfig({ ...config, glyphColor: e.target.value })}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-200"
                />
              </div>

              {/* Quick Swatches */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {QUICK_PALETTES.map(p => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, glyphColor: p.color })}
                    className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-110 cursor-pointer relative"
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  >
                    {config.glyphColor.toLowerCase() === p.color.toLowerCase() && (
                      <Check className="w-3 h-3 text-white absolute inset-0 m-auto stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Character Set */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Character Glyphs
              </span>
              <textarea
                value={customText}
                onChange={e => handleCustomTextChange(e.target.value)}
                placeholder="Enter custom characters..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-stone-200 leading-relaxed resize-none focus:outline-none focus:border-amber-400/50"
              />

              {/* 1-Click Glyph Presets */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {QUICK_GLYPH_SETS.map(set => (
                  <button
                    key={set.label}
                    type="button"
                    onClick={() => handleCustomTextChange(set.chars)}
                    className="py-1 px-2 text-[10px] font-medium rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-stone-300 border border-white/[0.06] transition-colors truncate text-left"
                  >
                    {set.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Density & Dimensions */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Density &amp; Scale
              </span>

              {/* Strand Count */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Strand Count</span>
                  <span className="font-mono tabular-nums text-stone-200">{config.strandCount}</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={75}
                  value={config.strandCount}
                  onChange={e => onChangeConfig({ ...config, strandCount: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Glyphs per Strand */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Glyphs per Cord</span>
                  <span className="font-mono tabular-nums text-stone-200">{config.glyphsPerStrand}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={50}
                  value={config.glyphsPerStrand}
                  onChange={e => onChangeConfig({ ...config, glyphsPerStrand: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Font Size</span>
                  <span className="font-mono tabular-nums text-stone-200">{config.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={22}
                  value={config.fontSize}
                  onChange={e => onChangeConfig({ ...config, fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Length Jitter */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Bottom Length Jitter</span>
                  <span className="font-mono tabular-nums text-stone-200">
                    {Math.round((config.lengthJitter || 0.08) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.25}
                  step={0.01}
                  value={config.lengthJitter || 0.08}
                  onChange={e => onChangeConfig({ ...config, lengthJitter: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: REAL-WORLD PHYSICS PARAMETERS                     */}
        {/* ======================================================== */}
        {activeTab === 'physics' && (
          <div className="space-y-4">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
              Simulation Forces
            </span>

            {/* Interaction Radius */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Repulsion Radius</span>
                <span className="font-mono tabular-nums text-stone-200">{config.interactionRadius || 88}px</span>
              </div>
              <input
                type="range"
                min={45}
                max={160}
                value={config.interactionRadius || 88}
                onChange={e => onChangeConfig({ ...config, interactionRadius: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Interaction Force */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Push Displacement Force</span>
                <span className="font-mono tabular-nums text-stone-200">{(config.interactionStrength || 1.0).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.5}
                step={0.05}
                value={config.interactionStrength || 1.0}
                onChange={e => onChangeConfig({ ...config, interactionStrength: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Gravity (Restoring Tension) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Tension / Gravity</span>
                <span className="font-mono tabular-nums text-stone-200">{config.gravity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.0}
                step={0.05}
                value={config.gravity}
                onChange={e => onChangeConfig({ ...config, gravity: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Damping (Fluid Sway) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Fluid Sway (Damping)</span>
                <span className="font-mono tabular-nums text-stone-200">{(config.damping * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0.92}
                max={0.99}
                step={0.002}
                value={config.damping}
                onChange={e => onChangeConfig({ ...config, damping: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Ambient Breeze */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Ambient Wind Breeze</span>
                <span className="font-mono tabular-nums text-stone-200">{Math.round(config.breezeStrength * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.02}
                value={config.breezeStrength}
                onChange={e => onChangeConfig({ ...config, breezeStrength: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Motion Preference Override */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Motion Accessibility
              </span>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/40 rounded-lg border border-white/10 text-xs">
                {(['system', 'full', 'reduced'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeMotionSetting(mode)}
                    className={`py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                      motionSetting === mode
                        ? 'bg-stone-800 text-stone-100 font-semibold shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-stone-500 font-mono block">
                System state: {systemPrefersReduced ? 'Reduced Motion Active' : 'Standard Motion'}
              </span>
            </div>

            {/* Quick Test Triggers */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Verification Impulses
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onTestSound}
                  className="py-2 px-3 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 border border-white/[0.08] transition-colors cursor-pointer"
                >
                  Test Audio Strike
                </button>
                <button
                  type="button"
                  onClick={onTestRipple}
                  className="py-2 px-3 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 border border-white/[0.08] transition-colors cursor-pointer"
                >
                  Test Wave Ripple
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Bottom Action */}
      {onOpenExportModal && (
        <div className="p-3 border-t border-white/[0.08] bg-[#0c0c10] shrink-0">
          <button
            type="button"
            onClick={onOpenExportModal}
            className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Copy Embed Code</span>
          </button>
        </div>
      )}
    </div>
  );
};
