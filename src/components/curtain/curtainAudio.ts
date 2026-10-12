/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurtainMaterial } from '../../data/curtainPresets';

// 24 Tuned Pentatonic Chime Frequencies spanning D3 to G6 (Consonant, Meditative, Celestial)
export const STRAND_PENTATONIC_SCALE = [
  146.83, // D3 (warm foundation)
  164.81, // E3
  196.00, // G3
  220.00, // A3
  246.94, // B3
  293.66, // D4 (rich singing chime)
  329.63, // E4
  392.00, // G4
  440.00, // A4 (concert center)
  493.88, // B4
  523.25, // C5
  587.33, // D5 (crystalline bell)
  659.25, // E5
  783.99, // G5
  880.00, // A5
  987.77, // B5
  1046.50, // C6
  1174.66, // D6 (pure celestial sparkle)
  1318.51, // E6
  1567.98, // G6
];

export class CurtainAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  public enabled: boolean = false;
  public volume: number = 0.88; // Full, rich default volume
  public isMuted: boolean = false;
  public material: CurtainMaterial = 'crystal';

  // Polyphony management (allows up to 18 concurrent resonant voices)
  private activeVoices: { id: number; stopVoice: () => void }[] = [];
  private voiceCounter: number = 0;
  private readonly maxPolyphony: number = 18;
  private lastGlobalNoteTime: number = 0;
  private readonly minNoteIntervalMs: number = 20;

  constructor() {}

  public setMaterial(mat: CurtainMaterial): void {
    this.material = mat;
  }

  /**
   * Returns current AudioContext state for UI & diagnostics
   */
  public getContextState(): AudioContextState | 'uninitialized' {
    if (!this.ctx) return 'uninitialized';
    return this.ctx.state;
  }

  /**
   * Initializes or resumes the AudioContext directly inside user click handler
   */
  public async enable(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtxClass();

        // 1. Master Soft-Knee Compressor / Limiter for loud, warm, non-distorting sound
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-2.5, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(14, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

        // 2. Master Gain (Full, rich output level)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.95, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        // 3. Lush, warm, natural acoustic reverb space (creates peaceful lingering finish)
        this.reverbNode = this.ctx.createConvolver();
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

        this.generateReverbBuffer();

        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
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

  /**
   * Generates a lush, warm impulse response for natural chime reverberation and smooth fade
   */
  private generateReverbBuffer(): void {
    if (!this.ctx || !this.reverbNode) return;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 3.0); // 3.0s lush decay
    const buffer = this.ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      // Exponential decay with natural high-frequency air dampening
      const decay = Math.exp(-t * 1.95);
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    this.reverbNode.buffer = buffer;
  }

  /**
   * Diagnostic test chime: plays a loud, calm, resonant chime note.
   */
  public async playTestChime(): Promise<void> {
    await this.enable();
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.playChimeNote(440.0, 0.5, 0.85);
  }

  /**
   * Plays a tuned chime note for a specific individual chain/strand.
   * Every single strand has its own unique, harmonious pitch!
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

    // Map strand index smoothly across the pentatonic scale
    const scaleLen = STRAND_PENTATONIC_SCALE.length;
    const ratio = Math.max(0, Math.min(1, strandIndex / Math.max(1, totalStrands - 1)));
    const scaleIdx = Math.min(scaleLen - 1, Math.floor(ratio * scaleLen));
    let freq = STRAND_PENTATONIC_SCALE[scaleIdx];

    // Pitch shift according to material character
    if (this.material === 'bronze') {
      freq = freq * 0.75; // Deep temple gong range
    } else if (this.material === 'furin') {
      freq = freq * 1.15; // Higher sparkling bell range
    }

    const stereoPan = panX !== undefined ? panX : ratio;
    this.playChimeNote(freq, stereoPan, velocity);
  }

  /**
   * Synthesizes physical chime acoustic profile based on material:
   * crystal, bamboo, bronze, or furin.
   */
  public playChimeNote(freq: number, panX: number = 0.5, velocity: number = 0.65): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const strikeVel = Math.max(0.35, Math.min(1.0, velocity));

    // Manage polyphony: gently fade oldest voice over 120ms
    if (this.activeVoices.length >= this.maxPolyphony) {
      const oldest = this.activeVoices.shift();
      if (oldest) {
        oldest.stopVoice();
      }
    }

    // Stereo Panner (-0.75 to +0.75)
    let panner: StereoPannerNode | GainNode;
    if (this.ctx.createStereoPanner) {
      const sp = this.ctx.createStereoPanner();
      const panVal = Math.max(-0.75, Math.min(0.75, (panX * 2 - 1) * 0.75));
      sp.pan.setValueAtTime(panVal, now);
      sp.connect(this.masterGain);
      if (this.reverbNode) sp.connect(this.reverbNode);
      panner = sp;
    } else {
      panner = this.masterGain;
    }

    // Material-specific acoustic parameters
    let fundamentalDecay = 4.8;
    let attackTime = 0.005;
    let peakVolume = 0.38 * strikeVel;
    let partials = [
      { ratio: 1.0, amp: 1.0, type: 'sine' as OscillatorType },
      { ratio: (freq + 0.85) / freq, amp: 0.78, type: 'sine' as OscillatorType },
      { ratio: 2.756, amp: 0.32, type: 'sine' as OscillatorType },
      { ratio: 5.404, amp: 0.12, type: 'sine' as OscillatorType },
    ];

    if (this.material === 'bamboo') {
      // Hollow wood knocks: faster organic decay, woody odd harmonics
      fundamentalDecay = 2.2;
      peakVolume = 0.44 * strikeVel;
      this.playTingTransient(now, strikeVel, panner, 680, 0.035);
      partials = [
        { ratio: 1.0, amp: 1.0, type: 'triangle' },
        { ratio: 1.48, amp: 0.55, type: 'sine' },
        { ratio: 2.12, amp: 0.28, type: 'sine' },
      ];
    } else if (this.material === 'bronze') {
      // Deep temple bronze: extended 5.6s singing sustain, rich overtone warmth
      fundamentalDecay = 5.6;
      peakVolume = 0.42 * strikeVel;
      attackTime = 0.008;
      this.playTingTransient(now, strikeVel, panner, 1200, 0.028);
      partials = [
        { ratio: 1.0, amp: 1.0, type: 'sine' },
        { ratio: (freq + 0.55) / freq, amp: 0.82, type: 'sine' },
        { ratio: 1.98, amp: 0.35, type: 'sine' },
        { ratio: 2.756, amp: 0.45, type: 'sine' },
        { ratio: 4.12, amp: 0.16, type: 'sine' },
      ];
    } else if (this.material === 'furin') {
      // Porcelain bell: high-frequency ting, clean crystal ring
      fundamentalDecay = 3.6;
      peakVolume = 0.36 * strikeVel;
      this.playTingTransient(now, strikeVel, panner, 4200, 0.018);
      partials = [
        { ratio: 1.0, amp: 1.0, type: 'sine' },
        { ratio: (freq + 1.1) / freq, amp: 0.72, type: 'sine' },
        { ratio: 2.95, amp: 0.42, type: 'sine' },
        { ratio: 5.8, amp: 0.15, type: 'sine' },
      ];
    } else if (this.material === 'bowl') {
      // Himalayan singing bowl: profound fundamental with acoustic beating & 6.8s meditative sustain
      fundamentalDecay = 6.8;
      peakVolume = 0.46 * strikeVel;
      attackTime = 0.015;
      this.playTingTransient(now, strikeVel, panner, 540, 0.04);
      partials = [
        { ratio: 1.0, amp: 1.0, type: 'sine' },
        { ratio: (freq + 0.38) / freq, amp: 0.88, type: 'sine' },
        { ratio: 2.76, amp: 0.48, type: 'sine' },
        { ratio: 4.18, amp: 0.22, type: 'sine' },
      ];
    } else if (this.material === 'silver') {
      // Nordic frost silver: crystalline high sparkle, fast attack, 4.2s shimmer
      fundamentalDecay = 4.2;
      peakVolume = 0.38 * strikeVel;
      attackTime = 0.003;
      this.playTingTransient(now, strikeVel, panner, 5200, 0.015);
      partials = [
        { ratio: 1.0, amp: 1.0, type: 'sine' },
        { ratio: 2.01, amp: 0.65, type: 'sine' },
        { ratio: 3.14, amp: 0.38, type: 'sine' },
        { ratio: 5.82, amp: 0.18, type: 'sine' },
      ];
    } else if (this.material === 'stone') {
      // Obsidian tumbled stone: dense mineral clatter, quick 1.8s decay, natural organic settling
      fundamentalDecay = 1.8;
      peakVolume = 0.45 * strikeVel;
      attackTime = 0.002;
      this.playTingTransient(now, strikeVel, panner, 420, 0.03);
      partials = [
        { ratio: 1.0, amp: 1.0, type: 'triangle' },
        { ratio: 1.62, amp: 0.52, type: 'sine' },
        { ratio: 2.38, amp: 0.24, type: 'triangle' },
      ];
    } else if (this.material === 'harp') {
      // Celestial Aeolian wind harp: soft plucked string, rich harmonic series, 5.2s lingering air
      fundamentalDecay = 5.2;
      peakVolume = 0.40 * strikeVel;
      attackTime = 0.012;
      this.playTingTransient(now, strikeVel, panner, 1600, 0.025);
      partials = [
        { ratio: 1.0, amp: 1.0, type: 'sine' },
        { ratio: 2.0, amp: 0.55, type: 'sine' },
        { ratio: 3.0, amp: 0.32, type: 'sine' },
        { ratio: 4.0, amp: 0.16, type: 'sine' },
      ];
    } else {
      // Default: Silk & Crystal Koshi
      fundamentalDecay = 4.8;
      this.playTingTransient(now, strikeVel, panner, 3600, 0.02);
    }

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    // Smooth attack
    voiceGain.gain.linearRampToValueAtTime(Math.min(0.55, peakVolume), now + attackTime);
    // Exponential fadeout ("at end it goes well")
    voiceGain.gain.exponentialRampToValueAtTime(0.00006, now + fundamentalDecay);
    voiceGain.connect(panner);

    const activeOscs: OscillatorNode[] = [];

    partials.forEach(({ ratio, amp, type }) => {
      if (!this.ctx) return;
      const partialFreq = freq * ratio;
      if (partialFreq > 18000) return;

      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(partialFreq, now);

      pGain.gain.setValueAtTime(amp, now);

      osc.connect(pGain);
      pGain.connect(voiceGain);

      osc.start(now);
      osc.stop(now + fundamentalDecay + 0.05);
      activeOscs.push(osc);
    });

    const voiceId = ++this.voiceCounter;
    const voiceRecord = {
      id: voiceId,
      stopVoice: () => {
        try {
          const stopTime = this.ctx ? this.ctx.currentTime : now;
          voiceGain.gain.cancelScheduledValues(stopTime);
          voiceGain.gain.linearRampToValueAtTime(0.0001, stopTime + 0.12);
          setTimeout(() => {
            activeOscs.forEach(o => {
              try {
                o.stop();
                o.disconnect();
              } catch {}
            });
            try {
              voiceGain.disconnect();
            } catch {}
          }, 140);
        } catch {}
      },
    };

    this.activeVoices.push(voiceRecord);

    setTimeout(() => {
      this.activeVoices = this.activeVoices.filter(v => v.id !== voiceId);
      try {
        voiceGain.disconnect();
      } catch {}
    }, (fundamentalDecay + 0.1) * 1000);
  }

  /**
   * Generates initial strike impact transient
   */
  private playTingTransient(
    now: number,
    vel: number,
    out: AudioNode,
    centerFreq: number = 3600,
    duration: number = 0.02
  ): void {
    if (!this.ctx) return;

    const len = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const env = Math.exp(-i / (len * 0.22));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.Q.setValueAtTime(2.6, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);

    src.start(now);
    src.stop(now + duration + 0.01);
  }
}

export const curtainAudio = new CurtainAudioEngine();
