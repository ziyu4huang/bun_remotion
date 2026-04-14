import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "../../../fixture/characters";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Flash at the start
  const flashOpacity = interpolate(frame, [5, 12, 22], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title scale-in with spring overshoot
  const titleScale = interpolate(frame, [10, 40], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.3)),
  });

  const titleOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle slides in after title
  const subtitleY = interpolate(frame, [30, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subtitleOpacity = interpolate(frame, [30, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chapter info
  const chapterOpacity = interpolate(frame, [50, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at the end
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative line
  const lineWidth = interpolate(frame, [15, 45], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a2e 0%, #0a1a3e 50%, #1a0a2e 100%)",
        opacity: fadeOut,
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />

      {/* Flash effect */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9), transparent 70%)",
        opacity: flashOpacity,
      }} />

      {/* Main title */}
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
          textShadow: "0 0 40px rgba(59, 130, 246, 0.6), 0 4px 20px rgba(0,0,0,0.5)",
          letterSpacing: "0.15em",
        }}>
          我的核心是大佬
        </div>

        {/* Decorative line */}
        <div style={{
          width: lineWidth,
          height: 3,
          background: "linear-gradient(90deg, transparent, #3B82F6, #A78BFA, transparent)",
          margin: "20px auto 0",
          borderRadius: 2,
        }} />
      </div>

      {/* Subtitle */}
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

      {/* Chapter / Episode info */}
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
          第一章 — 系統覺醒
        </div>
        <div style={{
          fontSize: 28,
          color: "#38BDF8",
          fontWeight: 500,
          marginTop: 12,
          letterSpacing: "0.1em",
        }}>
          第二集：任務跳過
        </div>
      </div>
    </AbsoluteFill>
  );
};
