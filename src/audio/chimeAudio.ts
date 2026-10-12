/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChimeMaterial = 'aluminum' | 'bronze' | 'bamboo' | 'glass' | 'furin';

export type ChimeScaleKey = 'aria' | 'ignis' | 'terra' | 'aqua' | 'zen' | 'solfeggio';

export type ReverbEnvironment = 'porch' | 'temple' | 'garden';

export type AmbienceType = 'none' | 'evening' | 'breeze' | 'stream';

export interface ChimeNote {
  note: string;
  freq: number;
  lengthRatio: number; // For physical tube rendering length (lower freq = longer tube)
  tubeColorModifier?: string;
}

export interface ChimeScale {
  id: ChimeScaleKey;
  name: string;
  element: string;
  description: string;
  notes: ChimeNote[];
}

// Frequencies calculation helper (allows 440Hz vs 432Hz reference pitch)
export const getScales = (pitchReference: number = 440): Record<ChimeScaleKey, ChimeScale> => {
  const ratio = pitchReference / 440;
  
  return {
    aria: {
      id: 'aria',
      name: 'Aria (Air)',
      element: 'Air',
      description: 'Crystalline and uplifting. Koshi-inspired harmonic series.',
      notes: [
        { note: 'A4', freq: 440.0 * ratio, lengthRatio: 1.0 },
        { note: 'C5', freq: 523.25 * ratio, lengthRatio: 0.91 },
        { note: 'E5', freq: 659.25 * ratio, lengthRatio: 0.82 },
        { note: 'A5', freq: 880.0 * ratio, lengthRatio: 0.71 },
        { note: 'B5', freq: 987.77 * ratio, lengthRatio: 0.67 },
        { note: 'C6', freq: 1046.5 * ratio, lengthRatio: 0.65 },
        { note: 'E6', freq: 1318.5 * ratio, lengthRatio: 0.58 },
        { note: 'B6', freq: 1975.5 * ratio, lengthRatio: 0.47 },
      ],
    },
    ignis: {
      id: 'ignis',
      name: 'Ignis (Fire)',
      element: 'Fire',
      description: 'Warm, radiant, and inspiring. Rich golden intervals.',
      notes: [
        { note: 'G4', freq: 392.0 * ratio, lengthRatio: 1.0 },
        { note: 'B4', freq: 493.88 * ratio, lengthRatio: 0.89 },
        { note: 'D5', freq: 587.33 * ratio, lengthRatio: 0.81 },
        { note: 'G5', freq: 783.99 * ratio, lengthRatio: 0.70 },
        { note: 'B5', freq: 987.77 * ratio, lengthRatio: 0.63 },
        { note: 'D6', freq: 1174.66 * ratio, lengthRatio: 0.57 },
        { note: 'G6', freq: 1567.98 * ratio, lengthRatio: 0.50 },
        { note: 'A6', freq: 1760.0 * ratio, lengthRatio: 0.47 },
      ],
    },
    terra: {
      id: 'terra',
      name: 'Terra (Earth)',
      element: 'Earth',
      description: 'Grounded, centering, and tranquil. Deep pastoral resonance.',
      notes: [
        { note: 'G4', freq: 392.0 * ratio, lengthRatio: 1.0 },
        { note: 'C5', freq: 523.25 * ratio, lengthRatio: 0.87 },
        { note: 'E5', freq: 659.25 * ratio, lengthRatio: 0.78 },
        { note: 'F5', freq: 698.46 * ratio, lengthRatio: 0.75 },
        { note: 'G5', freq: 783.99 * ratio, lengthRatio: 0.70 },
        { note: 'C6', freq: 1046.5 * ratio, lengthRatio: 0.61 },
        { note: 'E6', freq: 1318.5 * ratio, lengthRatio: 0.54 },
        { note: 'G6', freq: 1567.98 * ratio, lengthRatio: 0.50 },
      ],
    },
    aqua: {
      id: 'aqua',
      name: 'Aqua (Water)',
      element: 'Water',
      description: 'Fluid, deeply calming, and soothing like mountain rain.',
      notes: [
        { note: 'A4', freq: 440.0 * ratio, lengthRatio: 1.0 },
        { note: 'D5', freq: 587.33 * ratio, lengthRatio: 0.86 },
        { note: 'F5', freq: 698.46 * ratio, lengthRatio: 0.79 },
        { note: 'G5', freq: 783.99 * ratio, lengthRatio: 0.74 },
        { note: 'A5', freq: 880.0 * ratio, lengthRatio: 0.70 },
        { note: 'D6', freq: 1174.66 * ratio, lengthRatio: 0.61 },
        { note: 'F6', freq: 1396.91 * ratio, lengthRatio: 0.56 },
        { note: 'A6', freq: 1760.0 * ratio, lengthRatio: 0.50 },
      ],
    },
    zen: {
      id: 'zen',
      name: 'Kyoto Zen',
      element: 'Ether',
      description: 'Traditional pentatonic temple scale. Meditative and timeless.',
      notes: [
        { note: 'D4', freq: 293.66 * ratio, lengthRatio: 1.0 },
        { note: 'E4', freq: 329.63 * ratio, lengthRatio: 0.94 },
        { note: 'G4', freq: 392.0 * ratio, lengthRatio: 0.86 },
        { note: 'A4', freq: 440.0 * ratio, lengthRatio: 0.81 },
        { note: 'B4', freq: 493.88 * ratio, lengthRatio: 0.77 },
        { note: 'D5', freq: 587.33 * ratio, lengthRatio: 0.70 },
        { note: 'E5', freq: 659.25 * ratio, lengthRatio: 0.66 },
        { note: 'G5', freq: 783.99 * ratio, lengthRatio: 0.61 },
      ],
    },
    solfeggio: {
      id: 'solfeggio',
      name: 'Harmonic 432 Hz',
      element: 'Cosmos',
      description: 'Verdi natural tuning with pure mathematical harmonic intervals.',
      notes: [
        { note: 'C4', freq: 256.87 * (pitchReference / 432), lengthRatio: 1.0 },
        { note: 'D4', freq: 288.0 * (pitchReference / 432), lengthRatio: 0.94 },
        { note: 'E4', freq: 324.0 * (pitchReference / 432), lengthRatio: 0.89 },
        { note: 'G4', freq: 384.0 * (pitchReference / 432), lengthRatio: 0.81 },
        { note: 'A4', freq: 432.0 * (pitchReference / 432), lengthRatio: 0.77 },
        { note: 'C5', freq: 513.74 * (pitchReference / 432), lengthRatio: 0.70 },
        { note: 'D5', freq: 576.0 * (pitchReference / 432), lengthRatio: 0.66 },
        { note: 'E5', freq: 648.0 * (pitchReference / 432), lengthRatio: 0.62 },
      ],
    },
  };
};

export class ChimeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  
  private currentMaterial: ChimeMaterial = 'aluminum';
  private currentReverb: ReverbEnvironment = 'porch';
  private volume: number = 0.8;
  private isMuted: boolean = false;
  
  // Ambience audio nodes
  private currentAmbience: AmbienceType = 'evening';
  private ambienceGain: GainNode | null = null;
  private ambienceSourceNodes: (AudioNode | number)[] = [];
  private ambienceTimer: number | null = null;

  constructor() {
    // Lazy initialization on user interaction
  }

  public async init(): Promise<void> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master Limiter to avoid digital harsh clipping
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-2, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(6, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(16, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.limiter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Reverb routing
      this.reverbNode = this.ctx.createConvolver();
      this.reverbGain = this.ctx.createGain();
      this.dryGain = this.ctx.createGain();

      this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.reverbGain.gain.setValueAtTime(0.55, this.ctx.currentTime);

      this.dryGain.connect(this.limiter);
      this.reverbNode.connect(this.reverbGain);
      this.reverbGain.connect(this.limiter);

      // Ambience gain
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.ambienceGain.connect(this.limiter);

      await this.updateReverbImpulse(this.currentReverb);
      this.startAmbience(this.currentAmbience);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setMaterial(material: ChimeMaterial): void {
    this.currentMaterial = material;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public async setReverb(env: ReverbEnvironment): Promise<void> {
    this.currentReverb = env;
    if (this.ctx) {
      await this.updateReverbImpulse(env);
    }
  }

  public setAmbience(type: AmbienceType): void {
    this.currentAmbience = type;
    if (this.ctx) {
      this.startAmbience(type);
    }
  }

  /**
   * Generates synthetic acoustic impulse responses for lush, natural space acoustics.
   */
  private async updateReverbImpulse(env: ReverbEnvironment): Promise<void> {
    if (!this.ctx || !this.reverbNode) return;

    const rate = this.ctx.sampleRate;
    let lengthSeconds = 2.4;
    let decayFactor = 2.0;

    if (env === 'temple') {
      lengthSeconds = 4.8;
      decayFactor = 1.4;
      if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.1);
    } else if (env === 'garden') {
      lengthSeconds = 1.6;
      decayFactor = 3.2;
      if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.1);
    } else {
      // porch
      lengthSeconds = 2.5;
      decayFactor = 2.2;
      if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.1);
    }

    const length = Math.floor(rate * lengthSeconds);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Filtered noise with early discrete reflections and diffuse exponential tail
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.exp(-t * decayFactor);
      
      // Early reflection cluster simulation
      let reflection = 0;
      if (i < 2400) {
        if (i === 120 || i === 340 || i === 680 || i === 1240 || i === 1920) {
          reflection = 0.5 * (1 - i / 2400);
        }
      }

      // Air absorption lowpass smoothing
      const noiseL = (Math.random() * 2 - 1) * envelope + reflection;
      const noiseR = (Math.random() * 2 - 1) * envelope - reflection * 0.8;

      left[i] = noiseL;
      right[i] = noiseR;
    }

    this.reverbNode.buffer = impulse;
  }

  /**
   * Natural generative background soundscapes (gentle evening crickets & breeze, stream, etc.)
   */
  private startAmbience(type: AmbienceType): void {
    if (!this.ctx || !this.ambienceGain) return;

    // Clean up existing ambience
    if (this.ambienceTimer) {
      window.clearInterval(this.ambienceTimer);
      this.ambienceTimer = null;
    }
    this.ambienceSourceNodes.forEach(node => {
      if (typeof node === 'object' && 'stop' in node) {
        try {
          (node as AudioScheduledSourceNode).stop();
        } catch {
          // ignore
        }
      }
    });
    this.ambienceSourceNodes = [];

    if (type === 'none') {
      this.ambienceGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      return;
    }

    this.ambienceGain.gain.setTargetAtTime(0.24, this.ctx.currentTime, 0.5);

    if (type === 'breeze') {
      this.createBreezeAmbiance();
    } else if (type === 'evening') {
      this.createEveningAmbiance();
    } else if (type === 'stream') {
      this.createStreamAmbiance();
    }
  }

  private createBreezeAmbiance(): void {
    if (!this.ctx || !this.ambienceGain) return;

    // Pink noise generator for gentle breeze
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Sweeping bandpass filter to simulate wind swelling
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // LFO for breeze modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(this.ambienceGain);

    noiseSource.start();
    lfo.start();

    this.ambienceSourceNodes.push(noiseSource, lfo);
  }

  private createEveningAmbiance(): void {
    // Combination of warm soft breeze + distant gentle crickets
    this.createBreezeAmbiance();

    if (!this.ctx || !this.ambienceGain) return;

    // Periodic gentle cricket pulses
    const triggerCricket = () => {
      if (!this.ctx || !this.ambienceGain || this.isMuted) return;
      const cricketOsc = this.ctx.createOscillator();
      const cricketGain = this.ctx.createGain();
      const cricketFilter = this.ctx.createBiquadFilter();

      cricketOsc.type = 'sine';
      cricketOsc.frequency.setValueAtTime(4600 + Math.random() * 400, this.ctx.currentTime);

      cricketFilter.type = 'bandpass';
      cricketFilter.frequency.setValueAtTime(4700, this.ctx.currentTime);
      cricketFilter.Q.setValueAtTime(8, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      cricketGain.gain.setValueAtTime(0, now);
      
      // 3 or 4 subtle chirps
      const chirps = 3;
      for (let c = 0; c < chirps; c++) {
        const start = now + c * 0.05;
        cricketGain.gain.setValueAtTime(0, start);
        cricketGain.gain.linearRampToValueAtTime(0.015, start + 0.015);
        cricketGain.gain.linearRampToValueAtTime(0, start + 0.035);
      }

      cricketOsc.connect(cricketFilter);
      cricketFilter.connect(cricketGain);
      cricketGain.connect(this.ambienceGain);

      cricketOsc.start(now);
      cricketOsc.stop(now + 0.25);
    };

    this.ambienceTimer = window.setInterval(() => {
      if (Math.random() < 0.6) {
        triggerCricket();
      }
    }, 1800);
  }

  private createStreamAmbiance(): void {
    if (!this.ctx || !this.ambienceGain) return;

    // Filtered pink noise simulating trickling water
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(280, this.ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(this.ambienceGain);

    noiseSource.start();
    this.ambienceSourceNodes.push(noiseSource);
  }

  /**
   * Play a chime note with physical modal acoustics.
   * @param freq Fundamental frequency of the tube
   * @param velocity Strike speed / impact strength (0.1 to 1.0)
   * @param pan Stereo panning from -1.0 (far left) to 1.0 (far right)
   */
  public strikeChime(freq: number, velocity: number = 0.6, pan: number = 0): void {
    if (!this.ctx || !this.dryGain || !this.reverbNode) {
      // Engine not initialized yet
      this.init().then(() => this.strikeChime(freq, velocity, pan));
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const normVel = Math.max(0.15, Math.min(1.0, velocity));

    // Stereo Panner
    let panner: StereoPannerNode | GainNode;
    if (this.ctx.createStereoPanner) {
      const sp = this.ctx.createStereoPanner();
      sp.pan.setValueAtTime(Math.max(-0.9, Math.min(0.9, pan)), now);
      sp.connect(this.dryGain);
      sp.connect(this.reverbNode);
      panner = sp;
    } else {
      panner = this.dryGain;
    }

    // Material Acoustic Parameters
    const mat = this.currentMaterial;

    if (mat === 'bamboo') {
      this.playBambooChime(freq, normVel, now, panner);
    } else if (mat === 'glass') {
      this.playGlassChime(freq, normVel, now, panner);
    } else if (mat === 'bronze') {
      this.playBronzeChime(freq, normVel, now, panner);
    } else if (mat === 'furin') {
      this.playFurinBell(freq, normVel, now, panner);
    } else {
      // Default: High-grade tubular aluminum / celestial silver
      this.playAluminumChime(freq, normVel, now, panner);
    }
  }

  /**
   * Aluminum / Silver Chime Tube:
   * Euler-Bernoulli beam modal overtones (f0, 2.756*f0, 5.404*f0, 8.933*f0)
   * Plus asymmetric split mode (f0 + 0.8Hz) for natural acoustic beating shimmer.
   */
  private playAluminumChime(freq: number, vel: number, now: number, out: AudioNode): void {
    if (!this.ctx) return;

    // Decay times (seconds)
    const decay = 5.5 + (1 / (freq / 400)) * 2.2;
    const gainScale = vel * 0.42;

    // 1. Strike transient (wooden/acrylic mallet click)
    this.playMalletClick(freq, vel, now, out, 0.018, 1800);

    // 2. Modal Partial definitions: [frequency multiplier, relative amplitude, decay multiplier]
    const modes = [
      { ratio: 1.0, amp: 1.0, decayMult: 1.0 },
      // Split mode for gentle acoustic beating (characteristic tubular chorus)
      { ratio: (freq + 0.75) / freq, amp: 0.78, decayMult: 0.95 },
      { ratio: 2.756, amp: 0.48, decayMult: 0.55 },
      { ratio: 5.404, amp: 0.18, decayMult: 0.32 },
      { ratio: 8.933, amp: 0.06, decayMult: 0.18 },
    ];

    modes.forEach(({ ratio, amp, decayMult }) => {
      if (!this.ctx) return;
      const modalFreq = freq * ratio;
      if (modalFreq > 18000) return; // avoid aliasing

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(modalFreq, now);

      const peakGain = amp * gainScale;
      const partDecay = Math.max(0.4, decay * decayMult);

      gain.gain.setValueAtTime(0.0001, now);
      // Fast attack
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.004);
      // Realistic exponential decay
      gain.gain.exponentialRampToValueAtTime(0.0001, now + partDecay);

      osc.connect(gain);
      gain.connect(out);

      osc.start(now);
      osc.stop(now + partDecay + 0.05);
    });
  }

  /**
   * Deep Tibetan / Temple Bronze Chime:
   * Richer lower harmonics, longer warm fundamental sustain, subtle gong undertone.
   */
  private playBronzeChime(freq: number, vel: number, now: number, out: AudioNode): void {
    if (!this.ctx) return;

    const baseFreq = freq * 0.75; // Lower fundamental feel
    const decay = 7.5 + (1 / (baseFreq / 300)) * 3.0;
    const gainScale = vel * 0.48;

    // Heavier soft-headed mallet click
    this.playMalletClick(baseFreq, vel, now, out, 0.026, 950);

    const modes = [
      { ratio: 1.0, amp: 1.0, decayMult: 1.0 },
      // Asymmetric beating mode
      { ratio: (baseFreq + 0.55) / baseFreq, amp: 0.85, decayMult: 0.96 },
      { ratio: 1.98, amp: 0.35, decayMult: 0.70 },
      { ratio: 2.756, amp: 0.55, decayMult: 0.60 },
      { ratio: 4.12, amp: 0.22, decayMult: 0.40 },
      { ratio: 5.404, amp: 0.16, decayMult: 0.28 },
    ];

    modes.forEach(({ ratio, amp, decayMult }) => {
      if (!this.ctx) return;
      const modalFreq = baseFreq * ratio;
      if (modalFreq > 18000) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(modalFreq, now);

      const peakGain = amp * gainScale;
      const partDecay = Math.max(0.5, decay * decayMult);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + partDecay);

      osc.connect(gain);
      gain.connect(out);

      osc.start(now);
      osc.stop(now + partDecay + 0.05);
    });
  }

  /**
   * Kyoto Bamboo Chime:
   * Woody, hollow Helmholtz resonance, fast organic decay, warm wooden clatter.
   */
  private playBambooChime(freq: number, vel: number, now: number, out: AudioNode): void {
    if (!this.ctx) return;

    const decay = 1.1 + Math.random() * 0.3;
    const gainScale = vel * 0.55;

    // Wood-on-wood impact clatter
    this.playMalletClick(freq, vel * 1.3, now, out, 0.035, 650);

    // Bamboo has hollow cylinder column resonance + wood flex modes
    const modes = [
      { ratio: 1.0, amp: 0.9, decayMult: 1.0 },
      { ratio: 1.48, amp: 0.6, decayMult: 0.7 },
      { ratio: 2.12, amp: 0.3, decayMult: 0.5 },
      { ratio: 3.05, amp: 0.15, decayMult: 0.3 },
    ];

    modes.forEach(({ ratio, amp, decayMult }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Triangle / sine blend for woody warmth
      osc.type = ratio === 1.0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * ratio, now);

      const peakGain = amp * gainScale;
      const partDecay = decay * decayMult;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + partDecay);

      osc.connect(gain);
      gain.connect(out);

      osc.start(now);
      osc.stop(now + partDecay + 0.03);
    });
  }

  /**
   * Bohemian Glass / Crystal Wind Chime:
   * Pure crystalline high-frequency ring, sparkling delicate harmonics.
   */
  private playGlassChime(freq: number, vel: number, now: number, out: AudioNode): void {
    if (!this.ctx) return;

    // Up an octave feel for crystalline purity
    const glassFreq = freq * 1.5;
    const decay = 4.2 + (1 / (glassFreq / 800)) * 1.5;
    const gainScale = vel * 0.36;

    // Glass click transient
    this.playMalletClick(glassFreq * 1.5, vel * 0.9, now, out, 0.012, 3800);

    const modes = [
      { ratio: 1.0, amp: 1.0, decayMult: 1.0 },
      { ratio: 2.29, amp: 0.45, decayMult: 0.6 },
      { ratio: 4.15, amp: 0.25, decayMult: 0.35 },
      { ratio: 6.8, amp: 0.1, decayMult: 0.2 },
    ];

    modes.forEach(({ ratio, amp, decayMult }) => {
      if (!this.ctx) return;
      const modalFreq = glassFreq * ratio;
      if (modalFreq > 19000) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(modalFreq, now);

      const peakGain = amp * gainScale;
      const partDecay = Math.max(0.3, decay * decayMult);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + partDecay);

      osc.connect(gain);
      gain.connect(out);

      osc.start(now);
      osc.stop(now + partDecay + 0.05);
    });
  }

  /**
   * Japanese Fūrin Wind Bell (Cast iron / Porcelain):
   * Singular bell chime with clear fundamental and lingering pure overtone ring.
   */
  private playFurinBell(freq: number, vel: number, now: number, out: AudioNode): void {
    if (!this.ctx) return;

    const bellFreq = freq * 1.25;
    const decay = 6.0;
    const gainScale = vel * 0.45;

    this.playMalletClick(bellFreq, vel, now, out, 0.015, 2400);

    const modes = [
      { ratio: 1.0, amp: 1.0, decayMult: 1.0 },
      { ratio: (bellFreq + 1.2) / bellFreq, amp: 0.7, decayMult: 0.9 },
      { ratio: 2.95, amp: 0.5, decayMult: 0.5 },
      { ratio: 5.8, amp: 0.2, decayMult: 0.25 },
    ];

    modes.forEach(({ ratio, amp, decayMult }) => {
      if (!this.ctx) return;
      const modalFreq = bellFreq * ratio;
      if (modalFreq > 19000) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(modalFreq, now);

      const peakGain = amp * gainScale;
      const partDecay = Math.max(0.4, decay * decayMult);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + partDecay);

      osc.connect(gain);
      gain.connect(out);

      osc.start(now);
      osc.stop(now + partDecay + 0.05);
    });
  }

  /**
   * Mallet Strike Transient:
   * Generates a short filtered burst representing the physical impact of the wooden/acrylic clapper.
   */
  private playMalletClick(
    freq: number,
    vel: number,
    now: number,
    out: AudioNode,
    duration: number = 0.02,
    centerFreq: number = 1800
  ): void {
    if (!this.ctx) return;

    const clickLen = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, clickLen, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < clickLen; i++) {
      const envelope = Math.exp(-i / (clickLen * 0.25));
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.35, now);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);

    source.start(now);
    source.stop(now + duration + 0.01);
  }
}

// Global Singleton for the audio engine
export const chimeAudio = new ChimeAudioEngine();
