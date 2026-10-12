/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { chimeAudio, ChimeMaterial, ChimeNote, ChimeScale } from '../audio/chimeAudio';

interface ChimesCanvasProps {
  scale: ChimeScale;
  material: ChimeMaterial;
  windStrength: number; // 0 to 1
  windGust: number; // 0 to 1
  interactivityMode: 'sweep' | 'pluck';
  onChimeStruck?: (note: string, freq: number) => void;
}

interface TubePhysics {
  index: number;
  note: ChimeNote;
  angle: number; // swing angle in radians
  angVel: number; // angular velocity
  activeRipples: { yRatio: number; radius: number; opacity: number; color: string }[];
  lastStrikeTime: number;
  resonanceEnergy: number; // 0 to 1
  isHovered: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  type: 'petal' | 'mote';
}

interface WindStreak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
}

export const ChimesCanvas: React.FC<ChimesCanvasProps> = ({
  scale,
  material,
  windStrength,
  windGust,
  interactivityMode,
  onChimeStruck,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clapper & Sail physics
  const clapperRef = useRef({
    angleX: 0,
    angleY: 0,
    velX: 0,
    velY: 0,
    radius: 28,
  });

  const sailRef = useRef({
    angleX: 0,
    angleY: 0,
    velX: 0,
    velY: 0,
  });

  // Tubes state
  const tubesRef = useRef<TubePhysics[]>([]);

  // Mouse tracking
  const mouseRef = useRef({
    x: -1000,
    y: -1000,
    prevX: -1000,
    prevY: -1000,
    vx: 0,
    vy: 0,
    speed: 0,
    isDown: false,
    draggedTube: -1,
    draggedSail: false,
    lastTime: performance.now(),
  });

  // Breeze streaks & drifting environmental particles
  const particlesRef = useRef<Particle[]>([]);
  const windStreaksRef = useRef<WindStreak[]>([]);
  const breezeTrailsRef = useRef<{ x: number; y: number; alpha: number; radius: number }[]>([]);

  const [activeNoteNotification, setActiveNoteNotification] = useState<{ note: string; freq: number } | null>(null);

  // Initialize or update tubes when scale changes
  useEffect(() => {
    tubesRef.current = scale.notes.map((note, index) => ({
      index,
      note,
      angle: 0,
      angVel: 0,
      activeRipples: [],
      lastStrikeTime: 0,
      resonanceEnergy: 0,
      isHovered: false,
    }));
  }, [scale]);

  // Trigger audio strike helper
  const triggerTubeStrike = useCallback((index: number, velocity: number = 0.6) => {
    const tube = tubesRef.current[index];
    if (!tube) return;

    const now = performance.now();
    // Debounce very rapid multi-triggers on the exact same tube (50ms minimum gap)
    if (now - tube.lastStrikeTime < 50) return;
    tube.lastStrikeTime = now;

    // Calculate stereo pan based on tube position (-0.8 to +0.8)
    const total = scale.notes.length;
    const pan = ((index / (total - 1)) * 2 - 1) * 0.75;

    chimeAudio.strikeChime(tube.note.freq, velocity, pan);
    tube.resonanceEnergy = Math.min(1.0, tube.resonanceEnergy + velocity);

    // Add visual sound ripple
    tube.activeRipples.push({
      yRatio: 0.55,
      radius: 4,
      opacity: 0.9,
      color: material === 'bamboo' ? '#d97706' : material === 'bronze' ? '#f59e0b' : '#38bdf8',
    });

    setActiveNoteNotification({ note: tube.note.note, freq: Math.round(tube.note.freq) });
    if (onChimeStruck) {
      onChimeStruck(tube.note.note, tube.note.freq);
    }
  }, [scale, material, onChimeStruck]);

  // Main animation and physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Spawn ambient particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 40; i++) {
        particlesRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: 0.2 + Math.random() * 0.5,
          vy: 0.1 + Math.random() * 0.3,
          size: 2 + Math.random() * 4,
          alpha: 0.2 + Math.random() * 0.5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.04,
          type: Math.random() > 0.4 ? 'mote' : 'petal',
        });
      }
    }

    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Center coordinates for chimes hanging
      const centerX = width * 0.5;
      const topPlateY = Math.max(70, height * 0.16);
      const chimeRadius = Math.min(width * 0.22, 175);
      const chimeRadiusY = chimeRadius * 0.38; // Perspective tilt

      // Ambient Wind Force Calculation
      const windBase = (windStrength * 1.5 + windGust * 3.5);
      const windTurbulence = Math.sin(time * 0.0018) * 0.4 + Math.sin(time * 0.0035 + 1.2) * 0.25;
      const effectiveWindX = (windBase + windTurbulence * windBase) * 0.8;

      // Mouse speed & air disturbance (cursor breeze field)
      const mouse = mouseRef.current;
      const nowMs = performance.now();
      const mouseDt = Math.max(1, nowMs - mouse.lastTime);
      mouse.vx = (mouse.x - mouse.prevX) / mouseDt;
      mouse.vy = (mouse.y - mouse.prevY) / mouseDt;
      mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.lastTime = nowMs;

      // Add mouse breeze trails when moving
      if (mouse.speed > 0.15 && mouse.x > 0 && mouse.y > 0) {
        breezeTrailsRef.current.push({
          x: mouse.x,
          y: mouse.y,
          alpha: Math.min(0.6, mouse.speed * 0.2),
          radius: 12 + Math.min(30, mouse.speed * 8),
        });
      }

      // Update and render breeze trails
      for (let i = breezeTrailsRef.current.length - 1; i >= 0; i--) {
        const tr = breezeTrailsRef.current[i];
        tr.alpha -= dt * 1.4;
        tr.radius += dt * 35;
        if (tr.alpha <= 0) {
          breezeTrailsRef.current.splice(i, 1);
          continue;
        }

        const gradient = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, tr.radius);
        gradient.addColorStop(0, `rgba(240, 249, 255, ${tr.alpha * 0.3})`);
        gradient.addColorStop(0.6, `rgba(186, 230, 253, ${tr.alpha * 0.15})`);
        gradient.addColorStop(1, 'rgba(186, 230, 253, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, tr.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. Hanging cord from ceiling
      ctx.save();
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, topPlateY - 20);
      ctx.stroke();

      // Top Hanging Ring
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, topPlateY - 20, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Suspension strings down to the wooden top plate
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#a8a29e';
      ctx.beginPath();
      ctx.moveTo(centerX, topPlateY - 12);
      ctx.lineTo(centerX - chimeRadius * 0.7, topPlateY);
      ctx.moveTo(centerX, topPlateY - 12);
      ctx.lineTo(centerX + chimeRadius * 0.7, topPlateY);
      ctx.moveTo(centerX, topPlateY - 12);
      ctx.lineTo(centerX, topPlateY + 4);
      ctx.stroke();

      // Top suspension plate (wooden/bronze disc)
      const discGrad = ctx.createRadialGradient(centerX, topPlateY, 10, centerX, topPlateY, chimeRadius);
      if (material === 'bamboo') {
        discGrad.addColorStop(0, '#78350f');
        discGrad.addColorStop(0.7, '#451a03');
        discGrad.addColorStop(1, '#290e02');
      } else if (material === 'bronze') {
        discGrad.addColorStop(0, '#b45309');
        discGrad.addColorStop(0.7, '#78350f');
        discGrad.addColorStop(1, '#451a03');
      } else {
        discGrad.addColorStop(0, '#57534e');
        discGrad.addColorStop(0.7, '#292524');
        discGrad.addColorStop(1, '#1c1917');
      }

      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, topPlateY, chimeRadius * 0.9, chimeRadiusY * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = material === 'bronze' ? '#d97706' : '#a8a29e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Clapper & Wind Catcher Physics
      const clapper = clapperRef.current;
      const sail = sailRef.current;
      const clapperLength = 170;
      const sailLength = 340;

      // Sail receives ambient wind + cursor air push
      const sailDistToMouse = Math.hypot(mouse.x - centerX, mouse.y - (topPlateY + sailLength));
      let cursorPushSailX = 0;
      if (sailDistToMouse < 180 && mouse.speed > 0.05) {
        cursorPushSailX = mouse.vx * 0.08 * (1 - sailDistToMouse / 180);
      }

      // Sail pendulum dynamics
      const sailRestoringX = -Math.sin(sail.angleX) * 14;
      const sailDamping = 0.982;
      sail.velX += (sailRestoringX + effectiveWindX * 3.8 + cursorPushSailX) * dt;
      sail.velX *= sailDamping;
      sail.angleX += sail.velX * dt;

      // Clapper receives momentum from sail via the cord + ambient wind
      const clapperRestoringX = -Math.sin(clapper.angleX) * 18;
      const clapperDamping = 0.978;
      const clapperCordTug = (sail.angleX - clapper.angleX) * 7.5;
      clapper.velX += (clapperRestoringX + effectiveWindX * 1.5 + clapperCordTug) * dt;
      clapper.velX *= clapperDamping;
      clapper.angleX += clapper.velX * dt;

      // Compute clapper position
      const clapperX = centerX + Math.sin(clapper.angleX) * clapperLength;
      const clapperY = topPlateY + Math.cos(clapper.angleX) * clapperLength;

      // Compute sail position
      const sailX = centerX + Math.sin(sail.angleX) * sailLength;
      const sailY = topPlateY + Math.cos(sail.angleX) * sailLength;

      // Tubes array data setup & depth sorting (so back tubes render behind clapper, front tubes in front)
      const tubes = tubesRef.current;
      const totalTubes = tubes.length;

      const tubeVisuals = tubes.map((tube, i) => {
        // Arrange around the elliptical suspension ring
        const theta = (i / totalTubes) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Position on top suspension rim
        const anchorX = centerX + cosT * chimeRadius * 0.72;
        const anchorY = topPlateY + sinT * chimeRadiusY * 0.72;

        // Tube physical length based on pitch ratio
        const baseTubeLength = Math.min(height * 0.38, 260);
        const tubeLength = baseTubeLength * (tube.note.lengthRatio || 0.8);
        const tubeWidth = Math.max(16, Math.min(26, width * 0.024));

        // Tube pendulum physics
        // Damping and restoring
        const tubeRestoring = -Math.sin(tube.angle) * 22;
        const tubeDamping = 0.965;

        // Mouse hover interaction: detection of cursor crossing tube
        let mouseForce = 0;
        const tubeCurrX = anchorX + Math.sin(tube.angle) * (tubeLength * 0.5);
        const tubeTop = anchorY;
        const tubeBottom = anchorY + tubeLength;

        const isMouseNearX = Math.abs(mouse.x - tubeCurrX) < tubeWidth * 1.3;
        const isMouseInYRange = mouse.y >= tubeTop - 10 && mouse.y <= tubeBottom + 20;

        const wasHovered = tube.isHovered;
        const isHoveredNow = isMouseNearX && isMouseInYRange;
        tube.isHovered = isHoveredNow;

        // Strike on hover entry or moving fast across
        if (isHoveredNow) {
          if (!wasHovered || mouse.speed > 0.4) {
            const strikeVelocity = Math.max(0.25, Math.min(1.0, 0.3 + mouse.speed * 0.45));
            triggerTubeStrike(i, strikeVelocity);
            mouseForce = (mouse.vx || (Math.random() - 0.5) * 2) * 0.12;
          }
        }

        // Apply wind force
        const windOnTube = effectiveWindX * 0.35 * (1 + sinT * 0.2);

        // Clapper collision check with tube
        const clapperDistToTube = Math.hypot(clapperX - tubeCurrX, clapperY - (anchorY + tubeLength * 0.55));
        const strikeThreshold = clapper.radius + tubeWidth * 0.8;
        if (clapperDistToTube < strikeThreshold) {
          // Clapper hit!
          const relativeSpeed = Math.abs(clapper.velX - tube.angVel * 50);
          if (relativeSpeed > 0.4 && nowMs - tube.lastStrikeTime > 90) {
            const strikeVel = Math.max(0.2, Math.min(0.95, relativeSpeed * 0.1));
            triggerTubeStrike(i, strikeVel);

            // Rebound physics
            clapper.velX = -clapper.velX * 0.55;
            tube.angVel += clapper.velX * 0.04;
          }
        }

        // Update tube pendulum
        tube.angVel += (tubeRestoring + windOnTube + mouseForce) * dt;
        tube.angVel *= tubeDamping;
        tube.angle += tube.angVel * dt;

        // Decay resonance energy
        tube.resonanceEnergy = Math.max(0, tube.resonanceEnergy - dt * 0.25);

        return {
          tube,
          index: i,
          anchorX,
          anchorY,
          tubeLength,
          tubeWidth,
          depthZ: sinT, // For 3D ordering: negative = back, positive = front
          cosT,
          sinT,
        };
      });

      // Sort by depth (back to front)
      const sortedBackTubes = tubeVisuals.filter(t => t.depthZ <= 0).sort((a, b) => a.depthZ - b.depthZ);
      const sortedFrontTubes = tubeVisuals.filter(t => t.depthZ > 0).sort((a, b) => a.depthZ - b.depthZ);

      // Helper function to render an individual tube
      const renderTube = (item: typeof tubeVisuals[0]) => {
        const { tube, index, anchorX, anchorY, tubeLength, tubeWidth } = item;
        const angle = tube.angle;

        ctx.save();
        ctx.translate(anchorX, anchorY);
        ctx.rotate(angle);

        // Suspension cord for this tube
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 24);
        ctx.stroke();

        // Tube body
        const tubeX = -tubeWidth * 0.5;
        const tubeY = 24;
        const cornerR = tubeWidth * 0.2;

        // Shadow under tube
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.filter = 'blur(6px)';
        ctx.fillRect(tubeX + 4, tubeY + 4, tubeWidth, tubeLength);
        ctx.restore();

        // Tube material gradient
        const tubeGrad = ctx.createLinearGradient(tubeX, 0, tubeX + tubeWidth, 0);

        if (material === 'bamboo') {
          // Warm natural bamboo wood grain
          tubeGrad.addColorStop(0, '#78350f');
          tubeGrad.addColorStop(0.25, '#b45309');
          tubeGrad.addColorStop(0.5, '#d97706');
          tubeGrad.addColorStop(0.75, '#b45309');
          tubeGrad.addColorStop(1, '#451a03');
        } else if (material === 'bronze') {
          // Rich antique temple bronze
          tubeGrad.addColorStop(0, '#78350f');
          tubeGrad.addColorStop(0.2, '#b45309');
          tubeGrad.addColorStop(0.48, '#fbbf24');
          tubeGrad.addColorStop(0.7, '#d97706');
          tubeGrad.addColorStop(1, '#451a03');
        } else if (material === 'glass') {
          // Translucent crystalline glass
          tubeGrad.addColorStop(0, 'rgba(186, 230, 253, 0.55)');
          tubeGrad.addColorStop(0.3, 'rgba(240, 249, 255, 0.85)');
          tubeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
          tubeGrad.addColorStop(0.8, 'rgba(186, 230, 253, 0.6)');
          tubeGrad.addColorStop(1, 'rgba(125, 211, 252, 0.45)');
        } else if (material === 'furin') {
          // Japanese porcelain / glazed cast
          tubeGrad.addColorStop(0, '#334155');
          tubeGrad.addColorStop(0.3, '#94a3b8');
          tubeGrad.addColorStop(0.5, '#f1f5f9');
          tubeGrad.addColorStop(0.8, '#64748b');
          tubeGrad.addColorStop(1, '#1e293b');
        } else {
          // Celestial Aluminum / Brushed Silver
          tubeGrad.addColorStop(0, '#57534e');
          tubeGrad.addColorStop(0.22, '#a8a29e');
          tubeGrad.addColorStop(0.48, '#ffffff');
          tubeGrad.addColorStop(0.75, '#d6d3d1');
          tubeGrad.addColorStop(1, '#44403c');
        }

        // Draw tube body
        ctx.fillStyle = tubeGrad;
        ctx.beginPath();
        ctx.roundRect(tubeX, tubeY, tubeWidth, tubeLength, [cornerR, cornerR, 3, 3]);
        ctx.fill();

        // Border / rim
        ctx.strokeStyle = material === 'glass' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Suspension hole at nodal point (0.224 length)
        const holeY = tubeY + tubeLength * 0.16;
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(0, holeY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // If bamboo: draw bamboo nodes / joints
        if (material === 'bamboo') {
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2.5;
          const nodeY1 = tubeY + tubeLength * 0.35;
          const nodeY2 = tubeY + tubeLength * 0.72;
          ctx.beginPath();
          ctx.moveTo(tubeX, nodeY1);
          ctx.lineTo(tubeX + tubeWidth, nodeY1);
          ctx.moveTo(tubeX, nodeY2);
          ctx.lineTo(tubeX + tubeWidth, nodeY2);
          ctx.stroke();
        }

        // Glow when vibrating with sound resonance
        if (tube.resonanceEnergy > 0.05) {
          ctx.save();
          const glowAlpha = tube.resonanceEnergy * 0.45;
          ctx.shadowColor = material === 'bronze' ? '#f59e0b' : material === 'bamboo' ? '#d97706' : '#38bdf8';
          ctx.shadowBlur = 12 * tube.resonanceEnergy;
          ctx.strokeStyle = `rgba(255, 255, 255, ${glowAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(tubeX - 1, tubeY - 1, tubeWidth + 2, tubeLength + 2, cornerR);
          ctx.stroke();
          ctx.restore();
        }

        // Active sound ripples expanding along the tube
        for (let rIdx = tube.activeRipples.length - 1; rIdx >= 0; rIdx--) {
          const rip = tube.activeRipples[rIdx];
          rip.radius += dt * 45;
          rip.opacity -= dt * 1.1;

          if (rip.opacity <= 0) {
            tube.activeRipples.splice(rIdx, 1);
            continue;
          }

          ctx.save();
          ctx.strokeStyle = rip.color;
          ctx.globalAlpha = rip.opacity;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, tubeY + tubeLength * rip.yRatio, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Subtle Note Label at bottom of tube
        ctx.save();
        ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = tube.isHovered ? '#ffffff' : 'rgba(214, 211, 209, 0.65)';
        ctx.textAlign = 'center';
        ctx.fillText(tube.note.note, 0, tubeY + tubeLength + 14);
        ctx.restore();

        ctx.restore();
      };

      // 2. Render back tubes (behind central clapper)
      sortedBackTubes.forEach(renderTube);

      // 3. Render Central Suspension Cord, Wooden Clapper, and Wind Sail
      ctx.save();

      // Cord from top plate to clapper
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, topPlateY);
      ctx.lineTo(clapperX, clapperY);
      ctx.stroke();

      // Clapper Disc (wooden/acrylic round strike disc)
      ctx.save();
      ctx.translate(clapperX, clapperY);
      ctx.rotate(clapper.angleX * 0.8);

      const clapperGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, clapper.radius);
      if (material === 'bamboo') {
        clapperGrad.addColorStop(0, '#b45309');
        clapperGrad.addColorStop(1, '#451a03');
      } else if (material === 'bronze') {
        clapperGrad.addColorStop(0, '#d97706');
        clapperGrad.addColorStop(1, '#78350f');
      } else {
        clapperGrad.addColorStop(0, '#a8a29e');
        clapperGrad.addColorStop(0.7, '#57534e');
        clapperGrad.addColorStop(1, '#292524');
      }

      ctx.fillStyle = clapperGrad;
      ctx.beginPath();
      ctx.arc(0, 0, clapper.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Cord from clapper down to Wind Sail
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(clapperX, clapperY + clapper.radius);
      ctx.lineTo(sailX, sailY);
      ctx.stroke();

      // Wind Sail (Wind Catcher)
      ctx.save();
      ctx.translate(sailX, sailY);
      ctx.rotate(sail.angleX);

      // Shape: elegant curved wooden / parchment sail
      const sailWidth = 38;
      const sailHeight = 65;
      const sailGrad = ctx.createLinearGradient(-sailWidth * 0.5, 0, sailWidth * 0.5, sailHeight);

      if (material === 'furin') {
        // Japanese Tanzaku paper strip flutter
        sailGrad.addColorStop(0, '#fef08a');
        sailGrad.addColorStop(1, '#e11d48');
        ctx.fillStyle = sailGrad;
        ctx.fillRect(-12, 0, 24, 75);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(-12, 0, 24, 75);
      } else if (material === 'bamboo') {
        sailGrad.addColorStop(0, '#d97706');
        sailGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = sailGrad;
        ctx.beginPath();
        ctx.roundRect(-sailWidth * 0.5, 0, sailWidth, sailHeight, 8);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.stroke();
      } else {
        sailGrad.addColorStop(0, '#78716c');
        sailGrad.addColorStop(0.5, '#44403c');
        sailGrad.addColorStop(1, '#1c1917');
        ctx.fillStyle = sailGrad;
        ctx.beginPath();
        // Teardrop / leaf wind sail shape
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-sailWidth * 0.6, 20, -sailWidth * 0.6, sailHeight - 15, 0, sailHeight);
        ctx.bezierCurveTo(sailWidth * 0.6, sailHeight - 15, sailWidth * 0.6, 20, 0, 0);
        ctx.fill();
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();

      // 4. Render front tubes
      sortedFrontTubes.forEach(renderTube);

      // 5. Environmental particles (cherry blossom petals & drifting dust motes)
      const windSpeedNorm = effectiveWindX * 30;
      particlesRef.current.forEach(p => {
        p.x += (p.vx + windSpeedNorm * 0.05) * dt * 45;
        p.y += p.vy * dt * 35;
        p.rotation += p.rotSpeed;

        if (p.x > width + 20) p.x = -20;
        if (p.y > height + 20) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;

        if (p.type === 'petal') {
          // Soft pink blossom petal
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.5, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Golden dust mote
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [scale, material, windStrength, windGust, triggerTubeStrike]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse & Touch interaction handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current.x = x;
    mouseRef.current.y = y;

    // First user gesture triggers audio context activation
    chimeAudio.init();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    mouseRef.current.isDown = true;
    chimeAudio.init();

    // Check if clicked directly on the wind sail to give it a big pluck
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Stir sail or nearest tube
    sailRef.current.velX += (Math.random() - 0.5) * 6;
    clapperRef.current.velX += (Math.random() - 0.5) * 8;
  };

  const handlePointerUp = () => {
    mouseRef.current.isDown = false;
    mouseRef.current.draggedTube = -1;
  };

  const handlePointerLeave = () => {
    mouseRef.current.x = -1000;
    mouseRef.current.y = -1000;
    mouseRef.current.isDown = false;
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Floating strike note notification badge */}
      {activeNoteNotification && (
        <div
          key={activeNoteNotification.note + activeNoteNotification.freq}
          className="absolute bottom-6 left-6 pointer-events-none transition-all duration-300 flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-stone-900/80 backdrop-blur-md border border-stone-700/60 text-stone-200 text-xs shadow-xl"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span className="font-semibold text-white tracking-wide">{activeNoteNotification.note}</span>
          <span className="text-stone-400 font-mono text-[11px]">{activeNoteNotification.freq} Hz</span>
        </div>
      )}

      {/* Quick hover instructional hint on first entry */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 rounded-full bg-stone-900/40 backdrop-blur-sm border border-stone-800/60 text-stone-300 text-xs tracking-wider uppercase font-medium flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        Brush or hover cursor across tubes to chime
      </div>
    </div>
  );
};
