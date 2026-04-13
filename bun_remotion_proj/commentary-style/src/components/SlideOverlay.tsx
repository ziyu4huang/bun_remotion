import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface SlideOverlayProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "right" | "left" | "bottom";
  /** Accent color for glow border */
  accentColor?: string;
}

/**
 * Slide-in overlay card with spring animation, glow border, and optional motion trail.
 */
export const SlideOverlay: React.FC<SlideOverlayProps> = ({
  children,
  delay = 15,
  direction = "right",
  accentColor = "#00d4ff",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);

  const transforms: Record<string, string> = {
    right: `translateX(${interpolate(progress, [0, 1], [700, 0])}px)`,
    left: `translateX(${interpolate(progress, [0, 1], [-700, 0])}px)`,
    bottom: `translateY(${interpolate(progress, [0, 1], [350, 0])}px)`,
  };

  // Glow pulse
  const glowIntensity = interpolate(Math.sin(frame * 0.06), [-1, 1], [8, 20]);

  return (
    <div
      style={{
        opacity,
        transform: transforms[direction],
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(15, 20, 35, 0.92)",
          borderRadius: 16,
          padding: 28,
          border: `1px solid ${accentColor}33`,
          boxShadow: `0 0 ${glowIntensity}px ${accentColor}22, 0 10px 40px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
