import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { notoSansTC } from "../characters";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const contentOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const contentY = interpolate(frame, [15, 45], [30, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const lineWidth = interpolate(frame, [30, 55], [0, 200], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const charBars = [
    { color: "#60A5FA", name: "修修", delay: 35 },
    { color: "#34D399", name: "系統", delay: 45 },
    { color: "#F472B6", name: "師姐", delay: 55 },
  ];

  const subtitles = [
    { text: "系統永遠不會放過你", delay: 60 },
    { text: "表白要趁早，不然系統會幫你", delay: 72 },
    { text: "Q版戰鬥是認真的", delay: 84 },
    { text: "師姐永遠是最大的BOSS", delay: 96 },
  ];

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <BackgroundLayer gradient="linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 40%, #0a2a1e 70%, #0a0a2e 100%)" />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: notoSansTC, opacity: contentOpacity,
        transform: `translateY(${contentY}px)`,
      }}>
        <div style={{
          fontSize: 60, fontWeight: 700, color: "#F3E8FF",
          textShadow: "0 0 30px rgba(52, 211, 153, 0.4), 0 0 60px rgba(96, 165, 250, 0.2)",
          letterSpacing: "0.1em", marginBottom: 20,
        }}>
          感謝收看
        </div>

        <div style={{
          width: lineWidth, height: 2,
          background: "linear-gradient(90deg, transparent, #34D399, #60A5FA, #FFD700, transparent)",
          marginBottom: 24,
        }} />

        {/* Character color bars */}
        <div style={{ display: "flex", gap: 16, marginBottom: 30 }}>
          {charBars.map((bar, i) => {
            const barScale = interpolate(frame, [bar.delay, bar.delay + 10], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(0.5)),
            });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                transform: `scale(${barScale})`, transformOrigin: "center center",
              }}>
                <div style={{
                  width: 40, height: 4, borderRadius: 2,
                  backgroundColor: bar.color, boxShadow: `0 0 10px ${bar.color}66`,
                }} />
                <div style={{ color: bar.color, fontSize: 18, fontWeight: 700, letterSpacing: "0.05em" }}>
                  {bar.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtitle items */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {subtitles.map((sub, i) => {
            const subOpacity = interpolate(frame, [sub.delay, sub.delay + 12], [0, 0.6], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <div key={i} style={{
                fontSize: 22, color: `rgba(228, 220, 240, ${subOpacity})`, letterSpacing: "0.06em",
              }}>{sub.text}</div>
            );
          })}
        </div>

        <div style={{
          fontSize: 18, color: "rgba(52, 211, 153, 0.4)", letterSpacing: "0.05em", marginTop: 40,
          opacity: interpolate(frame, [100, 115], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          系統文小說梗 — 第一集 · 不完成任務就抹除
        </div>
      </div>
    </AbsoluteFill>
  );
};
