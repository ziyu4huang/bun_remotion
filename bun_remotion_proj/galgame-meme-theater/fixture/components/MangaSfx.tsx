import React from "react";
import { useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { sfxFont, type MangaSfxEvent } from "../characters";

/**
 * Manga-style onomatopoeia (狀聲字) overlay component.
 * Japanese manga SFX with dynamic scaling, rotation, and burst-in effects.
 *
 * Usage:
 *   <MangaSfx events={[
 *     { text: "轟！", x: 960, y: 400, color: "#FF4444", rotation: -12, font: "brush" },
 *     { text: "咻～", x: 500, y: 300, color: "#60A5FA", fontSize: 100, delay: 10 },
 *   ]} />
 */

interface MangaSfxProps {
  events: MangaSfxEvent[];
}

export const MangaSfx: React.FC<MangaSfxProps> = ({ events }) => {
  return (
    <>
      {events.map((event, i) => (
        <SingleMangaSfx key={i} event={event} index={i} />
      ))}
    </>
  );
};

const SingleMangaSfx: React.FC<{ event: MangaSfxEvent; index: number }> = ({ event, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    text,
    x,
    y,
    color = "#FF0000",
    rotation = -8,
    fontSize = 120,
    font = "brush",
    delay = index * 5,
  } = event;

  const f = Math.max(0, frame - delay);

  // Phase 1: Burst-in with spring overshoot
  const scaleSpring = spring({
    frame: f,
    fps,
    config: { damping: 8, stiffness: 300, mass: 0.3 },
  });
  const burstScale = interpolate(scaleSpring, [0, 1], [0, 1.35]);

  // Phase 2: Settle to normal with elastic ease
  const settleFrame = Math.max(0, f - 8);
  const settleScale = interpolate(settleFrame, [0, 12], [1.35, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.elastic(1)),
  });

  const finalScale = f < 8 ? burstScale : settleScale;

  // Slight wobble after appearance
  const wobble = f > 8 ? Math.sin(f * 0.15) * 2 : 0;

  // Fade in fast, hold, fade out
  const opacity = interpolate(f, [0, 3, 35, 50], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slight continuous rotation wobble
  const rotWobble = Math.sin(f * 0.08) * 1.5;

  const fontFamily = sfxFont(font);

  return (
    <>
      {/* Burst background shape */}
      <BurstBackground
        x={x}
        y={y}
        scale={finalScale * 0.9}
        rotation={rotation + wobble}
        opacity={opacity * 0.4}
        color={color}
        size={fontSize * 2.2}
      />

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${finalScale}) rotate(${rotation + wobble + rotWobble}deg)`,
          opacity,
          pointerEvents: "none",
          zIndex: 200,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            fontFamily,
            color: "white",
            WebkitTextStroke: `6px ${color}`,
            paintOrder: "stroke fill",
            textShadow: `
              4px 4px 0 ${color},
              -2px -2px 0 ${color},
              2px -2px 0 ${color},
              -2px 2px 0 ${color},
              0 0 30px ${color}88
            `,
            whiteSpace: "nowrap",
            letterSpacing: "0.05em",
          }}
        >
          {text}
        </span>
      </div>
    </>
  );
};

// ─── Burst Background (starburst behind text) ──────────────────────────────────

const BurstBackground: React.FC<{
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color: string;
  size: number;
}> = ({ x, y, scale, rotation, opacity, color, size }) => {
  if (opacity <= 0) return null;

  // Generate starburst rays
  const rays = 12;
  const rayAngles = Array.from({ length: rays }, (_, i) => (i / rays) * 360);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        pointerEvents: "none",
        zIndex: 199,
      }}
    >
      {/* Radial starburst via conic-gradient */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: `conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.9) 5deg,
            transparent 10deg,
            transparent 20deg,
            rgba(255, 255, 255, 0.9) 25deg,
            transparent 30deg,
            transparent 40deg,
            rgba(255, 255, 255, 0.9) 45deg,
            transparent 50deg,
            transparent 60deg,
            rgba(255, 255, 255, 0.9) 65deg,
            transparent 70deg,
            transparent 80deg,
            rgba(255, 255, 255, 0.9) 85deg,
            transparent 90deg,
            transparent 100deg,
            rgba(255, 255, 255, 0.9) 105deg,
            transparent 110deg,
            transparent 120deg,
            rgba(255, 255, 255, 0.9) 125deg,
            transparent 130deg,
            transparent 140deg,
            rgba(255, 255, 255, 0.9) 145deg,
            transparent 150deg,
            transparent 160deg,
            rgba(255, 255, 255, 0.9) 165deg,
            transparent 170deg,
            transparent 180deg,
            rgba(255, 255, 255, 0.9) 185deg,
            transparent 190deg,
            transparent 200deg,
            rgba(255, 255, 255, 0.9) 205deg,
            transparent 210deg,
            transparent 220deg,
            rgba(255, 255, 255, 0.9) 225deg,
            transparent 230deg,
            transparent 240deg,
            rgba(255, 255, 255, 0.9) 245deg,
            transparent 250deg,
            transparent 260deg,
            rgba(255, 255, 255, 0.9) 265deg,
            transparent 270deg,
            transparent 280deg,
            rgba(255, 255, 255, 0.9) 285deg,
            transparent 290deg,
            transparent 300deg,
            rgba(255, 255, 255, 0.9) 305deg,
            transparent 310deg,
            transparent 320deg,
            rgba(255, 255, 255, 0.9) 325deg,
            transparent 330deg,
            transparent 340deg,
            rgba(255, 255, 255, 0.9) 345deg,
            transparent 350deg,
            transparent 360deg
          )`,
        }}
      />
      {/* Solid color circle behind the starburst */}
      <div
        style={{
          position: "absolute",
          inset: "15%",
          borderRadius: "50%",
          background: color,
          opacity: 0.3,
        }}
      />
    </div>
  );
};
