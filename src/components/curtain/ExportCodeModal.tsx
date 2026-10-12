/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Code2,
  FileCode,
  FileJson,
  Sparkles,
  Volume2,
  Bot,
  Layers,
} from 'lucide-react';
import { GlyphCurtainConfig } from '../../types/curtain';
import { CurtainMaterial } from '../../data/curtainPresets';
import {
  generateStandaloneAppTsxCode,
  generateVanillaHtmlCode,
  generateStandaloneReactCode,
  generateConfigJson,
} from '../../utils/curtainExport';

export interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GlyphCurtainConfig;
  presetName: string;
  material: CurtainMaterial;
  volume: number;
}

type ExportTab = 'app' | 'html' | 'component' | 'json';

export const ExportCodeModal: React.FC<ExportCodeModalProps> = ({
  isOpen,
  onClose,
  config,
  presetName,
  material,
  volume,
}) => {
  // Default to 'app' (App.tsx for AI Studio / React / Vite)
  const [activeTab, setActiveTab] = useState<ExportTab>('app');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  if (!isOpen) return null;

  const appCode = generateStandaloneAppTsxCode(config, presetName, material, volume);
  const htmlCode = generateVanillaHtmlCode(config, presetName, material, volume);
  const componentCode = generateStandaloneReactCode(config, presetName, material, volume);
  const jsonCode = generateConfigJson(config, presetName, material, volume);

  const currentCode =
    activeTab === 'app'
      ? appCode
      : activeTab === 'html'
      ? htmlCode
      : activeTab === 'component'
      ? componentCode
      : jsonCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyPromptForAIStudio = async () => {
    try {
      const prompt = `Please replace the entire contents of src/App.tsx with the following complete, self-contained interactive glyph curtain application (it has zero external dependencies and runs with pure React + HTML5 Canvas + Web Audio API):\n\n${appCode}`;
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2400);
    } catch (err) {
      console.error('Failed to copy prompt: ', err);
    }
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'app'
        ? 'App.tsx'
        : activeTab === 'html'
        ? 'resonant-glyph-curtain.html'
        : activeTab === 'component'
        ? 'ResonantGlyphCurtain.tsx'
        : 'curtain-chime-config.json';
    const mime =
      activeTab === 'html'
        ? 'text/html'
        : activeTab === 'json'
        ? 'application/json'
        : 'text/typescript';

    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const materialDisplayNames: Record<CurtainMaterial, string> = {
    crystal: 'Silk & Crystal Koshi',
    bamboo: 'Acoustic Bamboo Chimes',
    bronze: 'Ancient Temple Bronze',
    furin: 'Edo Fūrin Wind Bell',
    bowl: 'Himalayan Singing Bowl',
    silver: 'Nordic Frost Silver',
    stone: 'Obsidian River Stone',
    harp: 'Celestial Aeolian Harp',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export and Copy Chime Curtain Code"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <Code2 className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 tracking-wide">
                Export Chime Curtain Code
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-1 max-w-xl">
              Export this complete, self-contained interactive curtain with all tuned sounds, chain weight, and physics settings.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Configuration Badge Row */}
        <div className="px-6 py-2.5 bg-stone-950/40 border-b border-stone-800/80 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-stone-400 font-medium">Baking in settings:</span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 font-medium border border-stone-700/80">
            <Volume2 className="w-3 h-3 text-amber-400" />
            {materialDisplayNames[material] || material}
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700/80">
            <span
              className="w-2.5 h-2.5 rounded-full border border-stone-600 inline-block"
              style={{ backgroundColor: config.glyphColor }}
            />
            {config.glyphColor}
          </span>

          <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700/80 font-mono">
            {config.strandCount} strands × {config.glyphsPerStrand} glyphs
          </span>

          <span
            className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700/80 font-mono max-w-[180px] truncate"
            title={config.glyphSet}
          >
            {config.glyphSet.slice(0, 8)}...
          </span>

          <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-medium ml-auto hidden sm:inline-block">
            ✓ Zero External Dependencies
          </span>
        </div>

        {/* AI Studio Tip Banner */}
        <div className="px-6 py-2.5 bg-amber-500/[0.08] border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Bot className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {activeTab === 'app' ? (
                <>
                  <strong className="text-amber-300">Using a New AI Studio project?</strong> Copy this code and replace <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">src/App.tsx</code>. It compiles and runs immediately!
                </>
              ) : activeTab === 'html' ? (
                <>
                  <strong className="text-amber-300">Website Embed:</strong> Paste this directly into WordPress, Webflow, Shopify, or an HTML file.
                </>
              ) : activeTab === 'component' ? (
                <>
                  <strong className="text-amber-300">React Component:</strong> Save as <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">ResonantGlyphCurtain.tsx</code> to embed into an existing layout.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">JSON Config:</strong> Raw mathematical parameters schema.
                </>
              )}
            </span>
          </div>

          {activeTab === 'app' && (
            <button
              type="button"
              onClick={handleCopyPromptForAIStudio}
              className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                copiedPrompt
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
              }`}
              title="Copy a prompt ready to paste into new AI Studio"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  <span>Copy AI Studio Prompt</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Format Selector Tabs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-stone-800 bg-stone-900">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('app')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'app'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>React (App.tsx / AI Studio)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'html'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML / Embed (Websites)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('component')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'component'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Component (.tsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'json'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Config JSON</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
              title="Download file to your computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code View Area */}
        <div className="relative flex-1 min-h-[300px] overflow-hidden bg-stone-950 flex flex-col">
          <div className="absolute top-2.5 right-4 z-10 text-[10px] text-stone-500 font-mono pointer-events-none">
            {currentCode.split('\n').length} lines • {Math.round((currentCode.length / 1024) * 10) / 10} KB
          </div>

          <textarea
            readOnly
            value={currentCode}
            aria-label="Exported code snippet"
            className="w-full flex-1 p-5 bg-stone-950 text-stone-300 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-amber-500/30 selection:text-white overflow-auto border-0"
            spellCheck={false}
          />
        </div>

        {/* Footer with Step-by-Step Instructions */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-2 text-stone-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {activeTab === 'app'
                ? 'AI Studio: Replace src/App.tsx with this file. It runs full-screen with 0 errors.'
                : activeTab === 'html'
                ? 'Drop-in: Paste directly into HTML, Webflow Embed, or Shopify theme.'
                : activeTab === 'component'
                ? 'React: Save as ResonantGlyphCurtain.tsx and import <ResonantGlyphCurtain />.'
                : 'JSON: Load directly into any custom physical simulation engine.'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-stone-500">
            <span>• Full Physics Weight</span>
            <span>• Acoustic Chimes</span>
            <span>• Zero NPM Packages</span>
          </div>
        </div>
      </div>
    </div>
  );
};
