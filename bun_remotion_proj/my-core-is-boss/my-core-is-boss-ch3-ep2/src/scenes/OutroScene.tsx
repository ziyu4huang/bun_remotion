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
        background: "radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />

      <QuestBadge
        title="隱藏關卡"
        subtitle="查看代碼、17 個 bug、守護者崩潰"
        color="#60A5FA"
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
          fontSize: 32,
          color: "#94A3B8",
          lineHeight: 2.2,
          maxWidth: 1100,
          letterSpacing: "0.05em",
        }}>
          趙小七《迷宮源代碼分析手冊》正式開篇，蕭長老決定重新學習基礎陣法。
          <br />
          <span style={{ color: "#64748B", fontSize: 24 }}>
            [查看代碼 ✓] [迷宮 bug：17 個] [崩潰進度：50%] [守護者遺言：寫單元測試]
          </span>
        </div>
      </div>

      <div style={{
        position: "absolute",
        top: "58%",
        left: "50%",
        transform: "translateX(-50%)",
        width: dividerWidth,
        height: 2,
        background: "linear-gradient(90deg, transparent, #60A5FA, transparent)",
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
          color: "#60A5FA",
          fontWeight: 700,
          letterSpacing: "0.2em",
          marginBottom: 16,
        }}>
          下集預告
        </div>
        <div style={{
          fontFamily: maShanZheng,
          fontSize: 56,
          color: "#fff",
          fontWeight: 700,
          textShadow: "0 0 30px rgba(96, 165, 250, 0.4)",
          letterSpacing: "0.1em",
        }}>
          秘境 BOSS
        </div>
        <div style={{
          fontFamily: notoSansTC,
          fontSize: 28,
          color: "#94A3B8",
          marginTop: 16,
          letterSpacing: "0.05em",
        }}>
          仇恨繞柱對決上古兇獸——Boss 的 AI 到底是怎麼寫的？
        </div>
      </div>

      <UnlockingTeaser
        text="Ch3-Ep3 解鎖進度：30%"
        color="#38BDF8"
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
        我的核心是大佬 — 系統誤會流喜劇
      </div>
    </AbsoluteFill>
  );
};
