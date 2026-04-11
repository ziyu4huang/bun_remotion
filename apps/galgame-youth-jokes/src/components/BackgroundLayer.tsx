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
  zoom = 0.03,
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

      {/* Dark overlay for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(10, 5, 30, 0.3) 0%, rgba(10, 5, 30, 0.7) 100%)",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.5) 100%)",
        }}
      />

      {/* Decorative particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = ((i * 17 + 5) % 100);
        const y = ((i * 23 + 11) % 60);
        const size = 2 + (i % 3);
        const delay = i * 7;
        const opacity = interpolate(
          frame,
          [delay, delay + 30, delay + 60, delay + 90],
          [0, 0.4, 0.4, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const floatY = interpolate(frame, [0, 300], [0, -20], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: i % 2 === 0 ? "#C084FC" : "#60A5FA",
              opacity,
              transform: `translateY(${floatY}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
