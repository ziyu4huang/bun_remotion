import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { notoSansTC } from "../characters";

/**
 * Outro Scene — Credits + next episode teaser
 */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const creditSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const credit2Spring = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const fadeOut = interpolate(frame, [150, 200], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #0a0a1e 0%, #1a0a2e 50%, #0a0a1e 100%)",
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: notoSansTC,
        opacity: fadeOut,
        zIndex: 10,
        gap: 30,
      }}>
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: "#fff",
          transform: `scale(${titleSpring})`,
          textShadow: "0 0 30px rgba(245, 158, 11, 0.4), 0 0 60px rgba(52, 211, 153, 0.3)",
          letterSpacing: "0.15em",
        }}>
          感谢观看
        </div>

        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#F59E0B",
          opacity: creditSpring,
          transform: `translateY(${interpolate(creditSpring, [0, 1], [15, 0])}px)`,
          textShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
        }}>
          谁让他炼器的！ 第一章 第一集
        </div>

        <div style={{
          fontSize: 24,
          color: "#94A3B8",
          opacity: credit2Spring,
          transform: `translateY(${interpolate(credit2Spring, [0, 1], [10, 0])}px)`,
          lineHeight: 2,
          textAlign: "center",
        }}>
          <div>制作：Bun + Remotion</div>
          <div>配音：AI TTS</div>
          <div style={{ color: "#F59E0B", marginTop: 10 }}>下集预告：自动寻路飞剑</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
