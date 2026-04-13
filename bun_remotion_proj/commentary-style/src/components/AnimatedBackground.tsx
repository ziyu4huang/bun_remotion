import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { NoiseGrain } from "./NoiseGrain";
import { FloatingShapes } from "./FloatingShapes";

interface AnimatedBackgroundProps {
  colorFrom: string;
  colorTo: string;
  accentColor?: string;
  /** How fast the gradient shifts (degrees per 300 frames) */
  gradientSpeed?: number;
  /** Show floating geometric shapes */
  showShapes?: boolean;
  /** Show film grain */
  showGrain?: boolean;
  /** Pulse the accent color glow */
  pulseGlow?: boolean;
}

/**
 * Rich animated background with gradient, noise grain, floating shapes, and optional glow pulse.
 */
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  colorFrom,
  colorTo,
  accentColor = "rgba(0, 212, 255, 0.2)",
  gradientSpeed = 10,
  showShapes = true,
  showGrain = true,
  pulseGlow = true,
}) => {
  const frame = useCurrentFrame();

  // Animated gradient angle rotation
  const angle = interpolate(frame, [0, 300], [135, 135 + gradientSpeed], {
    extrapolateRight: "clamp",
  });

  // Pulsing glow behind center content
  const glowOpacity = pulseGlow
    ? interpolate(Math.sin(frame * 0.04), [-1, 1], [0.03, 0.12])
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${angle}deg, ${colorFrom}, ${colorTo})`,
      }}
    >
      {/* Animated accent glow orb */}
      {pulseGlow && (
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 800,
            left: "50%",
            top: "40%",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor.replace(/[\d.]+\)$/, `${glowOpacity})`)}, transparent 70%)`,
            opacity: glowOpacity * 8,
            filter: "blur(40px)",
          }}
        />
      )}

      {/* Floating shapes */}
      {showShapes && <FloatingShapes accentColor={accentColor} />}

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Film grain */}
      {showGrain && <NoiseGrain />}
    </div>
  );
};
