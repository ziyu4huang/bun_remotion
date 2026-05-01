import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "../../../assets/characters";
import { QuestBadge, UnlockingTeaser } from "../../../assets/components/QuestBadge";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const summaryOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teaserOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teaserY = interpolate(frame, [120, 145], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const dividerWidth = interpolate(frame, [110, 140], [0, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a2e 0%, #0a1a3e 50%, #1a0a2e 100%)",
        opacity: fadeIn * fadeOut,
      }}
    >
      <div style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)`,
        filter: "blur(40px)",
      }} />

      <QuestBadge
        title="秘境速通完成"
        subtitle="仇恨繞柱 · 地板穿模 · 經典"
        color="#F97316"
        delay={10}
      />

      <div style={{
        position: "absolute",
        top: "38%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: summaryOpacity,
        textAlign: "center",
        fontFamily: notoSansTC,
      }}>
        <div style={{
          fontSize: 28,
          color: "#94A3B8",
          lineHeight: 2.2,
          maxWidth: 1100,
          letterSpacing: "0.05em",
        }}>
          [仇恨繞柱 ✓] [Boss AI：卡住 ×3] [地板穿模：1 次] [崩潰進度：55%]
        </div>
      </div>

      <div style={{
        position: "absolute",
        top: "58%",
        left: "50%",
        transform: "translateX(-50%)",
        width: dividerWidth,
        height: 2,
        background: "linear-gradient(90deg, transparent, #F97316, transparent)",
      }} />

      <div style={{
        position: "absolute",
        top: "62%",
        left: "50%",
        transform: `translateX(-50%) translateY(${teaserY}px)`,
        opacity: teaserOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: notoSansTC,
          fontSize: 24,
          color: "#F97316",
          fontWeight: 700,
          letterSpacing: "0.2em",
          marginBottom: 16,
        }}>
          下章預告
        </div>
        <div style={{
          fontFamily: maShanZheng,
          fontSize: 56,
          color: "#fff",
          fontWeight: 700,
          textShadow: "0 0 30px rgba(249, 115, 22, 0.4)",
          letterSpacing: "0.1em",
        }}>
          第四章：副本開團
        </div>
      </div>

      <UnlockingTeaser
        text="第四章 解鎖進度：10%"
        color="#F97316"
        delay={130}
      />

      <div style={{
        position: "absolute",
        bottom: 60,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: notoSansTC,
        fontSize: 20,
        color: "#475569",
        letterSpacing: "0.15em",
      }}>
        我的核心是大佬
      </div>
    </AbsoluteFill>
  );
};
