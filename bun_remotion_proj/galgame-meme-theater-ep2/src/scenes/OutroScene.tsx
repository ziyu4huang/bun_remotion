import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out at the end
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
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
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #2d0a3e 0%, #1a0a2e 50%, #0f1b3e 100%)"
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
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 30px rgba(129, 140, 248, 0.4)",
            letterSpacing: "0.1em",
            marginBottom: 20,
          }}
        >
          感謝收看
        </div>

        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #818CF8, #F472B6, transparent)",
            marginBottom: 20,
          }}
        />

        <div
          style={{
            fontSize: 28,
            color: "rgba(228, 220, 240, 0.6)",
            letterSpacing: "0.08em",
            marginBottom: 40,
          }}
        >
          再一局就睡，打折再買一個，都是隊友的錯
        </div>

        <div
          style={{
            fontSize: 20,
            color: "rgba(129, 140, 248, 0.4)",
            letterSpacing: "0.05em",
          }}
        >
          美少女梗圖劇場 — 第二集 · 網路與遊戲篇
        </div>
      </div>
    </AbsoluteFill>
  );
};
