import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface SubtitleBarProps {
  text: string;
  /** Reveal text word-by-word */
  wordReveal?: boolean;
  /** Words per second for reveal animation */
  wordsPerSecond?: number;
  /** Accent color for highlight on current word */
  accentColor?: string;
}

/**
 * Bottom subtitle bar with fade in/out and optional word-by-word reveal.
 */
export const SubtitleBar: React.FC<SubtitleBarProps> = ({
  text,
  wordReveal = true,
  wordsPerSecond = 3.5,
  accentColor = "#00d4ff",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const barOpacity = Math.min(fadeIn, fadeOut);

  if (wordReveal) {
    const words = text.split(" ");
    const wordsToShow = Math.floor((frame / fps) * wordsPerSecond);
    const visibleWords = words.slice(0, wordsToShow + 1);

    return (
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          opacity: barOpacity,
          backdropFilter: "blur(4px)",
          borderTop: `1px solid rgba(255,255,255,0.05)`,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 34,
            fontFamily: "sans-serif",
            fontWeight: 500,
            letterSpacing: "0.3px",
            lineHeight: 1.3,
            textAlign: "center",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {visibleWords.map((word, i) => {
            const isCurrent = i === wordsToShow;
            const isLast = i === visibleWords.length - 1 && wordsToShow < words.length - 1;
            return (
              <span key={i}>
                <span
                  style={{
                    color: isCurrent ? accentColor : "white",
                    transition: "color 0.1s",
                  }}
                >
                  {word}
                </span>
                {i < visibleWords.length - 1 ? " " : ""}
                {isLast && (
                  <span
                    style={{
                      opacity: interpolate(Math.sin(frame * 0.15), [-1, 1], [0.3, 1]),
                      color: accentColor,
                    }}
                  >
                    |
                  </span>
                )}
              </span>
            );
          })}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        opacity: barOpacity,
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 34,
          fontFamily: "sans-serif",
          fontWeight: 500,
          letterSpacing: "0.3px",
          lineHeight: 1.3,
          textAlign: "center",
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </span>
    </div>
  );
};
