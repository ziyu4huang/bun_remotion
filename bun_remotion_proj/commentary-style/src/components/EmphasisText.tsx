import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface EmphasisTextProps {
  text: string;
  delay?: number;
  color?: string;
  fontSize?: number;
}

/**
 * Big emphasis text that pops up center-screen with glow + motion trail.
 * Use for key phrases during commentary.
 */
export const EmphasisText: React.FC<EmphasisTextProps> = ({
  text,
  delay = 0,
  color = "#00d4ff",
  fontSize = 72,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  // Scale: overshoot then settle
  const scale = interpolate(entrance, [0, 1], [0.3, 1]);

  // Exit: fade out in last 20% of scene
  const exitStart = durationInFrames * 0.8;
  const fadeOut = interpolate(
    frame,
    [exitStart, exitStart + 20],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Glow pulse
  const glowSize = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [15, 30],
  );

  if (entrance <= 0 || fadeOut <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: fadeOut,
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 900,
          color: "white",
          fontFamily: "sans-serif",
          textAlign: "center",
          lineHeight: 1.2,
          transform: `scale(${scale})`,
          textShadow: `0 0 ${glowSize}px ${color}, 0 0 ${glowSize * 2}px ${color}, 0 4px 20px rgba(0,0,0,0.8)`,
          padding: "10px 40px",
          backgroundColor: "rgba(0,0,0,0.4)",
          borderRadius: 12,
          border: `2px solid ${color}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
