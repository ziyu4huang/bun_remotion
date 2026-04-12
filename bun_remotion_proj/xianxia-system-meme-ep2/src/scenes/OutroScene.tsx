import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { notoSansTC } from "../characters";

/**
 * Outro Scene — Credits
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
        background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a0a2e 100%)",
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
        {/* Thanks */}
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: "#fff",
          transform: `scale(${titleSpring})`,
          textShadow: "0 0 30px rgba(96, 165, 250, 0.4), 0 0 60px rgba(244, 114, 182, 0.3)",
          letterSpacing: "0.15em",
        }}>
          感謝觀看
        </div>

        {/* Series title */}
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#F472B6",
          opacity: creditSpring,
          transform: `translateY(${interpolate(creditSpring, [0, 1], [15, 0])}px)`,
          textShadow: "0 0 20px rgba(244, 114, 182, 0.4)",
        }}>
          系統文小說梗 第二集
        </div>

        {/* Credits */}
        <div style={{
          fontSize: 24,
          color: "#94A3B8",
          opacity: credit2Spring,
          transform: `translateY(${interpolate(credit2Spring, [0, 1], [10, 0])}px)`,
          lineHeight: 2,
          textAlign: "center",
        }}>
          <div>製作：Bun + Remotion</div>
          <div>配音：AI TTS</div>
          <div>戰鬥特效：EnergyWave / KamehamehaBeam</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
