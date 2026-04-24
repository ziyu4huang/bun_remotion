import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "../../../assets/characters";
import { SystemNotification } from "../../../assets/components/SystemOverlay";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const flashOpacity = interpolate(frame, [5, 12, 22], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [10, 40], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.3)),
  });

  const titleOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [30, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subtitleOpacity = interpolate(frame, [30, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chapterOpacity = interpolate(frame, [50, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [15, 45], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const glowPulse = interpolate(frame % 120, [0, 60, 120], [0.12, 0.2, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a2e 0%, #0a1a3e 50%, #1a0a2e 100%)",
        opacity: fadeOut,
      }}
    >
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(245, 158, 11, ${glowPulse}) 0%, transparent 70%)`,
        filter: "blur(40px)",
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9), transparent 70%)",
        opacity: flashOpacity,
      }} />

      {frame >= 35 && frame <= 95 && (
        <SystemNotification
          text="技能點已累積：52 點 — 請分配至天賦樹"
          type="mission"
          delay={35}
        />
      )}

      <div style={{
        position: "absolute",
        top: "25%",
        left: "50%",
        transform: `translateX(-50%) scale(${titleScale})`,
        opacity: titleOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: maShanZheng,
          fontSize: 120,
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 0 40px rgba(245, 158, 11, 0.6), 0 4px 20px rgba(0,0,0,0.5)",
          letterSpacing: "0.15em",
        }}>
          我的核心是大佬
        </div>

        <div style={{
          width: lineWidth,
          height: 3,
          background: "linear-gradient(90deg, transparent, #F59E0B, #A78BFA, transparent)",
          margin: "20px auto 0",
          borderRadius: 2,
        }} />
      </div>

      <div style={{
        position: "absolute",
        top: "52%",
        left: "50%",
        transform: `translateX(-50%) translateY(${subtitleY}px)`,
        opacity: subtitleOpacity,
        textAlign: "center",
        fontFamily: notoSansTC,
      }}>
        <div style={{
          fontSize: 48,
          color: "#94A3B8",
          fontWeight: 500,
          letterSpacing: "0.2em",
        }}>
          系統誤會流喜劇
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: chapterOpacity,
        textAlign: "center",
        fontFamily: notoSansTC,
      }}>
        <div style={{
          fontSize: 32,
          color: "#F59E0B",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
        }}>
          第二章 — 修煉就是練功
        </div>
        <div style={{
          fontSize: 28,
          color: "#A78BFA",
          fontWeight: 500,
          marginTop: 12,
          letterSpacing: "0.1em",
        }}>
          第三集：技能點分配
        </div>
      </div>
    </AbsoluteFill>
  );
};
