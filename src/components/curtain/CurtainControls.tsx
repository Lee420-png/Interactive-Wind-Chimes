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
} from '../../data/curtainPresets';
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
  onOpenExportModal?: () => void;
  onClose?: () => void;
}

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
  onOpenExportModal,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'visuals' | 'physics' | 'gateway' | 'diagnostics'>('presets');
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

      {/* Modern SaaS Segmented Tabs */}
      <div className="px-3 pt-2.5 pb-2 border-b border-white/[0.06] bg-[#0c0c10] shrink-0">
        <div className="grid grid-cols-5 gap-1 p-0.5 bg-[#050508] rounded-lg border border-white/[0.06]">
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
          <button
            type="button"
            onClick={() => setActiveTab('gateway')}
            className={`py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer truncate ${
              activeTab === 'gateway'
                ? 'bg-stone-800 text-amber-300 shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Gateway
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer truncate ${
              activeTab === 'diagnostics'
                ? 'bg-stone-800 text-amber-300 shadow-sm font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Debug
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
                  <span className="text-xs font-medium text-stone-400 italic">
                    Custom Mode (No model locked)
                  </span>
                )}
              </div>

              {activePresetId && (
                <button
                  type="button"
                  onClick={() => {
                    if (onUnselectPreset) onUnselectPreset();
                    setLoadNotice('Unselected active model · Entered Custom Mode');
                    setTimeout(() => setLoadNotice(null), 3000);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
                  title="Unselect active preset and allow free custom edits"
                >
                  <X className="w-3 h-3 text-stone-400" />
                  <span>Unselect</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search models, sound, glyphs..."
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-stone-500 hover:text-stone-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category & Favorite Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-stone-800 text-stone-100 font-semibold border border-white/10'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.04]'
                }`}
              >
                All ({CURTAIN_PRESETS.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('favorites')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'favorites'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/[0.06]'
                }`}
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>Favorites ({favoriteIds.length})</span>
              </button>

              {(['acoustic', 'cyber', 'elemental', 'sacred'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-stone-800 text-stone-100 font-semibold border border-white/10'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Model Cards List */}
            {filteredPresets.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                <Info className="w-5 h-5 text-stone-500 mx-auto mb-2" />
                <p className="text-xs text-stone-400">
                  {selectedCategory === 'favorites'
                    ? 'No favorites starred yet. Click the star ★ on any model to bookmark it.'
                    : 'No models matched your search.'}
                </p>
                {selectedCategory === 'favorites' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="mt-3 text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    View All Models
                  </button>
                )}
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
                      className={`relative w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-amber-500/[0.09] border-amber-500/50 text-stone-100 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-white/[0.02] border-white/[0.07] text-stone-400 hover:text-stone-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Top Row: Color Swatch + Name + Category + Favorite Star */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Visual Swatch Pill */}
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-xs"
                            style={{ backgroundColor: p.effectOnlyConfig.glyphColor }}
                            title={`Color: ${p.effectOnlyConfig.glyphColor}`}
                          />
                          <span
                            className={`text-xs font-bold truncate ${
                              isActive ? 'text-amber-300' : 'text-stone-200'
                            }`}
                          >
                            {p.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Active / Deselect Pill */}
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

                      {/* Specs Row: Sound Material, Strands, Sample Glyphs */}
                      <div className="text-[10px] text-stone-500 font-mono border-t border-white/[0.06] pt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">Sound: {p.material}</span>
                          <span>·</span>
                          <span>{p.effectOnlyConfig.strandCount} cords</span>
                        </div>
                        <span
                          className="text-[11px] tracking-widest text-stone-400 font-mono"
                          title="Sample Glyphs"
                        >
                          {p.effectOnlyConfig.glyphSet.slice(0, 4)}
                        </span>
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
        {/* TAB 2: VISUALS & CHARACTER SETS                          */}
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
        {/* TAB 3: REAL-WORLD PHYSICS PARAMETERS                     */}
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
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: ARCHITECTURAL GATEWAY & ASSET UPLOADS             */}
        {/* ======================================================== */}
        {activeTab === 'gateway' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono">
                Gateway Mode
              </span>
              <button
                type="button"
                onClick={() => onChangeSceneMode(sceneMode === 'entrance' ? 'effect-only' : 'entrance')}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  sceneMode === 'entrance'
                    ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                    : 'bg-white/[0.04] text-stone-400 border-white/[0.08]'
                }`}
              >
                {sceneMode === 'entrance' ? 'Enabled' : 'Click to Enable'}
              </button>
            </div>

            {/* Mask Opening Controls */}
            {config.clipOpening && (
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>Clip Arch Opening</span>
                  <input
                    type="checkbox"
                    checked={config.clipOpening.enabled}
                    onChange={e =>
                      onChangeConfig({
                        ...config,
                        clipOpening: { ...config.clipOpening!, enabled: e.target.checked },
                      })
                    }
                    className="accent-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Archway Width</span>
                    <span className="font-mono tabular-nums text-stone-200">
                      {Math.round(config.clipOpening.width * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={0.9}
                    step={0.02}
                    value={config.clipOpening.width}
                    onChange={e =>
                      onChangeConfig({
                        ...config,
                        clipOpening: { ...config.clipOpening!, width: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Archway Height</span>
                    <span className="font-mono tabular-nums text-stone-200">
                      {Math.round(config.clipOpening.height * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={0.95}
                    step={0.02}
                    value={config.clipOpening.height}
                    onChange={e =>
                      onChangeConfig({
                        ...config,
                        clipOpening: { ...config.clipOpening!, height: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            )}

            {/* Image Uploaders */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
                Custom Scene Assets
              </span>

              {/* Background Scene */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>Background Scene</span>
                  {customBackgroundUrl && (
                    <button
                      type="button"
                      onClick={onClearBackground}
                      className="text-[10px] text-rose-400 hover:text-rose-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-white/20 hover:border-white/40 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs text-stone-400">
                  <Upload className="w-3.5 h-3.5 text-stone-400" />
                  <span>{customBackgroundUrl ? 'Change Background' : 'Upload Background Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        onUploadBackground(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Foreground Overlay */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span>Doorway Frame Overlay</span>
                  {customOverlayUrl && (
                    <button
                      type="button"
                      onClick={onClearOverlay}
                      className="text-[10px] text-rose-400 hover:text-rose-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-white/20 hover:border-white/40 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs text-stone-400">
                  <Upload className="w-3.5 h-3.5 text-stone-400" />
                  <span>{customOverlayUrl ? 'Change Frame' : 'Upload PNG Doorway Frame'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        onUploadOverlay(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: DIAGNOSTICS & TELEMETRY                           */}
        {/* ======================================================== */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono block">
              System Telemetry
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-stone-500 block">AudioContext</span>
                <span className={`font-bold ${audioContextState === 'running' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {audioContextState}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-stone-500 block">Affected Cords</span>
                <span className="text-stone-200 font-bold">{diagnostics.affectedStrands}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-stone-500 block">Cursor X/Y</span>
                <span className="text-stone-200">
                  {Math.round(diagnostics.pointerX)}, {Math.round(diagnostics.pointerY)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-stone-500 block">Hit Target</span>
                <span className={diagnostics.isInside ? 'text-emerald-400' : 'text-stone-500'}>
                  {diagnostics.isInside ? 'Inside Canvas' : 'Outside'}
                </span>
              </div>
            </div>

            {/* Quick Test Triggers */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
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
