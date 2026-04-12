import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { notoSansTC } from "../characters";

/**
 * Title Scene — 系統文小說梗 第二集：師姐的龜派氣功
 */
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient animation
  const gradientShift = interpolate(frame, [0, 300], [0, 30], {
    extrapolateRight: "clamp",
  });

  // Title spring entrance
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80, mass: 1 },
  });

  // Subtitle delay
  const subtitleSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  // Episode number bounce
  const epScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 8, stiffness: 120 },
  });

  // Glow pulse
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.3, 0.7]);

  // Slash teaser line (subtle)
  const slashOpacity = interpolate(frame, [30, 40, 60, 80], [0, 0.4, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Animated background */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${135 + gradientShift}deg, #0a0a2e 0%, #1a0a3e 30%, #2a0a4e 60%, #0a1a2e 100%)`,
      }} />

      {/* Radial energy glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(244, 114, 182, 0.15), transparent 70%)",
        opacity: glowPulse,
        filter: "blur(40px)",
      }} />

      {/* Slash teaser */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox="0 0 1920 1080">
        <path
          d="M 300 900 Q 960 100 1620 700"
          stroke="#F472B6"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          opacity={slashOpacity}
        />
      </svg>

      {/* Content */}
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
        {/* Episode number */}
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#F472B6",
          letterSpacing: "0.3em",
          opacity: epScale,
          transform: `scale(${epScale})`,
          marginBottom: 20,
          textShadow: "0 0 20px rgba(244, 114, 182, 0.5)",
        }}>
          第二集
        </div>

        {/* Main title */}
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: "#fff",
          transform: `scale(${titleSpring})`,
          textShadow: "0 0 40px rgba(96, 165, 250, 0.4), 0 0 80px rgba(244, 114, 182, 0.3), 0 4px 20px rgba(0,0,0,0.8)",
          letterSpacing: "0.1em",
          marginBottom: 30,
        }}>
          系統文小說梗
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 44,
          fontWeight: 700,
          color: "#F472B6",
          opacity: subtitleSpring,
          transform: `translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`,
          textShadow: "0 0 30px rgba(244, 114, 182, 0.5), 0 2px 10px rgba(0,0,0,0.6)",
          letterSpacing: "0.15em",
        }}>
          師姐的龜派氣功
        </div>

        {/* Decorative line */}
        <div style={{
          width: interpolate(subtitleSpring, [0, 1], [0, 400]),
          height: 2,
          background: "linear-gradient(90deg, transparent, #F472B6, transparent)",
          marginTop: 30,
          opacity: subtitleSpring * 0.7,
        }} />
      </div>
    </AbsoluteFill>
  );
};
