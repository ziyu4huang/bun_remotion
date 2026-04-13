import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { SubtitleBar } from "../components/SubtitleBar";

interface TitleSceneProps {
  title: string;
  subtitle?: string;
}

export const TitleScene: React.FC<TitleSceneProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title entrance with trail
  const titleProgress = spring({ frame, fps, config: { damping: 10, stiffness: 150 } });
  const titleScale = interpolate(titleProgress, [0, 1], [0.5, 1]);
  const titleOpacity = interpolate(titleProgress, [0, 0.5], [0, 1]);

  // Subtitle delayed entrance
  const subtitleProgress = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  const subtitleY = interpolate(subtitleProgress, [0, 1], [50, 0]);

  // Accent lines — grow from center
  const lineWidth = interpolate(frame, [8, 45], [0, 300], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Glow pulse on title
  const glowSize = interpolate(Math.sin(frame * 0.06), [-1, 1], [10, 25]);

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
        gradientSpeed={15}
      />

      <CharacterAvatar emotion="smug" />

      {/* Content area */}
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
          padding: "0 60px",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: `linear-gradient(90deg, transparent, #00d4ff, transparent)`,
            marginBottom: 30,
            boxShadow: `0 0 ${glowSize}px rgba(0, 212, 255, 0.6)`,
          }}
        />

        {/* Main title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            textShadow: `0 0 ${glowSize}px rgba(0, 212, 255, 0.4), 0 4px 20px rgba(0,0,0,0.5)`,
            fontFamily: "sans-serif",
          }}
        >
          {title.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              marginTop: 24,
              transform: `translateY(${subtitleY}px)`,
              opacity: subtitleProgress,
              fontFamily: "sans-serif",
              fontStyle: "italic",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Bottom accent line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: `linear-gradient(90deg, transparent, #00d4ff, transparent)`,
            marginTop: 30,
            boxShadow: `0 0 ${glowSize}px rgba(0, 212, 255, 0.6)`,
          }}
        />
      </div>

      <SubtitleBar text="Let's be honest. Your code sucks. And deep down... you know it." wordsPerSecond={3.0} />
    </div>
  );
};
