import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { SubtitleBar } from "../components/SubtitleBar";

interface OutroSceneProps {
  text: string;
  subtitle: string;
}

export const OutroScene: React.FC<OutroSceneProps> = ({ text, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Main text entrance
  const textProgress = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 150 } });
  const textScale = interpolate(textProgress, [0, 1], [0.7, 1]);

  // CTA buttons staggered entrance
  const cta1Progress = spring({ frame: frame - 30, fps, config: { damping: 15, stiffness: 200 } });
  const cta2Progress = spring({ frame: frame - 38, fps, config: { damping: 12, stiffness: 250 } });
  const cta3Progress = spring({ frame: frame - 46, fps, config: { damping: 15, stiffness: 200 } });

  // Glow pulse
  const glowSize = interpolate(Math.sin(frame * 0.06), [-1, 1], [8, 20]);

  // Scene fade out
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      <AnimatedBackground
        colorFrom="#080c18"
        colorTo="#0f1830"
        accentColor="rgba(0, 212, 255, 0.25)"
        gradientSpeed={12}
      />

      <CharacterAvatar emotion="happy" />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 420,
          right: 0,
          bottom: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.3,
            transform: `scale(${textScale})`,
            opacity: textProgress,
            textShadow: `0 0 ${glowSize}px rgba(0, 212, 255, 0.3), 0 4px 20px rgba(0,0,0,0.5)`,
            fontFamily: "sans-serif",
          }}
        >
          {text.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ marginTop: 50, display: "flex", gap: 24 }}>
          {/* Like */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: 50,
              border: "2px solid rgba(255, 255, 255, 0.15)",
              transform: `translateY(${interpolate(cta1Progress, [0, 1], [40, 0])}px) scale(${cta1Progress})`,
              opacity: cta1Progress,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontSize: 28 }}>👍</span>
            <span style={{ color: "white", fontSize: 22, fontWeight: 600, fontFamily: "sans-serif" }}>Like</span>
          </div>

          {/* Subscribe */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 32px",
              backgroundColor: "#ff0033",
              borderRadius: 50,
              transform: `translateY(${interpolate(cta2Progress, [0, 1], [40, 0])}px) scale(${cta2Progress})`,
              opacity: cta2Progress,
              boxShadow: `0 0 ${glowSize}px rgba(255, 0, 51, 0.4), 0 4px 20px rgba(0,0,0,0.3)`,
            }}
          >
            <span style={{ fontSize: 28 }}>🔔</span>
            <span style={{ color: "white", fontSize: 22, fontWeight: 700, fontFamily: "sans-serif" }}>Subscribe</span>
          </div>

          {/* Comment */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: 50,
              border: "2px solid rgba(255, 255, 255, 0.15)",
              transform: `translateY(${interpolate(cta3Progress, [0, 1], [40, 0])}px) scale(${cta3Progress})`,
              opacity: cta3Progress,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontSize: 28 }}>💬</span>
            <span style={{ color: "white", fontSize: 22, fontWeight: 600, fontFamily: "sans-serif" }}>Comment</span>
          </div>
        </div>
      </div>

      <SubtitleBar text={subtitle} wordsPerSecond={3.2} />
    </div>
  );
};
