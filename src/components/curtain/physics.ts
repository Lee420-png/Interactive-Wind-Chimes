/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParticleNode {
  x: number;
  y: number;
  px: number; // Previous x (for Verlet integration)
  py: number; // Previous y
  targetRestX: number; // Anchor x
  targetRestY: number; // Rest y
}

export interface Strand {
  id: number;
  pinX: number;
  pinY: number;
  totalLength: number;
  segmentLength: number;
  nodes: ParticleNode[];
  glyphs: string[];
  phaseOffset: number; // Unique timing offset for breeze & ripple
  lastStruckTime: number; // Cooldown per individual strand
}

export class CurtainPhysicsEngine {
  public strands: Strand[] = [];
  public width: number = 0;
  public height: number = 0;
  public nodesPerStrand: number = 16;
  public strandSpacing: number = 20;
  public isSettled: boolean = false;
  public lastAffectedStrandsCount: number = 0;

  // Kinetic energy tracker for sleeping/settling
  private totalEnergy: number = 1.0;
  private readonly settleEnergyThreshold: number = 0.0006;

  constructor() {}

  /**
   * Initializes or reconfigures the strands grid
   */
  public initStrands(
    width: number,
    height: number,
    strandCount: number,
    glyphsPerStrand: number,
    glyphSet: string,
    topY: number = 40,
    curtainHeight?: number,
    lengthJitter: number = 0.08,
    customStrandWidth?: number,
    startXOffset?: number
  ): void {
    this.width = width;
    this.height = height;
    this.nodesPerStrand = 16;

    const actualCurtainHeight = curtainHeight || height * 0.78;
    const effectiveWidth = customStrandWidth || width * 0.7;
    const startX = startXOffset !== undefined ? startXOffset : (width - effectiveWidth) / 2;
    const spacing = strandCount > 1 ? effectiveWidth / (strandCount - 1) : 20;
    this.strandSpacing = spacing;

    const glyphChars = Array.from(glyphSet.length > 0 ? glyphSet : '✦✧❖⬡◈◇⊛⊕');
    this.strands = [];

    for (let s = 0; s < strandCount; s++) {
      const pinX = startX + s * spacing;
      const pinY = topY;

      // Slight natural variation in strand bottom length
      const lengthVariation = 1.0 + (Math.sin(s * 1.7) * 0.5 + Math.cos(s * 3.1) * 0.5) * lengthJitter;
      const totalLength = actualCurtainHeight * lengthVariation;
      const segmentLength = totalLength / (this.nodesPerStrand - 1);

      // Assign stable characters to this strand
      const strandGlyphs: string[] = [];
      for (let g = 0; g < glyphsPerStrand; g++) {
        const charIndex = Math.abs(Math.sin(s * 73 + g * 37) * 10000) % glyphChars.length;
        strandGlyphs.push(glyphChars[Math.floor(charIndex)]);
      }

      const nodes: ParticleNode[] = [];
      for (let n = 0; n < this.nodesPerStrand; n++) {
        const ny = pinY + n * segmentLength;
        nodes.push({
          x: pinX,
          y: ny,
          px: pinX,
          py: ny,
          targetRestX: pinX,
          targetRestY: ny,
        });
      }

      this.strands.push({
        id: s,
        pinX,
        pinY,
        totalLength,
        segmentLength,
        nodes,
        glyphs: strandGlyphs,
        phaseOffset: Math.sin(s * 0.85) * 1.5,
        lastStruckTime: 0,
      });
    }

    this.isSettled = false;
    this.totalEnergy = 1.0;
    this.lastAffectedStrandsCount = 0;
  }

  /**
   * Advances the simulation using Verlet integration and distance constraints
   */
  public update(
    dt: number,
    time: number,
    pointer: { x: number; y: number; vx: number; vy: number; active: boolean },
    params: {
      gravity: number;
      damping: number;
      stiffness: number;
      interactionRadius: number;
      interactionStrength: number;
      breezeStrength: number;
    },
    reducedMotion: boolean = false,
    onStrandHit?: (strandIndex: number, totalStrands: number, velocity: number, normX: number) => void
  ): void {
    // If settled and pointer is inactive, skip math to save CPU
    if (this.isSettled && !pointer.active && params.breezeStrength <= 0.01) {
      return;
    }

    const clampedDt = Math.min(0.033, Math.max(0.008, dt));
    const effectiveDamping = reducedMotion ? 0.86 : Math.min(0.985, Math.max(0.92, params.damping));
    const effectiveBreeze = reducedMotion ? 0 : params.breezeStrength;
    const motionScale = reducedMotion ? 0.4 : 1.0;

    const interactionRadius = Math.max(40, params.interactionRadius || 90);
    const interactionRadiusSq = interactionRadius * interactionRadius;
    const pointerSpeed = Math.hypot(pointer.vx, pointer.vy);

    let currentStepEnergy = 0;
    let affectedCount = 0;

    for (let sIdx = 0; sIdx < this.strands.length; sIdx++) {
      const strand = this.strands[sIdx];
      const nodes = strand.nodes;
      let strandAffected = false;

      // 1. Verlet integration & force accumulation
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const depthRatio = i / (nodes.length - 1); // 0 at top, 1 at bottom

        const vx = (node.x - node.px) * effectiveDamping;
        const vy = (node.y - node.py) * effectiveDamping;

        currentStepEnergy += vx * vx + vy * vy;

        // Downward gravity and elastic restoring tension towards vertical rest
        let fx = (node.targetRestX - node.x) * (params.gravity * 36.0);
        let fy = params.gravity * 28.0 * depthRatio;

        // Ambient subtle breeze (only sways lower parts, top stays still)
        if (effectiveBreeze > 0) {
          const breezeWave =
            Math.sin(time * 0.0018 + strand.phaseOffset + depthRatio * 1.5) * 0.6 +
            Math.sin(time * 0.0032 + sIdx * 0.15) * 0.4;
          fx += breezeWave * effectiveBreeze * 35.0 * (depthRatio * depthRatio);
        }

        // Pointer lateral curtain-parting interaction (natural doorway parting)
        if (pointer.active) {
          const dxToPin = strand.pinX - pointer.x;
          const dxToNode = node.x - pointer.x;
          const dyToNode = node.y - pointer.y;

          const normDistX = Math.abs(dxToNode) / interactionRadius;
          const normDistY = Math.abs(dyToNode) / (interactionRadius * 1.15);
          const distSq = normDistX * normDistX + normDistY * normDistY;

          if (distSq < 1.0) {
            strandAffected = true;
            const dist = Math.sqrt(distSq);
            // Smooth cosine falloff: drops to exactly 0 at boundary with zero hard edges
            const falloff = 0.5 * (1 + Math.cos(dist * Math.PI));

            // Parting direction: smoothly parts curtain to left or right based on anchor side
            const partingSign = dxToPin < -2 ? -1 : dxToPin > 2 ? 1 : (dxToNode >= 0 ? 1 : -1);

            // Natural lateral parting push force
            const pushMagnitude =
              params.interactionStrength * falloff * 2600.0 * (0.25 + depthRatio * 0.75) * motionScale;

            fx += partingSign * pushMagnitude;

            // Pointer sweep velocity drag along cursor movement direction
            if (pointerSpeed > 0.01) {
              const sweepMagnitude = Math.min(1800, pointerSpeed * 240.0) * falloff * motionScale;
              fx += (pointer.vx / (pointerSpeed + 0.001)) * sweepMagnitude;
              // Gentle downward drag if pointer moves down (never upward compression)
              if (pointer.vy > 0) {
                fy += (pointer.vy / (pointerSpeed + 0.001)) * sweepMagnitude * 0.08;
              }
            }
          }
        }

        // Bound forces to prevent extreme velocity spikes
        const maxForce = 6500;
        const forceMag = Math.hypot(fx, fy);
        if (forceMag > maxForce) {
          fx = (fx / forceMag) * maxForce;
          fy = (fy / forceMag) * maxForce;
        }

        // Update positions using Verlet integration
        const nextX = node.x + vx + fx * (clampedDt * clampedDt);
        const nextY = node.y + vy + fy * (clampedDt * clampedDt);

        node.px = node.x;
        node.py = node.y;
        node.x = nextX;
        node.y = nextY;
      }

      if (strandAffected) {
        affectedCount++;

        // Trigger chime for this specific chain if cooldown has elapsed!
        if (pointer.active && time - strand.lastStruckTime > 120) {
          strand.lastStruckTime = time;
          const strikeVelocity = Math.max(0.35, Math.min(1.0, pointerSpeed * 0.5 + 0.35));
          const normX = this.width > 0 ? strand.pinX / this.width : sIdx / this.strands.length;
          onStrandHit?.(sIdx, this.strands.length, strikeVelocity, normX);
        }
      }

      // 2. Distance Constraints solver (maintains inextensible cord length)
      const iterations = Math.max(3, Math.min(5, Math.round(params.stiffness) + 1));
      for (let iter = 0; iter < iterations; iter++) {
        // Pin top node strictly at suspension point
        nodes[0].x = strand.pinX;
        nodes[0].y = strand.pinY;

        for (let i = 0; i < nodes.length - 1; i++) {
          const n1 = nodes[i];
          const n2 = nodes[i + 1];

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const currentDist = Math.hypot(dx, dy) || 0.001;

          const diff = (currentDist - strand.segmentLength) / currentDist;

          if (i === 0) {
            n2.x -= dx * diff;
            n2.y -= dy * diff;
          } else {
            const correctionX = dx * 0.5 * diff;
            const correctionY = dy * 0.5 * diff;
            n1.x += correctionX;
            n1.y += correctionY;
            n2.x -= correctionX;
            n2.y -= correctionY;
          }
        }
      }
    }

    // 3. Inter-Strand Separation & Anti-Jamming Pass
    // Ensures neighboring strands cannot pass through each other or pile into a crescent
    const minStrandGap = Math.max(6, this.strandSpacing * 0.45);
    for (let pass = 0; pass < 2; pass++) {
      for (let s = 0; s < this.strands.length - 1; s++) {
        const s1 = this.strands[s];
        const s2 = this.strands[s + 1];
        for (let i = 1; i < this.nodesPerStrand; i++) {
          const n1 = s1.nodes[i];
          const n2 = s2.nodes[i];
          const currentGap = n2.x - n1.x;
          if (currentGap < minStrandGap) {
            const pushApart = (minStrandGap - currentGap) * 0.5;
            n1.x -= pushApart;
            n2.x += pushApart;
          }
        }
      }
    }

    this.lastAffectedStrandsCount = affectedCount;

    // Energy monitoring for settling
    this.totalEnergy = this.totalEnergy * 0.95 + currentStepEnergy * 0.05;
    this.isSettled = this.totalEnergy < this.settleEnergyThreshold && !pointer.active;
  }

  /**
   * Applies an obvious, controlled impulse ripple at (centerX, centerY)
   */
  public applyRipple(
    centerX: number,
    centerY: number,
    strength: number = 38,
    onStrandHit?: (strandIndex: number, totalStrands: number, velocity: number, normX: number) => void
  ): void {
    const radius = 240;
    const radiusSq = radius * radius;
    let count = 0;

    for (let sIdx = 0; sIdx < this.strands.length; sIdx++) {
      const strand = this.strands[sIdx];
      let hit = false;
      for (let i = 1; i < strand.nodes.length; i++) {
        const node = strand.nodes[i];
        const dx = node.x - centerX;
        const dy = node.y - centerY;
        const dSq = dx * dx + dy * dy;

        if (dSq < radiusSq) {
          hit = true;
          const d = Math.sqrt(dSq);
          const factor = (1 - d / radius) * (i / strand.nodes.length);
          const sign = dx >= 0 ? 1 : -1;
          node.x += sign * strength * factor;
        }
      }
      if (hit) {
        count++;
        // Play chime note for strands touched by ripple, staggered slightly
        if (count % 3 === 0) {
          const normX = this.width > 0 ? strand.pinX / this.width : sIdx / this.strands.length;
          onStrandHit?.(sIdx, this.strands.length, 0.7, normX);
        }
      }
    }

    this.lastAffectedStrandsCount = count;
    this.isSettled = false;
    this.totalEnergy = 1.0;
  }
}
