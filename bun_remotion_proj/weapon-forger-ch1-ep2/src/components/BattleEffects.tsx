import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { noise2D } from "@remotion/noise";

/**
 * Enhanced battle effects with more shape variety:
 *   <AnimatedLine>        — Reusable 3-layer (glow → main → core) line primitive
 *   <EnergyWave>          — Multi-line parallel curved arcs
 *   <KamehamehaBeam>      — 3-phase beam: charge → fire → impact
 *   <ScreenShake>         — Noise-based screen shake wrapper
 *   <SlashEffect>         — Curved sword/energy slash arc
 *   <ImpactBurst>         — Radial explosion at a point
 *   <SpeedLines>          — Radiating motion lines
 *   <ScreenFlash>         — Full-screen white flash
 *   <BattleAura>          — Pulsing energy aura
 *   <TriangleBurst>       — Expanding triangle shapes (NEW)
 *   <DiamondShards>       — Diamond/rhombus particle burst (NEW)
 *   <ConcentrationLines>  — Manga-style diagonal focus lines (NEW)
 *   <GroundCrack>         — Ground crack effect (NEW)
 *   <PowerUpRings>        — Concentric expanding rings (NEW)
 */

// ─── AnimatedLine (reusable primitive) ──────────────────────────────────────

interface AnimatedLineProps {
  d: string;
  progress: number;
  opacity: number;
  color: string;
  width: number;
  glowWidth?: number;
  coreColor?: string;
  coreWidthRatio?: number;
  filterId: string;
}

const AnimatedLine: React.FC<AnimatedLineProps> = ({
  d,
  progress,
  opacity,
  color,
  width,
  glowWidth = 12,
  coreColor = "white",
  coreWidthRatio = 0.4,
  filterId,
}) => {
  const pathLength = 2000;
  const clampedProgress = Math.min(progress, 1);
  const strokeDashoffset = pathLength * (1 - clampedProgress);

  return (
    <>
      <path d={d} stroke={color} strokeWidth={width + glowWidth} fill="none" strokeLinecap="round" opacity={opacity * 0.4} strokeDasharray={pathLength} strokeDashoffset={strokeDashoffset} filter={`url(#blur-${filterId})`} />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" opacity={opacity} strokeDasharray={pathLength} strokeDashoffset={strokeDashoffset} />
      <path d={d} stroke={coreColor} strokeWidth={width * coreWidthRatio} fill="none" strokeLinecap="round" opacity={opacity * 0.8} strokeDasharray={pathLength} strokeDashoffset={strokeDashoffset} />
    </>
  );
};

// ─── EnergyWave ─────────────────────────────────────────────────────────────

interface EnergyWaveProps {
  fromX?: number; fromY?: number; toX?: number; toY?: number;
  delay?: number; color?: string; waveCount?: number; spread?: number;
  thickness?: number; intensity?: number;
}

export const EnergyWave: React.FC<EnergyWaveProps> = ({
  fromX = 200, fromY = 540, toX = 1720, toY = 540,
  delay = 0, color = "#60A5FA", waveCount = 7, spread = 30,
  thickness = 4, intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const overallOpacity = interpolate(f, [0, 6, 20, 35], [0, 1, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lines = Array.from({ length: waveCount }, (_, i) => {
    const lineDelay = i * 2;
    const lf = Math.max(0, f - lineDelay);
    const centerIndex = (waveCount - 1) / 2;
    const offsetFromCenter = i - centerIndex;
    const yOffset = offsetFromCenter * spread;
    const centerFactor = 1 - Math.abs(offsetFromCenter) / (centerIndex + 1);
    const lineThickness = thickness * (0.4 + centerFactor * 0.6) * intensity;
    const lineOpacity = (0.3 + centerFactor * 0.7) * intensity;
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 + yOffset;
    const noiseOffset = noise2D(`wave-${i}`, 0, 0) * 40;
    const path = `M ${fromX} ${fromY + yOffset * 0.3} Q ${midX} ${midY + noiseOffset} ${toX} ${toY + yOffset * 0.3}`;
    const progress = interpolate(lf, [0, 8], [0, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return { path, progress, opacity: overallOpacity * lineOpacity, thickness: lineThickness, filterId: `ew-${i}` };
  });

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }} viewBox="0 0 1920 1080">
      <defs>{lines.map((l, i) => (<filter key={i} id={`blur-${l.filterId}`}><feGaussianBlur stdDeviation={6 * intensity} /></filter>))}</defs>
      {lines.map((l, i) => (<AnimatedLine key={i} d={l.path} progress={l.progress} opacity={l.opacity} color={color} width={l.thickness} filterId={l.filterId} />))}
    </svg>
  );
};

// ─── TriangleBurst (NEW — expanding triangle shapes) ───────────────────────

interface TriangleBurstProps {
  x?: number; y?: number; delay?: number; color?: string;
  count?: number; maxRadius?: number;
}

export const TriangleBurst: React.FC<TriangleBurstProps> = ({
  x = 960, y = 540, delay = 0, color = "#FBBF24", count = 6, maxRadius = 300,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const triangles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + noise2D(`tri-${i}`, 0, 0) * 0.5;
    const dist = interpolate(f, [0, 20], [0, maxRadius * (0.5 + noise2D(`tri-${i}`, 1, 0) * 0.5)], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const tx = x + Math.cos(angle) * dist;
    const ty = y + Math.sin(angle) * dist;
    const scale = interpolate(f, [0, 5, 15, 30], [0, 1.5, 1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(0.8)) });
    const opacity = interpolate(f, [0, 3, 20, 35], [0, 1, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const rotation = f * 3 + noise2D(`tri-${i}`, 2, 0) * 60;
    const size = 15 + noise2D(`tri-${i}`, 3, 0) * 15;
    return { tx, ty, scale, opacity, rotation, size, i };
  });

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }} viewBox="0 0 1920 1080">
      {triangles.map(t => {
        const r = t.size;
        const h = r * Math.sqrt(3) / 2;
        const points = `${t.tx},${t.ty - h} ${t.tx - r},${t.ty + h * 0.5} ${t.tx + r},${t.ty + h * 0.5}`;
        return (
          <g key={t.i} transform={`translate(${t.tx}, ${t.ty}) scale(${t.scale}) rotate(${t.rotation}) translate(${-t.tx}, ${-t.ty})`}>
            <polygon points={points} fill={color} opacity={t.opacity} stroke="white" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

// ─── DiamondShards (NEW — diamond/rhombus particle burst) ──────────────────

interface DiamondShardsProps {
  x?: number; y?: number; delay?: number; color?: string;
  count?: number; maxRadius?: number;
}

export const DiamondShards: React.FC<DiamondShardsProps> = ({
  x = 960, y = 540, delay = 0, color = "#A78BFA", count = 8, maxRadius = 250,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const shards = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + noise2D(`dia-${i}`, 0, 0) * 0.4;
    const dist = interpolate(f, [0, 18], [0, maxRadius * (0.4 + noise2D(`dia-${i}`, 1, 0) * 0.6)], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const dx = x + Math.cos(angle) * dist;
    const dy = y + Math.sin(angle) * dist;
    const scale = interpolate(f, [0, 4, 12, 30], [0, 1.3, 1, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(0.6)) });
    const opacity = interpolate(f, [0, 2, 18, 32], [0, 1, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const rotation = f * 2 + noise2D(`dia-${i}`, 2, 0) * 45;
    const size = 12 + noise2D(`dia-${i}`, 3, 0) * 12;
    return { dx, dy, scale, opacity, rotation, size, i };
  });

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }} viewBox="0 0 1920 1080">
      {shards.map(s => {
        const points = `${s.dx},${s.dy - s.size} ${s.dx + s.size * 0.6},${s.dy} ${s.dx},${s.dy + s.size} ${s.dx - s.size * 0.6},${s.dy}`;
        return (
          <g key={s.i} transform={`translate(${s.dx}, ${s.dy}) scale(${s.scale}) rotate(${s.rotation}) translate(${-s.dx}, ${-s.dy})`}>
            <polygon points={points} fill={color} opacity={s.opacity} stroke="white" strokeWidth={1.5} />
          </g>
        );
      })}
    </svg>
  );
};

// ─── ConcentrationLines (NEW — manga-style diagonal focus lines) ───────────

interface ConcentrationLinesProps {
  delay?: number; color?: string; lineCount?: number;
  angle?: number; duration?: number;
}

export const ConcentrationLines: React.FC<ConcentrationLinesProps> = ({
  delay = 0, color = "rgba(255, 255, 255, 0.5)", lineCount = 24,
  angle = 45, duration = 30,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 5, duration * 0.6, duration], [0, 0.7, 0.5, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Lines radiate from center, all at similar angle (manga concentration style)
  const angleRad = (angle * Math.PI) / 180;
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const spread = 0.15; // Angular spread around base angle
    const lineAngle = angleRad + (i / lineCount - 0.5) * spread * 2;
    const offset = noise2D(`conc-${i}`, 0, 0) * 200 - 100;
    const length = 600 + noise2D(`conc-${i}`, 1, 0) * 400;
    const cx = 960 + offset;
    const cy = 540 + offset;
    const x1 = cx - Math.cos(lineAngle) * length;
    const y1 = cy - Math.sin(lineAngle) * length;
    const x2 = cx + Math.cos(lineAngle) * length;
    const y2 = cy + Math.sin(lineAngle) * length;
    const lineOpacity = opacity * (0.3 + noise2D(`conc-${i}`, 2, 0) * 0.7);
    const width = 1 + noise2D(`conc-${i}`, 3, 0) * 2;
    return { x1, y1, x2, y2, lineOpacity, width };
  });

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 140 }} viewBox="0 0 1920 1080">
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={l.width} strokeLinecap="round" opacity={l.lineOpacity} />
      ))}
    </svg>
  );
};

// ─── PowerUpRings (NEW — concentric expanding rings) ───────────────────────

interface PowerUpRingsProps {
  x?: number; y?: number; delay?: number; color?: string;
  ringCount?: number; maxRadius?: number;
}

export const PowerUpRings: React.FC<PowerUpRingsProps> = ({
  x = 960, y = 540, delay = 0, color = "#F59E0B", ringCount = 4, maxRadius = 400,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const rings = Array.from({ length: ringCount }, (_, i) => {
    const ringDelay = i * 5;
    const rf = Math.max(0, f - ringDelay);
    const radius = interpolate(rf, [0, 20], [20, maxRadius], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const opacity = interpolate(rf, [0, 5, 20, 30], [0, 0.8, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const strokeWidth = interpolate(rf, [0, 15], [6, 1.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { radius, opacity, strokeWidth, i };
  });

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 145 }} viewBox="0 0 1920 1080">
      {rings.map(r => (
        <circle key={r.i} cx={x} cy={y} r={r.radius} fill="none" stroke={color} strokeWidth={r.strokeWidth} opacity={r.opacity} />
      ))}
    </svg>
  );
};

// ─── GroundCrack (NEW — ground crack effect) ───────────────────────────────

interface GroundCrackProps {
  x?: number; y?: number; delay?: number; color?: string;
}

export const GroundCrack: React.FC<GroundCrackProps> = ({
  x = 960, y = 800, delay = 0, color = "#92400E",
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  // Main crack line with branches
  const mainProgress = interpolate(f, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const opacity = interpolate(f, [0, 5, 30, 45], [0, 1, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const crackWidth = 4 + Math.sin(f * 0.1) * 1;

  // Main crack path
  const mainPath = (() => {
    const segments = 6;
    const points: string[] = [`M ${x} ${y}`];
    for (let i = 1; i <= segments; i++) {
      const t = (i / segments) * mainProgress;
      const px = x + noise2D(`crack-main-${i}`, 0, 0) * 120 * t;
      const py = y + t * 150 + noise2D(`crack-main-${i}`, 1, 0) * 30;
      points.push(`L ${px} ${py}`);
    }
    return points.join(" ");
  })();

  // Branch cracks
  const branches = Array.from({ length: 4 }, (_, i) => {
    const branchStart = (i + 1) / 5;
    const branchProgress = interpolate(f, [i * 3, i * 3 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const startT = branchStart * mainProgress;
    const sx = x + noise2D(`crack-main-${i + 1}`, 0, 0) * 120 * startT;
    const sy = y + startT * 150 + noise2D(`crack-main-${i + 1}`, 1, 0) * 30;
    const ex = sx + noise2D(`branch-${i}`, 0, 0) * 80 * branchProgress;
    const ey = sy + 30 + noise2D(`branch-${i}`, 1, 0) * 20 * branchProgress;
    return { path: `M ${sx} ${sy} L ${ex} ${ey}`, opacity: opacity * 0.6 };
  });

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }} viewBox="0 0 1920 1080">
      <path d={mainPath} stroke={color} strokeWidth={crackWidth} fill="none" strokeLinecap="round" opacity={opacity} />
      {branches.map((b, i) => (<path key={i} d={b.path} stroke={color} strokeWidth={crackWidth * 0.5} fill="none" strokeLinecap="round" opacity={b.opacity} />))}
      {/* Dust particles around crack */}
      {Array.from({ length: 8 }, (_, i) => {
        const dustDist = interpolate(f, [0, 15], [0, 60 + noise2D(`dust-${i}`, 0, 0) * 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const dustAngle = noise2D(`dust-${i}`, 1, 0) * Math.PI * 2;
        const dx = x + Math.cos(dustAngle) * dustDist;
        const dy = y + Math.sin(dustAngle) * dustDist * 0.3 - Math.abs(noise2D(`dust-${i}`, 2, 0)) * 30;
        const dustOpacity = interpolate(f, [0, 5, 20, 35], [0, 0.5, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const dustSize = 3 + noise2D(`dust-${i}`, 3, 0) * 4;
        return <circle key={i} cx={dx} cy={dy} r={dustSize} fill="#A0845C" opacity={dustOpacity} />;
      })}
    </svg>
  );
};

// ─── SlashEffect ────────────────────────────────────────────────────────────

interface SlashEffectProps {
  delay?: number; direction?: "ltr" | "rtl"; color?: string; thickness?: number;
}

export const SlashEffect: React.FC<SlashEffectProps> = ({
  delay = 0, direction = "ltr", color = "#FFD700", thickness = 8,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const path = direction === "ltr" ? "M 200 800 Q 960 200 1720 600" : "M 1720 800 Q 960 200 200 600";
  const progress = interpolate(f, [0, 8], [0, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const opacity = interpolate(f, [0, 3, 10, 25], [0, 1, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowOpacity = interpolate(f, [0, 5, 15, 25], [0, 0.6, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pathLength = 2000;
  const strokeDashoffset = pathLength * (1 - Math.min(progress, 1));

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }} viewBox="0 0 1920 1080">
      <defs><filter id="slash-blur"><feGaussianBlur stdDeviation="8" /></filter></defs>
      <path d={path} stroke={color} strokeWidth={thickness + 12} fill="none" strokeLinecap="round" opacity={glowOpacity} strokeDasharray={pathLength} strokeDashoffset={strokeDashoffset} filter="url(#slash-blur)" />
      <path d={path} stroke={color} strokeWidth={thickness} fill="none" strokeLinecap="round" opacity={opacity} strokeDasharray={pathLength} strokeDashoffset={strokeDashoffset} />
      <path d={path} stroke="white" strokeWidth={thickness * 0.4} fill="none" strokeLinecap="round" opacity={opacity * 0.8} strokeDasharray={pathLength} strokeDashoffset={strokeDashoffset} />
    </svg>
  );
};

// ─── ImpactBurst ────────────────────────────────────────────────────────────

interface ImpactBurstProps {
  x?: number; y?: number; delay?: number; color?: string;
  maxRadius?: number; particleCount?: number;
}

export const ImpactBurst: React.FC<ImpactBurstProps> = ({
  x = 960, y = 540, delay = 0, color = "#FFD700", maxRadius = 250, particleCount = 16,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const ringRadius = interpolate(f, [0, 15], [0, maxRadius], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ringOpacity = interpolate(f, [0, 4, 15, 30], [0, 1, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashRadius = interpolate(f, [0, 6], [0, maxRadius * 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashOpacity = interpolate(f, [0, 3, 8, 15], [0, 0.8, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2 + noise2D(`particle-${i}`, 0, 0) * 0.3;
    const dist = interpolate(f, [0, 20], [0, maxRadius * (0.7 + noise2D(`particle-${i}`, 1, 0) * 0.3)], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const pOpacity = interpolate(f, [0, 3, 15, 25], [0, 1, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const size = 4 + noise2D(`particle-${i}`, 2, 0) * 6;
    return { px, py, pOpacity: Math.max(0, pOpacity), size: Math.abs(size) + 2 };
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }}>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <circle cx={x} cy={y} r={flashRadius} fill={color} opacity={flashOpacity} />
        <circle cx={x} cy={y} r={ringRadius} fill="none" stroke={color} strokeWidth={4} opacity={ringOpacity} />
        <circle cx={x} cy={y} r={ringRadius * 0.7} fill="none" stroke="white" strokeWidth={2} opacity={ringOpacity * 0.5} />
        {particles.map((p, i) => (<circle key={i} cx={p.px} cy={p.py} r={p.size} fill={color} opacity={p.pOpacity} />))}
      </svg>
    </div>
  );
};

// ─── SpeedLines ────────────────────────────────────────────────────────────

interface SpeedLinesProps {
  delay?: number; color?: string; lineCount?: number;
}

export const SpeedLines: React.FC<SpeedLinesProps> = ({
  delay = 0, color = "rgba(255, 255, 255, 0.6)", lineCount = 20,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 5, 20, 30], [0, 0.8, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const angle = (i / lineCount) * Math.PI * 2;
    const innerR = 200 + noise2D(`speed-${i}`, 0, 0) * 50;
    const outerR = interpolate(f, [0, 10], [innerR + 50, 800 + noise2D(`speed-${i}`, 1, 0) * 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const x1 = 960 + Math.cos(angle) * innerR;
    const y1 = 540 + Math.sin(angle) * innerR;
    const x2 = 960 + Math.cos(angle) * outerR;
    const y2 = 540 + Math.sin(angle) * outerR;
    return { x1, y1, x2, y2 };
  });

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 140 }} viewBox="0 0 1920 1080">
      {lines.map((l, i) => (<line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={opacity} />))}
    </svg>
  );
};

// ─── ScreenFlash ───────────────────────────────────────────────────────────

interface ScreenFlashProps {
  delay?: number; duration?: number; color?: string;
}

export const ScreenFlash: React.FC<ScreenFlashProps> = ({
  delay = 0, duration = 12, color = "white",
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 2, duration * 0.5, duration], [0, 0.9, 0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (opacity <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${color}, transparent 70%)`, opacity, pointerEvents: "none", zIndex: 300 }} />;
};

// ─── BattleAura ────────────────────────────────────────────────────────────

interface BattleAuraProps {
  x?: number; y?: number; color?: string; intensity?: number;
}

export const BattleAura: React.FC<BattleAuraProps> = ({
  x = 960, y = 700, color = "#60A5FA", intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const pulseScale = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.9, 1.1]);
  const baseOpacity = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.15, 0.35]) * intensity;
  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 130 }} viewBox="0 0 1920 1080">
      <defs><filter id="aura-blur"><feGaussianBlur stdDeviation="30" /></filter></defs>
      <ellipse cx={x} cy={y} rx={180 * pulseScale} ry={250 * pulseScale} fill={color} opacity={baseOpacity} filter="url(#aura-blur)" />
    </svg>
  );
};

// ─── ScreenShake ───────────────────────────────────────────────────────────

interface ScreenShakeProps {
  delay?: number; intensity?: number; duration?: number;
  children: React.ReactNode;
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({
  delay, intensity = 12, duration = 15, children,
}) => {
  const frame = useCurrentFrame();
  // If no delay specified, don't shake at all
  if (delay === undefined) return <>{children}</>;
  const f = Math.max(0, frame - delay);
  if (f >= duration) return <>{children}</>;
  const decay = interpolate(f, [0, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shakeX = noise2D("shake-x", f * 0.5, 0) * intensity * decay;
  const shakeY = noise2D("shake-y", 0, f * 0.5) * intensity * decay;
  return <div style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>{children}</div>;
};
