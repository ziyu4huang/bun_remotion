import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { maShanZheng, notoSansTC } from "../../../assets/characters";
import { SystemNotification } from "../../../assets/components/SystemOverlay";

// TODO: Customize title text, gradient colors, and series subtitle
const SERIES_TITLE = "誰讓他煉器的！";
const SERIES_SUBTITLE = "智商測試";
const EPISODE_LABEL = "第3章 第2集";

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

  // Chapter/episode info
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

  // Ambient pulse glow
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
      {/* Background glow with pulse */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(239, 68, 68, ${glowPulse}) 0%, transparent 70%)`,
        filter: "blur(40px)",
      }} />

      {/* Flash effect */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9), transparent 70%)",
        opacity: flashOpacity,
      }} />

      {/* System stinger notification */}
      {frame >= 35 && frame <= 95 && (
        <SystemNotification
          text={`新集數已解鎖：第3章第2集`}
          type="info"
          delay={35}
        />
      )}

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
          textShadow: "0 0 40px rgba(239, 68, 68, 0.6), 0 4px 20px rgba(0,0,0,0.5)",
          letterSpacing: "0.15em",
        }}>
          {SERIES_TITLE}
        </div>

        {/* Decorative line */}
        <div style={{
          width: lineWidth,
          height: 3,
          background: "linear-gradient(90deg, transparent, #EF4444, #A78BFA, transparent)",
          margin: "20px auto 0",
          borderRadius: 2,
        }} />
      </div>

      {/* Subtitle */}
      {SERIES_SUBTITLE && (
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
            {SERIES_SUBTITLE}
          </div>
        </div>
      )}

      {/* Episode info */}
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
          color: "#EF4444",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textShadow: "0 0 20px rgba(239, 68, 68, 0.4)",
        }}>
          {/* TODO: Update episode label */}
          {EPISODE_LABEL}
        </div>
      </div>
    </AbsoluteFill>
  );
};
