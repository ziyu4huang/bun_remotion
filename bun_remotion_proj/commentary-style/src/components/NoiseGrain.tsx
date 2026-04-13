import React from "react";

interface NoiseGrainProps {
  opacity?: number;
}

/**
 * Static film grain overlay using SVG feTurbulence.
 * Static seed = browser caches the filter result, near-zero perf cost.
 * The grain is already random-looking so animation isn't needed.
 */
export const NoiseGrain: React.FC<NoiseGrainProps> = ({ opacity = 0.03 }) => (
  <svg
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity,
      pointerEvents: "none",
      mixBlendMode: "overlay",
    }}
  >
    <filter id="noise-filter">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.65"
        numOctaves={3}
        seed={42}
        stitchTiles="stitch"
      />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise-filter)" />
  </svg>
);
