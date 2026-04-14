import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { notoSansTC } from "../../../assets/characters";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Content animations
  const contentOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentY = interpolate(frame, [15, 45], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Decorative line
  const lineWidth = interpolate(frame, [30, 55], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Character color bars
  const charBars = [
    { color: "#F472B6", name: "小雪", delay: 35 },
    { color: "#818CF8", name: "小月", delay: 45 },
    { color: "#FB923C", name: "小樱", delay: 55 },
  ];

  // Subtitle items
  const subtitles = [
    { text: "面試要會包裝", delay: 60 },
    { text: "老闆的餅看看就好", delay: 72 },
    { text: "開會帶耳機保平安", delay: 84 },
    { text: "準時下班是一種勇氣", delay: 96 },
  ];

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #0a1a2e 0%, #1a0a3e 40%, #0f2a1e 70%, #0a0a2e 100%)"
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
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 30px rgba(6, 214, 160, 0.4), 0 0 60px rgba(244, 114, 182, 0.2)",
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
            background: "linear-gradient(90deg, transparent, #06D6A0, #FFD700, #F472B6, transparent)",
            marginBottom: 24,
          }}
        />

        {/* Character color bars */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 30,
          }}
        >
          {charBars.map((bar, i) => {
            const barScale = interpolate(frame, [bar.delay, bar.delay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(0.5)),
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transform: `scale(${barScale})`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: bar.color,
                    boxShadow: `0 0 10px ${bar.color}66`,
                  }}
                />
                <div
                  style={{
                    color: bar.color,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {bar.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtitle items */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {subtitles.map((sub, i) => {
            const subOpacity = interpolate(frame, [sub.delay, sub.delay + 12], [0, 0.6], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  fontSize: 22,
                  color: `rgba(228, 220, 240, ${subOpacity})`,
                  letterSpacing: "0.06em",
                }}
              >
                {sub.text}
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontSize: 18,
            color: "rgba(6, 214, 160, 0.4)",
            letterSpacing: "0.05em",
            marginTop: 40,
            opacity: interpolate(frame, [100, 115], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          美少女梗圖劇場 — 第五集 · 職場求生指南
        </div>
      </div>
    </AbsoluteFill>
  );
};
