/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GlyphCurtainConfig {
  // Density and Dimensions
  strandCount: number; // 40 - 75
  glyphsPerStrand: number; // 20 - 50
  fontSize: number; // 10 - 22 px
  strandSpacing?: number; // Calculated or manual
  
  // Visuals
  glyphColor: string;
  glyphFontFamily: string;
  glyphSet: string; // Characters used
  lengthJitter: number; // 0 to 1, variation in strand length at bottom
  
  // Physics & Simulation
  gravity: number; // Restoring tension
  damping: number; // Air resistance (e.g. 0.94 - 0.985)
  stiffness: number; // Constraint iterations / spring response
  interactionRadius: number; // Pointer repulsion radius (px)
  interactionStrength: number; // Pointer push force
  breezeStrength: number; // Ambient subtle wave (0 to 1)
  
  // Opening / Masking Bounds (relative 0-1 or absolute px)
  clipOpening?: {
    enabled: boolean;
    x: number; // percentage 0 to 1
    y: number; // percentage 0 to 1
    width: number; // percentage 0 to 1
    height: number; // percentage 0 to 1
    archRadius?: number; // rounded top arch
  };
}

export type GlyphPresetId = 'cjk' | 'geometric' | 'alchemical' | 'minimal' | 'custom';

export interface GlyphPreset {
  id: GlyphPresetId;
  name: string;
  description: string;
  characters: string;
  fontFamily: string;
}

export type SceneMode = 'effect-only' | 'entrance';

export interface AudioSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  zoneCount: number; // 5 to 7 pentatonic zones
}
