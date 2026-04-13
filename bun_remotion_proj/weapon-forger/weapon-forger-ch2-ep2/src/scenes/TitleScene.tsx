import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { notoSansTC } from "../../../fixture/characters";

/**
 * Title Scene — 誰讓他煉器的！ 第二章 第二集：低語洞窟
 * Consistent with series title style.
 */
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gradientShift = interpolate(frame, [0, 300], [0, 30], {
    extrapolateRight: "clamp",
  });

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80, mass: 1 },
  });

  const subtitleSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const epScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 8, stiffness: 120 },
  });

  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.3, 0.7]);

  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${135 + gradientShift}deg, #0a0a1e 0%, #1a0a2e 30%, #2a1a0e 60%, #0a0a1e 100%)`,
      }} />

      {/* Forge fire glow */}
      <div style={{
        position: "absolute",
        top: "35%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%)",
        opacity: glowPulse,
        filter: "blur(40px)",
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: notoSansTC,
        zIndex: 10,
      }}>
        {/* Episode tag */}
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#F59E0B",
          letterSpacing: "0.3em",
          opacity: epScale,
          transform: `scale(${epScale})`,
          marginBottom: 20,
          textShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
        }}>
          第二章 第二集
        </div>

        {/* Main title */}
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: "#fff",
          transform: `scale(${titleSpring})`,
          textShadow: "0 0 40px rgba(245, 158, 11, 0.4), 0 0 80px rgba(56, 189, 248, 0.3), 0 4px 20px rgba(0,0,0,0.8)",
          letterSpacing: "0.1em",
          marginBottom: 30,
        }}>
          誰讓他煉器的！
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 44,
          fontWeight: 700,
          color: "#38BDF8",
          opacity: subtitleSpring,
          transform: `translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`,
          textShadow: "0 0 30px rgba(56, 189, 248, 0.5), 0 2px 10px rgba(0,0,0,0.6)",
          letterSpacing: "0.15em",
        }}>
          低語洞窟
        </div>

        <div style={{
          width: interpolate(subtitleSpring, [0, 1], [0, 400]),
          height: 2,
          background: "linear-gradient(90deg, transparent, #38BDF8, transparent)",
          marginTop: 30,
          opacity: subtitleSpring * 0.7,
        }} />
      </div>
    </AbsoluteFill>
  );
};
