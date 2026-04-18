import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface TensionMeterProps {
  tension: number;
  sceneLabel?: string;
  position?: "left" | "right";
}

export const TensionMeter: React.FC<TensionMeterProps> = ({
  tension,
  sceneLabel,
  position = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barWidth = 16;
  const barHeight = 200;
  const clampedTension = Math.max(0, Math.min(1, tension));

  const fillSpring = spring({ frame, fps, config: { damping: 12, stiffness: 80, mass: 1 } });
  const fillHeight = interpolate(fillSpring, [0, 1], [0, barHeight * clampedTension]);

  const entryOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const left = position === "left" ? 20 : undefined;
  const right = position === "right" ? 20 : undefined;

  const fillColor = interpolate(clampedTension, [0, 0.5, 1], [0, 1, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bg = fillColor <= 1
    ? `rgba(16, 185, 129, ${0.6 + 0.4 * fillColor})`
    : `rgba(239, 68, 68, ${0.6 + 0.4 * (fillColor - 1)})`;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left,
        right,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        opacity: entryOpacity,
      }}
    >
      <div
        style={{
          width: barWidth,
          height: barHeight,
          backgroundColor: "rgba(0,0,0,0.3)",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: barWidth,
            height: fillHeight,
            backgroundColor: bg,
            borderRadius: 8,
            transition: "none",
          }}
        />
      </div>

      {sceneLabel && (
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.6)",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            fontFamily: "sans-serif",
          }}
        >
          {sceneLabel}
        </span>
      )}

      <span
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.8)",
          fontWeight: 600,
        }}
      >
        {Math.round(clampedTension * 100)}
      </span>
    </div>
  );
};
