import React from "react";
import { Img, staticFile } from "remotion";
import { useCurrentFrame, interpolate } from "remotion";

interface BackgroundLayerProps {
  image?: string;
  /** Fallback gradient when no image */
  gradient?: string;
  /** Ken Burns zoom intensity (0 = none) */
  zoom?: number;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  image,
  gradient = "linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)",
  zoom = 0.02,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 900], [1, 1 + zoom], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {image ? (
        <Img
          src={staticFile(`images/${image}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: gradient }} />
      )}

      {/* Subtle dark overlay for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(10, 5, 30, 0.15) 0%, rgba(10, 5, 30, 0.3) 60%, rgba(10, 5, 30, 0.5) 100%)",
        }}
      />

      {/* Soft vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.35) 100%)",
        }}
      />
    </div>
  );
};
