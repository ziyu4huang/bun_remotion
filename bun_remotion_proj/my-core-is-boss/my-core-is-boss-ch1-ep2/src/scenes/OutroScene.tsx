import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "../../../assets/characters";

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
  const summaryOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Teaser section
  const teaserOpacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teaserY = interpolate(frame, [90, 115], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Decorative line
  const dividerWidth = interpolate(frame, [80, 110], [0, 400], {
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

      {/* Summary */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: summaryOpacity,
        textAlign: "center",
        fontFamily: notoSansTC,
      }}>
        <div style={{
          fontSize: 36,
          color: "#94A3B8",
          lineHeight: 2,
          maxWidth: 1200,
          letterSpacing: "0.05em",
        }}>
          林逸用系統的「跳過」功能，三秒鐘完成了宗門任務。
          <br />
          趙小七把這解讀為「以大乘期修為直取天道本源」。
          <br />
          而蕭長老聽說此事後，開始暗中記錄林逸的每一句話。
        </div>
      </div>

      {/* Divider */}
      <div style={{
        position: "absolute",
        top: "55%",
        left: "50%",
        transform: "translateX(-50%)",
        width: dividerWidth,
        height: 2,
        background: "linear-gradient(90deg, transparent, #F59E0B, transparent)",
      }} />

      {/* Teaser */}
      <div style={{
        position: "absolute",
        top: "60%",
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
          第一章第三集：Bug 利用
        </div>
        <div style={{
          fontFamily: notoSansTC,
          fontSize: 28,
          color: "#94A3B8",
          marginTop: 16,
          letterSpacing: "0.05em",
        }}>
          宗門大比，林逸發現比武台有碰撞體 Bug……
        </div>
      </div>

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
