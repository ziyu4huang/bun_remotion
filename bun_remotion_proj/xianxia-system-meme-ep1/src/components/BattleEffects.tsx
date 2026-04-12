import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { noise2D } from "@remotion/noise";

/**
 * Vector-based battle effects for the 系統文小說梗 series.
 * Inspired by Super Robot Wars Q版戰鬥場景.
 * Uses SVG paths + Remotion interpolation — no pre-rendered assets needed.
 *
 * Effects:
 *   <SlashEffect>     — Curved sword/energy slash arc
 *   <ImpactBurst>     — Radial explosion at a point
 *   <EnergyBeam>      — Horizontal beam from character
 *   <SpeedLines>      — Radiating motion lines
 *   <ScreenFlash>     — Full-screen white flash
 *   <BattleAura>      — Pulsing energy aura around a character
 */

// ─── Slash Arc ──────────────────────────────────────────────────────────────
interface SlashEffectProps {
  /** Delay in frames before slash starts */
  delay?: number;
  /** "left-to-right" or "right-to-left" */
  direction?: "ltr" | "rtl";
  /** Color of the slash */
  color?: string;
  /** Thickness of the slash line */
  thickness?: number;
}

export const SlashEffect: React.FC<SlashEffectProps> = ({
  delay = 0,
  direction = "ltr",
  color = "#FFD700",
  thickness = 8,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  // Slash path — a curved arc across the screen
  const path = direction === "ltr"
    ? "M 200 800 Q 960 200 1720 600"
    : "M 1720 800 Q 960 200 200 600";

  // Progress: draw the slash quickly (0-8 frames), then fade (8-25 frames)
  const progress = interpolate(f, [0, 8], [0, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(f, [0, 3, 10, 25], [0, 1, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // After-image glow
  const glowOpacity = interpolate(f, [0, 5, 15, 25], [0, 0.6, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Estimate path length for dash animation
  const pathLength = 2000;
  const strokeDashoffset = pathLength * (1 - Math.min(progress, 1));

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }}
      viewBox="0 0 1920 1080"
    >
      {/* Glow layer */}
      <path
        d={path}
        stroke={color}
        strokeWidth={thickness + 12}
        fill="none"
        strokeLinecap="round"
        opacity={glowOpacity}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
        filter="url(#blur)"
      />
      {/* Main slash */}
      <path
        d={path}
        stroke={color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        opacity={opacity}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
      />
      {/* White core */}
      <path
        d={path}
        stroke="white"
        strokeWidth={thickness * 0.4}
        fill="none"
        strokeLinecap="round"
        opacity={opacity * 0.8}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
      />
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
    </svg>
  );
};

// ─── Impact Burst ───────────────────────────────────────────────────────────
interface ImpactBurstProps {
  x?: number;
  y?: number;
  delay?: number;
  color?: string;
  maxRadius?: number;
  particleCount?: number;
}

export const ImpactBurst: React.FC<ImpactBurstProps> = ({
  x = 960,
  y = 540,
  delay = 0,
  color = "#FFD700",
  maxRadius = 250,
  particleCount = 16,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  // Expanding ring
  const ringRadius = interpolate(f, [0, 15], [0, maxRadius], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const ringOpacity = interpolate(f, [0, 4, 15, 30], [0, 1, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Expanding flash circle
  const flashRadius = interpolate(f, [0, 6], [0, maxRadius * 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flashOpacity = interpolate(f, [0, 3, 8, 15], [0, 0.8, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Particles flying outward with noise
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2 + noise2D(`particle-${i}`, 0, 0) * 0.3;
    const dist = interpolate(f, [0, 20], [0, maxRadius * (0.7 + noise2D(`particle-${i}`, 1, 0) * 0.3)], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const pOpacity = interpolate(f, [0, 3, 15, 25], [0, 1, 0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const size = 4 + noise2D(`particle-${i}`, 2, 0) * 6;
    return { px, py, pOpacity: Math.max(0, pOpacity), size: Math.abs(size) + 2 };
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }}>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* Flash circle */}
        <circle cx={x} cy={y} r={flashRadius} fill={color} opacity={flashOpacity} />
        {/* Expanding ring */}
        <circle cx={x} cy={y} r={ringRadius} fill="none" stroke={color} strokeWidth={4} opacity={ringOpacity} />
        <circle cx={x} cy={y} r={ringRadius * 0.7} fill="none" stroke="white" strokeWidth={2} opacity={ringOpacity * 0.5} />
        {/* Particles */}
        {particles.map((p, i) => (
          <circle key={i} cx={p.px} cy={p.py} r={p.size} fill={color} opacity={p.pOpacity} />
        ))}
      </svg>
    </div>
  );
};

// ─── Energy Beam ────────────────────────────────────────────────────────────
interface EnergyBeamProps {
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  delay?: number;
  color?: string;
  width?: number;
}

export const EnergyBeam: React.FC<EnergyBeamProps> = ({
  fromX = 200,
  fromY = 540,
  toX = 1720,
  toY = 540,
  delay = 0,
  color = "#60A5FA",
  width = 30,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  // Beam extends from source to target
  const beamProgress = interpolate(f, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const currentEndX = fromX + (toX - fromX) * beamProgress;

  // Jitter on the beam edges using noise
  const jitter = noise2D("beam", f * 0.3, 0) * 8;

  const opacity = interpolate(f, [0, 3, 15, 25], [0, 1, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }}
      viewBox="0 0 1920 1080"
    >
      {/* Glow */}
      <line
        x1={fromX} y1={fromY + jitter}
        x2={currentEndX} y2={toY + jitter}
        stroke={color} strokeWidth={width + 20} strokeLinecap="round"
        opacity={opacity * 0.3}
        filter="url(#beam-blur)"
      />
      {/* Main beam */}
      <line
        x1={fromX} y1={fromY}
        x2={currentEndX} y2={toY}
        stroke={color} strokeWidth={width} strokeLinecap="round"
        opacity={opacity}
      />
      {/* White core */}
      <line
        x1={fromX} y1={fromY}
        x2={currentEndX} y2={toY}
        stroke="white" strokeWidth={width * 0.3} strokeLinecap="round"
        opacity={opacity * 0.9}
      />
      <defs>
        <filter id="beam-blur">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
    </svg>
  );
};

// ─── Speed Lines ────────────────────────────────────────────────────────────
interface SpeedLinesProps {
  delay?: number;
  color?: string;
  lineCount?: number;
}

export const SpeedLines: React.FC<SpeedLinesProps> = ({
  delay = 0,
  color = "rgba(255, 255, 255, 0.6)",
  lineCount = 20,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 5, 20, 30], [0, 0.8, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const angle = (i / lineCount) * Math.PI * 2;
    const innerR = 200 + noise2D(`speed-${i}`, 0, 0) * 50;
    const outerR = interpolate(f, [0, 10], [innerR + 50, 800 + noise2D(`speed-${i}`, 1, 0) * 200], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const x1 = 960 + Math.cos(angle) * innerR;
    const y1 = 540 + Math.sin(angle) * innerR;
    const x2 = 960 + Math.cos(angle) * outerR;
    const y2 = 540 + Math.sin(angle) * outerR;
    return { x1, y1, x2, y2 };
  });

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 140 }}
      viewBox="0 0 1920 1080"
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke={color} strokeWidth={2} strokeLinecap="round"
          opacity={opacity}
        />
      ))}
    </svg>
  );
};

// ─── Screen Flash ───────────────────────────────────────────────────────────
interface ScreenFlashProps {
  delay?: number;
  duration?: number;
  color?: string;
}

export const ScreenFlash: React.FC<ScreenFlashProps> = ({
  delay = 0,
  duration = 12,
  color = "white",
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 2, duration * 0.5, duration], [0, 0.9, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at center, ${color}, transparent 70%)`,
        opacity,
        pointerEvents: "none",
        zIndex: 300,
      }}
    />
  );
};

// ─── Battle Aura ────────────────────────────────────────────────────────────
interface BattleAuraProps {
  x?: number;
  y?: number;
  color?: string;
  intensity?: number;
}

export const BattleAura: React.FC<BattleAuraProps> = ({
  x = 960,
  y = 700,
  color = "#60A5FA",
  intensity = 1,
}) => {
  const frame = useCurrentFrame();

  const pulseScale = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.9, 1.1]
  );

  const baseOpacity = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.15, 0.35]
  ) * intensity;

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 130 }}
      viewBox="0 0 1920 1080"
    >
      <ellipse
        cx={x} cy={y}
        rx={180 * pulseScale}
        ry={250 * pulseScale}
        fill={color}
        opacity={baseOpacity}
        filter="url(#aura-blur)"
      />
      <defs>
        <filter id="aura-blur">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>
    </svg>
  );
};
