/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CurtainMaterial } from '../../data/curtainPresets';

export type ChimeScaleId =
  | 'akebono'
  | 'bamboo-folk'
  | 'tibetan'
  | 'singing-bowl'
  | 'koshi-aria'
  | 'woodstock'
  | 'slendro'
  | 'aeolian-harp';

export type ReverbSpace = 'temple' | 'veranda' | 'garden' | 'cathedral';
export type OctaveRegister = 'deep' | 'standard' | 'celestial';

export interface ScaleDefinition {
  id: ChimeScaleId;
  name: string;
  origin: string;
  description: string;
  notes: number[];
}

export const CHIME_SCALES: Record<ChimeScaleId, ScaleDefinition> = {
  akebono: {
    id: 'akebono',
    name: 'Japanese Akebono',
    origin: 'Edo Shrine & Garden',
    description: 'Poetic, delicate high-register notes evoking morning breeze through cherry blossoms.',
    notes: [
      164.81, 174.61, 220.0, 246.94, 261.63, 329.63, 349.23, 440.0, 493.88, 523.25,
      659.25, 698.46, 880.0, 987.77, 1046.5, 1318.51, 1396.91, 1760.0, 1975.53, 2093.0,
    ],
  },
  'bamboo-folk': {
    id: 'bamboo-folk',
    name: 'Kyoto Folk Insen',
    origin: 'Traditional Bamboo Chime',
    description: 'Warm, earthy, hollow wooden intervals with organic grounded presence.',
    notes: [
      146.83, 155.56, 196.0, 220.0, 261.63, 293.66, 311.13, 392.0, 440.0, 523.25,
      587.33, 622.25, 783.99, 880.0, 1046.5, 1174.66, 1244.51, 1567.98,
    ],
  },
  tibetan: {
    id: 'tibetan',
    name: 'Tibetan Sacred Bronze',
    origin: 'Himalayan Monastery',
    description: 'Deep, majestic temple gong intervals with profound sub-bass undertones.',
    notes: [
      98.0, 116.54, 130.81, 146.83, 174.61, 196.0, 233.08, 261.63, 293.66, 349.23,
      392.0, 466.16, 523.25, 587.33, 698.46, 783.99, 932.33, 1046.5,
    ],
  },
  'singing-bowl': {
    id: 'singing-bowl',
    name: 'Sacred Om 432 Hz',
    origin: 'Tibetan Singing Bowls',
    description: 'Natural Verdi harmonic 5ths and octaves with soothing acoustic beating.',
    notes: [
      108.0, 162.0, 216.0, 270.0, 324.0, 432.0, 486.0, 540.0, 648.0, 864.0,
      972.0, 1080.0, 1296.0, 1512.0, 1728.0,
    ],
  },
  'koshi-aria': {
    id: 'koshi-aria',
    name: 'Silk & Crystal Koshi',
    origin: 'Pyrenean Koshi Aria',
    description: 'Pure, uplifting, crystalline Koshi harmonic series with shimmering ring.',
    notes: [
      220.0, 261.63, 329.63, 440.0, 493.88, 523.25, 659.25, 880.0, 987.77, 1046.5,
      1318.51, 1567.98, 1760.0, 1975.53, 2093.0,
    ],
  },
  woodstock: {
    id: 'woodstock',
    name: 'Woodstock Celestial',
    origin: 'Tubular Wind Chime',
    description: 'Classic American wind chime pentatonic with bright singing sustain.',
    notes: [
      261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0,
      1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0,
    ],
  },
  slendro: {
    id: 'slendro',
    name: 'Balinese Slendro',
    origin: 'Ancient Stone Lithophone',
    description: 'Equidistant 5-tone mineral scale evoking ancient carved basalt rocks.',
    notes: [
      174.61, 200.0, 230.0, 265.0, 305.0, 349.23, 400.0, 460.0, 530.0, 610.0,
      698.46, 800.0, 920.0, 1060.0, 1220.0, 1396.91,
    ],
  },
  'aeolian-harp': {
    id: 'aeolian-harp',
    name: 'Aeolian Wind Harp',
    origin: 'Open Air String Harp',
    description: 'Rich string harmonic series with shimmering open fifths and octaves.',
    notes: [
      146.83, 220.0, 293.66, 369.99, 440.0, 554.37, 587.33, 739.99, 880.0, 1108.73,
      1174.66, 1318.51, 1479.98, 1760.0, 2217.46,
    ],
  },
};

export const DEFAULT_MATERIAL_SCALES: Record<CurtainMaterial, ChimeScaleId> = {
  furin: 'akebono',
  bamboo: 'bamboo-folk',
  bronze: 'tibetan',
  bowl: 'singing-bowl',
  crystal: 'koshi-aria',
  silver: 'woodstock',
  stone: 'slendro',
  harp: 'aeolian-harp',
};

// Legacy backward-compatibility alias
export const STRAND_PENTATONIC_SCALE = CHIME_SCALES.akebono.notes;

interface ModalPartial {
  ratio: number;
  amp: number;
  decayMultiplier: number;
  type?: OscillatorType;
  detuneHz?: number;
}

interface MaterialAcousticDef {
  name: string;
  fundamentalDecay: number;
  attackTime: number;
  volumeMultiplier: number;
  partials: ModalPartial[];
  transient: {
    centerFreq: number;
    duration: number;
    gain: number;
    q: number;
    subThudFreq?: number;
  };
}

export class CurtainAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  public enabled: boolean = false;
  public volume: number = 0.88;
  public isMuted: boolean = false;
  public material: CurtainMaterial = 'furin';
  public scaleId: ChimeScaleId = 'akebono';
  public octave: OctaveRegister = 'standard';
  public reverbSpace: ReverbSpace = 'temple';

  // Polyphony management
  private activeVoices: { id: number; stopVoice: () => void }[] = [];
  private voiceCounter: number = 0;
  private readonly maxPolyphony: number = 22;
  private lastGlobalNoteTime: number = 0;
  private readonly minNoteIntervalMs: number = 18;

  constructor() {}

  public setMaterial(mat: CurtainMaterial, autoSwitchScale: boolean = true): void {
    this.material = mat;
    if (autoSwitchScale && DEFAULT_MATERIAL_SCALES[mat]) {
      this.scaleId = DEFAULT_MATERIAL_SCALES[mat];
    }
  }

  public setScale(scale: ChimeScaleId): void {
    if (CHIME_SCALES[scale]) {
      this.scaleId = scale;
    }
  }

  public setOctave(octave: OctaveRegister): void {
    this.octave = octave;
  }

  public async setReverbSpace(space: ReverbSpace): Promise<void> {
    this.reverbSpace = space;
    if (this.ctx && this.reverbNode) {
      await this.generateReverbBuffer();
    }
  }

  public getContextState(): AudioContextState | 'uninitialized' {
    if (!this.ctx) return 'uninitialized';
    return this.ctx.state;
  }

  public async enable(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtxClass();

        // Limiter/Compressor
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-2.0, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(14, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.95, this.ctx.currentTime);

        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.setValueAtTime(0.38, this.ctx.currentTime);

        this.reverbNode = this.ctx.createConvolver();
        await this.generateReverbBuffer();

        this.dryGain.connect(this.masterGain);
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      const isRunning = this.ctx.state === 'running';
      this.enabled = isRunning;
      return isRunning;
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
      this.enabled = false;
      return false;
    }
  }

  public disable(): void {
    this.enabled = false;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.95, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume * 0.95, this.ctx.currentTime, 0.05);
    }
  }

  private async generateReverbBuffer(): Promise<void> {
    if (!this.ctx || !this.reverbNode) return;
    const rate = this.ctx.sampleRate;

    let lengthSeconds = 3.2;
    let decaySlope = 2.0;

    if (this.reverbSpace === 'temple') {
      lengthSeconds = 4.8;
      decaySlope = 1.35;
      if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.48, this.ctx.currentTime, 0.05);
    } else if (this.reverbSpace === 'cathedral') {
      lengthSeconds = 6.0;
      decaySlope = 1.1;
      if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.05);
    } else if (this.reverbSpace === 'garden') {
      lengthSeconds = 1.5;
      decaySlope = 3.6;
      if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.25, this.ctx.currentTime, 0.05);
    } else {
      // veranda
      lengthSeconds = 2.4;
      decaySlope = 2.4;
      if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.05);
    }

    const length = Math.floor(rate * lengthSeconds);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const decay = Math.exp(-t * decaySlope);
      // Discrete early reflection burst
      let early = 0;
      if (i === 180 || i === 420 || i === 850 || i === 1600) {
        early = 0.45 * Math.exp(-t * 4);
      }
      left[i] = (Math.random() * 2 - 1) * decay + early;
      right[i] = (Math.random() * 2 - 1) * decay - early * 0.8;
    }

    this.reverbNode.buffer = impulse;
  }

  /**
   * Diagnostic single note chime
   */
  public async playTestChime(): Promise<void> {
    await this.enable();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const scale = CHIME_SCALES[this.scaleId] || CHIME_SCALES.akebono;
    const midNote = scale.notes[Math.floor(scale.notes.length / 2)] || 440;
    this.playChimeNote(midNote, 0.5, 0.85);
  }

  /**
   * Plays a quick melodic cascade strum across 5 notes of the active scale
   */
  public async strumScale(velocity: number = 0.75): Promise<void> {
    await this.enable();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const scale = CHIME_SCALES[this.scaleId] || CHIME_SCALES.akebono;
    const sampleNotes = [
      scale.notes[1] || scale.notes[0],
      scale.notes[3] || scale.notes[1],
      scale.notes[5] || scale.notes[2],
      scale.notes[7] || scale.notes[3],
      scale.notes[9] || scale.notes[4],
    ];

    sampleNotes.forEach((f, idx) => {
      setTimeout(() => {
        const pan = 0.2 + (idx / (sampleNotes.length - 1)) * 0.6;
        this.playChimeNote(f, pan, velocity);
      }, idx * 110);
    });
  }

  /**
   * Play an explicit note from the active scale by index
   */
  public playNoteIndex(index: number, velocity: number = 0.7): void {
    const scale = CHIME_SCALES[this.scaleId] || CHIME_SCALES.akebono;
    const clamped = Math.max(0, Math.min(scale.notes.length - 1, index));
    const pan = clamped / Math.max(1, scale.notes.length - 1);
    this.playChimeNote(scale.notes[clamped], pan, velocity);
  }

  /**
   * Plays a tuned chime note for a specific individual chain/strand.
   */
  public playStrandChime(
    strandIndex: number,
    totalStrands: number,
    velocity: number = 0.6,
    panX?: number
  ): void {
    if (!this.enabled || this.isMuted || !this.ctx || this.ctx.state !== 'running') {
      return;
    }

    const now = performance.now();
    if (now - this.lastGlobalNoteTime < this.minNoteIntervalMs) {
      return;
    }
    this.lastGlobalNoteTime = now;

    const scale = CHIME_SCALES[this.scaleId] || CHIME_SCALES.akebono;
    const scaleLen = scale.notes.length;
    const ratio = Math.max(0, Math.min(1, strandIndex / Math.max(1, totalStrands - 1)));
    const scaleIdx = Math.min(scaleLen - 1, Math.floor(ratio * scaleLen));
    let freq = scale.notes[scaleIdx];

    // Apply register shift
    if (this.octave === 'deep') {
      freq *= 0.5;
    } else if (this.octave === 'celestial') {
      freq *= 1.5;
    }

    const stereoPan = panX !== undefined ? panX : ratio;
    this.playChimeNote(freq, stereoPan, velocity);
  }

  /**
   * Full physical modal synthesis per material.
   */
  public playChimeNote(freq: number, panX: number = 0.5, velocity: number = 0.65): void {
    if (!this.ctx || !this.masterGain || !this.dryGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const strikeVel = Math.max(0.3, Math.min(1.0, velocity));

    // Polyphony management
    if (this.activeVoices.length >= this.maxPolyphony) {
      const oldest = this.activeVoices.shift();
      if (oldest) {
        oldest.stopVoice();
      }
    }

    // Stereo Panner
    let voiceOut: AudioNode;
    if (this.ctx.createStereoPanner) {
      const sp = this.ctx.createStereoPanner();
      const panVal = Math.max(-0.85, Math.min(0.85, (panX * 2 - 1) * 0.85));
      sp.pan.setValueAtTime(panVal, now);
      sp.connect(this.dryGain);
      if (this.reverbNode) sp.connect(this.reverbNode);
      voiceOut = sp;
    } else {
      voiceOut = this.dryGain;
    }

    // Material Acoustic Definitions
    const acousticDef = this.getAcousticDef(this.material, freq);

    // 1. Physical Impact Transient
    this.playPhysicalTransient(now, strikeVel, voiceOut, acousticDef.transient);

    // 2. Modal Partials with independent decays
    const activeOscs: OscillatorNode[] = [];
    const activeGains: GainNode[] = [];
    const peakVol = acousticDef.volumeMultiplier * strikeVel;

    acousticDef.partials.forEach(part => {
      if (!this.ctx) return;
      const partFreq = freq * part.ratio + (part.detuneHz || 0);
      if (partFreq > 18500 || partFreq < 30) return;

      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      osc.type = part.type || 'sine';
      osc.frequency.setValueAtTime(partFreq, now);

      const partPeak = peakVol * part.amp;
      const partDecay = Math.max(0.18, acousticDef.fundamentalDecay * part.decayMultiplier);

      pGain.gain.setValueAtTime(0.0001, now);
      pGain.gain.linearRampToValueAtTime(partPeak, now + acousticDef.attackTime);
      pGain.gain.exponentialRampToValueAtTime(0.00005, now + partDecay);

      osc.connect(pGain);
      pGain.connect(voiceOut);

      osc.start(now);
      osc.stop(now + partDecay + 0.04);

      activeOscs.push(osc);
      activeGains.push(pGain);
    });

    const voiceId = ++this.voiceCounter;
    const voiceRecord = {
      id: voiceId,
      stopVoice: () => {
        try {
          const stopTime = this.ctx ? this.ctx.currentTime : now;
          activeGains.forEach(g => {
            try {
              g.gain.cancelScheduledValues(stopTime);
              g.gain.linearRampToValueAtTime(0.0001, stopTime + 0.08);
            } catch {}
          });
          setTimeout(() => {
            activeOscs.forEach(o => {
              try {
                o.stop();
                o.disconnect();
              } catch {}
            });
            activeGains.forEach(g => {
              try {
                g.disconnect();
              } catch {}
            });
          }, 100);
        } catch {}
      },
    };

    this.activeVoices.push(voiceRecord);
    setTimeout(() => {
      this.activeVoices = this.activeVoices.filter(v => v.id !== voiceId);
    }, (acousticDef.fundamentalDecay + 0.1) * 1000);
  }

  private playPhysicalTransient(
    now: number,
    vel: number,
    out: AudioNode,
    params: MaterialAcousticDef['transient']
  ): void {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * params.duration);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const env = Math.exp(-i / (len * 0.24));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(params.centerFreq, now);
    filter.Q.setValueAtTime(params.q, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vel * params.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + params.duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);

    src.start(now);
    src.stop(now + params.duration + 0.01);

    // Optional deep mallet body thud (for bronze gongs and heavy bowls)
    if (params.subThudFreq && this.ctx) {
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(params.subThudFreq, now);
      thudOsc.frequency.exponentialRampToValueAtTime(params.subThudFreq * 0.5, now + 0.06);

      thudGain.gain.setValueAtTime(vel * params.gain * 0.65, now);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      thudOsc.connect(thudGain);
      thudGain.connect(out);

      thudOsc.start(now);
      thudOsc.stop(now + 0.08);
    }
  }

  private getAcousticDef(material: CurtainMaterial, freq: number): MaterialAcousticDef {
    switch (material) {
      case 'bamboo':
        return {
          name: 'Kyoto Temple Bamboo',
          fundamentalDecay: 1.15,
          attackTime: 0.003,
          volumeMultiplier: 0.52,
          transient: {
            centerFreq: 640,
            duration: 0.038,
            gain: 0.42,
            q: 2.2,
            subThudFreq: 180,
          },
          partials: [
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'triangle' },
            { ratio: 1.48, amp: 0.62, decayMultiplier: 0.45, type: 'triangle' },
            { ratio: 2.15, amp: 0.34, decayMultiplier: 0.28, type: 'sine' },
            { ratio: 3.12, amp: 0.18, decayMultiplier: 0.15, type: 'sine' },
          ],
        };

      case 'bronze':
        return {
          name: 'Ancient Temple Bronze',
          fundamentalDecay: 6.8,
          attackTime: 0.008,
          volumeMultiplier: 0.46,
          transient: {
            centerFreq: 950,
            duration: 0.032,
            gain: 0.36,
            q: 2.8,
            subThudFreq: 110,
          },
          partials: [
            // Sub-octave hum tone
            { ratio: 0.5, amp: 0.55, decayMultiplier: 1.15, type: 'sine' },
            // Fundamental strike tone
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'sine' },
            // Beating partner for undulating temple singing shimmer
            { ratio: 1.0, amp: 0.85, decayMultiplier: 0.95, type: 'sine', detuneHz: 0.65 },
            // Tierce (minor 3rd) characteristic of sacred bells
            { ratio: 1.20, amp: 0.45, decayMultiplier: 0.72, type: 'sine' },
            // Quint (5th)
            { ratio: 1.50, amp: 0.38, decayMultiplier: 0.58, type: 'sine' },
            // Inharmonic overtone
            { ratio: 2.756, amp: 0.32, decayMultiplier: 0.38, type: 'sine' },
            { ratio: 4.12, amp: 0.16, decayMultiplier: 0.22, type: 'sine' },
          ],
        };

      case 'bowl':
        return {
          name: 'Himalayan Singing Bowl',
          fundamentalDecay: 7.8,
          attackTime: 0.025, // Soft friction/mallet swell
          volumeMultiplier: 0.48,
          transient: {
            centerFreq: 420,
            duration: 0.045,
            gain: 0.28,
            q: 2.0,
            subThudFreq: 95,
          },
          partials: [
            // Deep fundamental with audible binaural beating (1.2 Hz difference)
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'sine' },
            { ratio: 1.0, amp: 0.9, decayMultiplier: 0.98, type: 'sine', detuneHz: 1.2 },
            // 2nd octave singing overtone
            { ratio: 2.0, amp: 0.5, decayMultiplier: 0.75, type: 'sine' },
            // Golden overtone
            { ratio: 2.76, amp: 0.35, decayMultiplier: 0.52, type: 'sine' },
            // Singing bowl lip vibration
            { ratio: 4.18, amp: 0.22, decayMultiplier: 0.35, type: 'sine' },
          ],
        };

      case 'furin':
        return {
          name: 'Edo Fūrin Wind Bell',
          fundamentalDecay: 3.8,
          attackTime: 0.003,
          volumeMultiplier: 0.42,
          transient: {
            centerFreq: 4200,
            duration: 0.016,
            gain: 0.38,
            q: 3.5,
          },
          partials: [
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'sine' },
            { ratio: 1.0, amp: 0.7, decayMultiplier: 0.88, type: 'sine', detuneHz: 1.5 },
            { ratio: 2.95, amp: 0.45, decayMultiplier: 0.48, type: 'sine' },
            { ratio: 5.8, amp: 0.22, decayMultiplier: 0.25, type: 'sine' },
          ],
        };

      case 'silver':
        return {
          name: 'Nordic Frost Silver',
          fundamentalDecay: 5.4,
          attackTime: 0.003,
          volumeMultiplier: 0.42,
          transient: {
            centerFreq: 5200,
            duration: 0.018,
            gain: 0.40,
            q: 3.2,
          },
          partials: [
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'sine' },
            { ratio: 1.0, amp: 0.75, decayMultiplier: 0.94, type: 'sine', detuneHz: 0.75 },
            { ratio: 2.756, amp: 0.42, decayMultiplier: 0.48, type: 'sine' },
            { ratio: 5.404, amp: 0.24, decayMultiplier: 0.28, type: 'sine' },
            { ratio: 8.933, amp: 0.08, decayMultiplier: 0.14, type: 'sine' },
          ],
        };

      case 'stone':
        return {
          name: 'Obsidian River Stone',
          fundamentalDecay: 0.48, // Very dry, rapid, tactile mineral clatter!
          attackTime: 0.001,
          volumeMultiplier: 0.58,
          transient: {
            centerFreq: 850,
            duration: 0.024,
            gain: 0.48,
            q: 1.8,
            subThudFreq: 260,
          },
          partials: [
            // Solid non-harmonic mineral modes
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'triangle' },
            { ratio: 1.414, amp: 0.55, decayMultiplier: 0.55, type: 'triangle' },
            { ratio: 1.83, amp: 0.32, decayMultiplier: 0.35, type: 'sine' },
            { ratio: 2.37, amp: 0.18, decayMultiplier: 0.20, type: 'sine' },
          ],
        };

      case 'harp':
        return {
          name: 'Celestial Aeolian Harp',
          fundamentalDecay: 4.8,
          attackTime: 0.012, // Plucked string bloom
          volumeMultiplier: 0.44,
          transient: {
            centerFreq: 1800,
            duration: 0.022,
            gain: 0.32,
            q: 2.5,
          },
          partials: [
            // True string harmonic integer overtone series
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'sine' },
            { ratio: 2.0, amp: 0.62, decayMultiplier: 0.75, type: 'sine' },
            { ratio: 3.0, amp: 0.38, decayMultiplier: 0.55, type: 'sine' },
            { ratio: 4.0, amp: 0.22, decayMultiplier: 0.38, type: 'sine' },
            { ratio: 5.0, amp: 0.12, decayMultiplier: 0.25, type: 'sine' },
          ],
        };

      case 'crystal':
      default:
        return {
          name: 'Silk & Crystal Koshi',
          fundamentalDecay: 5.0,
          attackTime: 0.004,
          volumeMultiplier: 0.42,
          transient: {
            centerFreq: 3600,
            duration: 0.02,
            gain: 0.36,
            q: 3.0,
          },
          partials: [
            { ratio: 1.0, amp: 1.0, decayMultiplier: 1.0, type: 'sine' },
            { ratio: 1.0, amp: 0.8, decayMultiplier: 0.95, type: 'sine', detuneHz: 0.85 },
            { ratio: 2.756, amp: 0.38, decayMultiplier: 0.50, type: 'sine' },
            { ratio: 5.404, amp: 0.18, decayMultiplier: 0.28, type: 'sine' },
          ],
        };
    }
  }
}

export const curtainAudio = new CurtainAudioEngine();
