import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "../../../assets/characters";
import { QuestBadge, UnlockingTeaser } from "../../../assets/components/QuestBadge";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Summary text
  const summaryOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Teaser section
  const teaserOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teaserY = interpolate(frame, [120, 145], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Decorative line
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
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />

      {/* Quest Complete badge */}
      <QuestBadge
        title="掛機修仙"
        subtitle="三天閉關，連升五十級"
        color="#F59E0B"
        delay={10}
      />

      {/* Summary */}
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
          趙小七寫下十萬字觀察日記，正式將語錄升級為「觀察報告」系列。
          <br />
          <span style={{ color: "#64748B", fontSize: 24 }}>
            [趙小七觀察日記 +100,000字] [蕭長老功法 -1]
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        position: "absolute",
        top: "58%",
        left: "50%",
        transform: "translateX(-50%)",
        width: dividerWidth,
        height: 2,
        background: "linear-gradient(90deg, transparent, #F59E0B, transparent)",
      }} />

      {/* Teaser */}
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
          color: "#F59E0B",
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
          textShadow: "0 0 30px rgba(245, 158, 11, 0.4)",
          letterSpacing: "0.1em",
        }}>
          第二章第二集：經驗值農場
        </div>
        <div style={{
          fontFamily: notoSansTC,
          fontSize: 28,
          color: "#94A3B8",
          marginTop: 16,
          letterSpacing: "0.05em",
        }}>
          靈獸洞窟，定點刷怪升級……
        </div>
      </div>

      {/* System unlocking teaser */}
      <UnlockingTeaser
        text="Ch2-Ep2 解鎖進度：64%"
        color="#38BDF8"
        delay={130}
      />

      {/* Series title at bottom */}
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
