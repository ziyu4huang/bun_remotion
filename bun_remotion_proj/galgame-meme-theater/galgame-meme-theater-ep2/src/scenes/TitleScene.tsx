import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { notoSansTC } from "../../../assets/characters";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade out at the end (overlap with next scene's fade-in)
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flash/bloom effect at the peak moment
  const flashOpacity = interpolate(frame, [8, 15, 25], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title scales in from 2.5x with spring + back easing (anime OP feel)
  const titleScale = interpolate(frame, [10, 40], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back({ overshoot: 0.3 })),
  });
  const titleOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative lines animate in
  const lineWidth = interpolate(frame, [20, 45], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Subtitle slides in after title
  const subtitleY = interpolate(frame, [30, 50], [25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subtitleOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "EP2" badge pulses in
  const badgeScale = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back({ overshoot: 0.5 })),
  });

  // Animated gradient hue shift
  const hue = interpolate(frame, [0, 120], [270, 310], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <BackgroundLayer
        gradient={`linear-gradient(135deg, hsl(${hue}, 50%, 15%) 0%, hsl(${hue + 30}, 40%, 12%) 40%, hsl(${hue + 60}, 45%, 10%) 100%)`}
      />

      {/* Flash/bloom overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#fff",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: notoSansTC,
        }}
      >
        {/* Top decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #F472B6, #818CF8, transparent)",
            marginBottom: 28,
            opacity: titleOpacity,
          }}
        />

        {/* Title — dramatic scale-in */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 40px rgba(244, 114, 182, 0.6), 0 4px 16px rgba(0,0,0,0.7)",
            letterSpacing: "0.12em",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
          }}
        >
          美少女梗圖劇場
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #818CF8, #F472B6, transparent)",
            marginTop: 24,
            marginBottom: 20,
            opacity: titleOpacity,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(228, 220, 240, 0.7)",
            letterSpacing: "0.08em",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          — 網路與遊戲篇 —
        </div>

        {/* EP2 badge */}
        <div
          style={{
            marginTop: 30,
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              backgroundColor: "#F472B6",
              color: "#fff",
              padding: "6px 28px",
              borderRadius: 20,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.15em",
              boxShadow: "0 0 20px rgba(244, 114, 182, 0.5)",
            }}
          >
            第二集
          </div>
        </div>
      </div>

      {/* Floating particles (subtle, fewer than ep1) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = ((i * 37 + 13) % 100);
        const startY = 100 + ((i * 23) % 20);
        const size = 1.5 + (i % 3);
        const speed = 0.4 + (i % 3) * 0.25;
        const y = startY - (frame * speed) % 120;
        const opacity = interpolate(
          frame,
          [i * 4 + 15, i * 4 + 30, i * 4 + 80, i * 4 + 100],
          [0, 0.35, 0.35, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

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
              backgroundColor:
                i % 3 === 0 ? "#F472B6" : i % 3 === 1 ? "#818CF8" : "#FB923C",
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
