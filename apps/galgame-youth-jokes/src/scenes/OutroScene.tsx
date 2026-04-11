import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Content animations
  const contentOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentY = interpolate(frame, [15, 40], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Decorative line
  const lineWidth = interpolate(frame, [25, 50], [0, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #2d1b69 0%, #1a0a2e 50%, #16213e 100%)"
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
        }}
      >
        {/* Thank you text */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 30px rgba(192, 132, 252, 0.4)",
            letterSpacing: "0.1em",
            marginBottom: 20,
          }}
        >
          感謝收看
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #C084FC, #F472B6, transparent)",
            marginBottom: 20,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(228, 220, 240, 0.6)",
            letterSpacing: "0.08em",
            marginBottom: 40,
          }}
        >
          青春就是這麼荒謬又美好
        </div>

        {/* Credits */}
        <div
          style={{
            fontSize: 20,
            color: "rgba(192, 132, 252, 0.4)",
            letterSpacing: "0.05em",
          }}
        >
          青春笑話劇場 — 第一集
        </div>
      </div>
    </AbsoluteFill>
  );
};
