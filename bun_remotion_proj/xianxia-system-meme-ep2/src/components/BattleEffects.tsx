import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { noise2D } from "@remotion/noise";

/**
 * Vector-based battle effects for 系統文小說梗 ep2.
 * Improved from ep1 with:
 *   <AnimatedLine>     — Reusable 3-layer (glow → main → core) line primitive
 *   <EnergyWave>       — Multi-line parallel curved arcs (攻擊光波)
 *   <KamehamehaBeam>   — 3-phase beam: charge → fire → impact (龜派氣功)
 *   <ScreenShake>      — Noise-based screen shake wrapper
 *   <SlashEffect>      — Curved sword/energy slash arc (from ep1)
 *   <ImpactBurst>      — Radial explosion at a point (from ep1)
 *   <SpeedLines>       — Radiating motion lines (from ep1)
 *   <ScreenFlash>      — Full-screen white flash (from ep1)
 *   <BattleAura>       — Pulsing energy aura (from ep1)
 */

// ─── AnimatedLine (reusable primitive) ──────────────────────────────────────

interface AnimatedLineProps {
  /** SVG path data */
  d: string;
  /** 0-1: how much of the line is drawn */
  progress: number;
  /** Overall opacity */
  opacity: number;
  /** Main stroke color */
  color: string;
  /** Main stroke width */
  width: number;
  /** Extra width for the glow layer (default: 12) */
  glowWidth?: number;
  /** Inner core color (default: "white") */
  coreColor?: string;
  /** Core width as ratio of width (default: 0.4) */
  coreWidthRatio?: number;
  /** SVG filter ID suffix (to avoid collisions) */
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
      {/* Glow layer */}
      <path
        d={d}
        stroke={color}
        strokeWidth={width + glowWidth}
        fill="none"
        strokeLinecap="round"
        opacity={opacity * 0.4}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
        filter={`url(#blur-${filterId})`}
      />
      {/* Main line */}
      <path
        d={d}
        stroke={color}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        opacity={opacity}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
      />
      {/* White core */}
      <path
        d={d}
        stroke={coreColor}
        strokeWidth={width * coreWidthRatio}
        fill="none"
        strokeLinecap="round"
        opacity={opacity * 0.8}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
      />
    </>
  );
};

// ─── EnergyWave (攻擊光波) ──────────────────────────────────────────────────

interface EnergyWaveProps {
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  delay?: number;
  color?: string;
  /** Number of parallel lines (default: 7) */
  waveCount?: number;
  /** Vertical spread between lines (default: 30) */
  spread?: number;
  /** Base line thickness (default: 4) */
  thickness?: number;
  /** 0-1 intensity multiplier (default: 1) */
  intensity?: number;
}

export const EnergyWave: React.FC<EnergyWaveProps> = ({
  fromX = 200,
  fromY = 540,
  toX = 1720,
  toY = 540,
  delay = 0,
  color = "#60A5FA",
  waveCount = 7,
  spread = 30,
  thickness = 4,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  // Overall lifecycle: fade in, sustain, fade out
  const overallOpacity = interpolate(f, [0, 6, 20, 35], [0, 1, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lines = Array.from({ length: waveCount }, (_, i) => {
    // Stagger: each line starts 2 frames after previous
    const lineDelay = i * 2;
    const lf = Math.max(0, f - lineDelay);

    // Vertical offset: center lines are 0, outer lines spread out
    const centerIndex = (waveCount - 1) / 2;
    const offsetFromCenter = i - centerIndex;
    const yOffset = offsetFromCenter * spread;

    // Center lines are thicker/brighter, outer lines thinner/dimmer
    const centerFactor = 1 - Math.abs(offsetFromCenter) / (centerIndex + 1);
    const lineThickness = thickness * (0.4 + centerFactor * 0.6) * intensity;
    const lineOpacity = (0.3 + centerFactor * 0.7) * intensity;

    // Arc control point with noise for organic variation
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 + yOffset;
    const noiseOffset = noise2D(`wave-${i}`, 0, 0) * 40;
    const cpX = midX;
    const cpY = midY + noiseOffset;

    // SVG quadratic bezier path
    const path = `M ${fromX} ${fromY + yOffset * 0.3} Q ${cpX} ${cpY} ${toX} ${toY + yOffset * 0.3}`;

    // Progress: draw quickly (0-8 frames)
    const progress = interpolate(lf, [0, 8], [0, 1.1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return {
      path,
      progress,
      opacity: overallOpacity * lineOpacity,
      thickness: lineThickness,
      filterId: `ew-${i}`,
    };
  });

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        {lines.map((l, i) => (
          <filter key={i} id={`blur-${l.filterId}`}>
            <feGaussianBlur stdDeviation={6 * intensity} />
          </filter>
        ))}
      </defs>
      {lines.map((l, i) => (
        <AnimatedLine
          key={i}
          d={l.path}
          progress={l.progress}
          opacity={l.opacity}
          color={color}
          width={l.thickness}
          filterId={l.filterId}
        />
      ))}
    </svg>
  );
};

// ─── KamehamehaBeam (龜派氣功光束) ──────────────────────────────────────────

interface KamehamehaBeamProps {
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  delay?: number;
  color?: string;
  chargeColor?: string;
  intensity?: number;
  /** Frames for charge phase (default: 20) */
  chargeDuration?: number;
  /** Frames for beam extension (default: 8) */
  fireDuration?: number;
  /** Frames beam holds after full extension (default: 15) */
  sustainDuration?: number;
}

export const KamehamehaBeam: React.FC<KamehamehaBeamProps> = ({
  fromX = 200,
  fromY = 540,
  toX = 1720,
  toY = 540,
  delay = 0,
  color = "#60A5FA",
  chargeColor,
  intensity = 1,
  chargeDuration = 20,
  fireDuration = 8,
  sustainDuration = 15,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const cc = chargeColor ?? color;

  const fireStart = chargeDuration;
  const sustainStart = fireStart + fireDuration;
  const impactStart = sustainStart + sustainDuration;
  const totalEnd = impactStart + 25;

  if (f > totalEnd) return null;

  // ── Phase 1: Charge ──
  const isCharging = f < fireStart;
  const chargeProgress = isCharging
    ? interpolate(f, [0, chargeDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 1;

  // Sphere radius grows
  const sphereRadius = interpolate(chargeProgress, [0, 1], [0, 80]) * intensity;
  // Pulse
  const spherePulse = 1 + Math.sin(f * 0.15) * 0.12;
  // Sphere opacity
  const sphereOpacity = isCharging
    ? interpolate(f, [0, 5, chargeDuration], [0, 0.8, 1])
    : interpolate(f, [sustainStart, totalEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Spiral particles during charge
  const spiralParticles = Array.from({ length: 12 }, (_, i) => {
    if (!isCharging) return null;
    const baseAngle = (i / 12) * Math.PI * 2;
    const angularSpeed = 0.3;
    const angle = baseAngle + f * angularSpeed + noise2D(`sp-${i}`, 0, 0) * 0.3;
    const maxR = 150 * intensity;
    const radius = maxR * (1 - chargeProgress * 0.7);
    const px = fromX + Math.cos(angle) * radius;
    const py = fromY + Math.sin(angle) * radius;
    const pOpacity = interpolate(f, [0, 5, chargeDuration], [0, 1, 0.6], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { px, py, pOpacity, size: (3 + Math.abs(noise2D(`sp-${i}`, 1, 0)) * 4) * intensity, i };
  });

  // ── Phase 2: Fire ──
  const isFiring = f >= fireStart;
  const beamProgress = isFiring
    ? interpolate(f - fireStart, [0, fireDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;

  // Build wobbling beam path with 7 control points
  const beamPath = (() => {
    if (!isFiring || beamProgress <= 0) return "";
    const points = 7;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const segments: string[] = [`M ${fromX} ${fromY}`];
    for (let p = 1; p <= points; p++) {
      const t = (p / points) * beamProgress;
      const px = fromX + dx * t;
      const py = fromY + dy * t;
      // Jitter using noise2D
      const jitterY = noise2D("beam-jitter", p * 0.5, f * 0.3) * 12 * intensity;
      segments.push(`L ${px} ${py + jitterY}`);
    }
    return segments.join(" ");
  })();

  // Beam width pulses
  const beamBaseWidth = (30 + Math.sin(f * 0.2) * 5) * intensity;
  const beamOpacity = isFiring
    ? interpolate(f - fireStart, [0, 3, fireDuration + sustainDuration, fireDuration + sustainDuration + 10], [0, 1, 0.8, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // 1-frame flash at fire start (the "release" moment)
  const releaseFlash = f === fireStart ? 0.9 : 0;

  // ── Phase 3: Impact ──
  const isImpact = f >= impactStart;
  const impactF = isImpact ? f - impactStart : 0;
  const impactRingRadius = isImpact
    ? interpolate(impactF, [0, 15], [0, 300 * intensity], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 0;
  const impactOpacity = isImpact
    ? interpolate(impactF, [0, 3, 15, 25], [0, 1, 0.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Impact particles
  const impactParticles = Array.from({ length: 24 }, (_, i) => {
    if (!isImpact) return null;
    const angle = (i / 24) * Math.PI * 2 + noise2D(`ip-${i}`, 0, 0) * 0.3;
    const dist = interpolate(impactF, [0, 20], [0, (250 + noise2D(`ip-${i}`, 1, 0) * 80) * intensity], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    const px = toX + Math.cos(angle) * dist;
    const py = toY + Math.sin(angle) * dist;
    const pOpacity = interpolate(impactF, [0, 3, 15, 25], [0, 1, 0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const size = (3 + Math.abs(noise2D(`ip-${i}`, 2, 0)) * 5) * intensity;
    return { px, py, pOpacity, size, i };
  });

  // Screen flash during impact
  const flashOpacity = isImpact
    ? interpolate(impactF, [0, 2, 8, 15], [0, 0.8 * intensity, 0.3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : releaseFlash;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }}>
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="blur-charge">
            <feGaussianBlur stdDeviation={15 * intensity} />
          </filter>
          <filter id="blur-beam-glow">
            <feGaussianBlur stdDeviation={20 * intensity} />
          </filter>
          <filter id="blur-beam-outer">
            <feGaussianBlur stdDeviation={8 * intensity} />
          </filter>
        </defs>

        {/* Phase 1: Charge sphere */}
        {sphereRadius > 0 && (
          <>
            {/* Outer glow */}
            <circle
              cx={fromX} cy={fromY}
              r={sphereRadius * spherePulse * 1.5}
              fill={cc}
              opacity={Math.max(0, sphereOpacity) * 0.15}
              filter="url(#blur-charge)"
            />
            {/* Main sphere */}
            <circle
              cx={fromX} cy={fromY}
              r={sphereRadius * spherePulse}
              fill={cc}
              opacity={Math.max(0, sphereOpacity) * 0.5}
            />
            {/* Core */}
            <circle
              cx={fromX} cy={fromY}
              r={sphereRadius * spherePulse * 0.3}
              fill="white"
              opacity={Math.max(0, sphereOpacity) * 0.7}
            />
          </>
        )}

        {/* Spiral particles */}
        {spiralParticles.map((p) =>
          p ? (
            <circle
              key={p.i}
              cx={p.px} cy={p.py}
              r={p.size}
              fill={cc}
              opacity={Math.max(0, p.pOpacity)}
            />
          ) : null
        )}

        {/* Phase 2: Beam — 5 layers */}
        {beamPath && beamOpacity > 0 && (
          <>
            {/* Layer 1: Outer glow (blur 20) */}
            <path
              d={beamPath}
              stroke={color}
              strokeWidth={beamBaseWidth * 3}
              fill="none"
              strokeLinecap="round"
              opacity={beamOpacity * 0.15}
              filter="url(#blur-beam-glow)"
            />
            {/* Layer 2: Outer beam (blur 8) */}
            <path
              d={beamPath}
              stroke={color}
              strokeWidth={beamBaseWidth * 2}
              fill="none"
              strokeLinecap="round"
              opacity={beamOpacity * 0.35}
              filter="url(#blur-beam-outer)"
            />
            {/* Layer 3: Main beam */}
            <path
              d={beamPath}
              stroke={color}
              strokeWidth={beamBaseWidth}
              fill="none"
              strokeLinecap="round"
              opacity={beamOpacity}
            />
            {/* Layer 4: Inner core (white) */}
            <path
              d={beamPath}
              stroke="white"
              strokeWidth={beamBaseWidth * 0.3}
              fill="none"
              strokeLinecap="round"
              opacity={beamOpacity * 0.9}
            />
            {/* Layer 5: Center highlight (pure white, thin) */}
            <path
              d={beamPath}
              stroke="white"
              strokeWidth={beamBaseWidth * 0.1}
              fill="none"
              strokeLinecap="round"
              opacity={beamOpacity * 0.7}
            />
          </>
        )}

        {/* Phase 3: Impact */}
        {isImpact && (
          <>
            {/* Impact flash circle */}
            <circle
              cx={toX} cy={toY}
              r={interpolate(impactF, [0, 6], [0, 180 * intensity], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              fill={color}
              opacity={impactOpacity * 0.6}
            />
            {/* Expanding ring */}
            <circle
              cx={toX} cy={toY}
              r={impactRingRadius}
              fill="none"
              stroke={color}
              strokeWidth={4 * intensity}
              opacity={impactOpacity}
            />
            {/* Inner ring */}
            <circle
              cx={toX} cy={toY}
              r={impactRingRadius * 0.7}
              fill="none"
              stroke="white"
              strokeWidth={2 * intensity}
              opacity={impactOpacity * 0.5}
            />
            {/* Impact particles */}
            {impactParticles.map((p) =>
              p ? (
                <circle
                  key={p.i}
                  cx={p.px} cy={p.py}
                  r={p.size}
                  fill={color}
                  opacity={Math.max(0, p.pOpacity)}
                />
              ) : null
            )}
          </>
        )}
      </svg>

      {/* Screen flash overlay */}
      {flashOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, white, transparent 70%)`,
            opacity: flashOpacity,
            pointerEvents: "none",
            zIndex: 300,
          }}
        />
      )}
    </div>
  );
};

// ─── ScreenShake ────────────────────────────────────────────────────────────

interface ScreenShakeProps {
  delay?: number;
  /** Max pixel displacement (default: 12) */
  intensity?: number;
  /** Frames the shake lasts (default: 15) */
  duration?: number;
  children: React.ReactNode;
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({
  delay = 0,
  intensity = 12,
  duration = 15,
  children,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const decay = interpolate(f, [0, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const shakeX = noise2D("shake-x", f * 0.5, 0) * intensity * decay;
  const shakeY = noise2D("shake-y", 0, f * 0.5) * intensity * decay;

  return (
    <div style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {children}
    </div>
  );
};

// ─── SlashEffect (from ep1) ─────────────────────────────────────────────────

interface SlashEffectProps {
  delay?: number;
  direction?: "ltr" | "rtl";
  color?: string;
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

  const path = direction === "ltr"
    ? "M 200 800 Q 960 200 1720 600"
    : "M 1720 800 Q 960 200 200 600";

  const progress = interpolate(f, [0, 8], [0, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(f, [0, 3, 10, 25], [0, 1, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowOpacity = interpolate(f, [0, 5, 15, 25], [0, 0.6, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pathLength = 2000;
  const strokeDashoffset = pathLength * (1 - Math.min(progress, 1));

  return (
    <svg
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 150 }}
      viewBox="0 0 1920 1080"
    >
      <path
        d={path}
        stroke={color}
        strokeWidth={thickness + 12}
        fill="none"
        strokeLinecap="round"
        opacity={glowOpacity}
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
        filter="url(#slash-blur)"
      />
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
        <filter id="slash-blur">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
    </svg>
  );
};

// ─── ImpactBurst (from ep1) ─────────────────────────────────────────────────

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

  const ringRadius = interpolate(f, [0, 15], [0, maxRadius], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const ringOpacity = interpolate(f, [0, 4, 15, 30], [0, 1, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flashRadius = interpolate(f, [0, 6], [0, maxRadius * 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flashOpacity = interpolate(f, [0, 3, 8, 15], [0, 0.8, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        <circle cx={x} cy={y} r={flashRadius} fill={color} opacity={flashOpacity} />
        <circle cx={x} cy={y} r={ringRadius} fill="none" stroke={color} strokeWidth={4} opacity={ringOpacity} />
        <circle cx={x} cy={y} r={ringRadius * 0.7} fill="none" stroke="white" strokeWidth={2} opacity={ringOpacity * 0.5} />
        {particles.map((p, i) => (
          <circle key={i} cx={p.px} cy={p.py} r={p.size} fill={color} opacity={p.pOpacity} />
        ))}
      </svg>
    </div>
  );
};

// ─── SpeedLines (from ep1) ──────────────────────────────────────────────────

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

// ─── ScreenFlash (from ep1) ─────────────────────────────────────────────────

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

// ─── BattleAura (from ep1) ──────────────────────────────────────────────────

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
