import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CHARACTERS, notoSansTC, effectToEmoji, type DialogLine } from "../characters";

interface DialogBoxProps {
  lines: DialogLine[];
  sceneFrame: number;
  sceneDuration: number;
}

export const DialogBox: React.FC<DialogBoxProps> = ({
  lines,
  sceneFrame,
  sceneDuration,
}) => {
  const { fps } = useVideoConfig();

  const lineDuration = sceneDuration / lines.length;
  const currentLineIndex = Math.min(
    Math.floor(sceneFrame / lineDuration),
    lines.length - 1,
  );
  const currentLine = lines[currentLineIndex];
  const character = CHARACTERS[currentLine.character];

  // Typewriter effect
  const lineFrame = sceneFrame - currentLineIndex * lineDuration;
  const charsPerFrame = 2.5;
  const visibleChars = Math.floor(lineFrame * charsPerFrame);
  const displayText = currentLine.text.slice(0, visibleChars);
  const isTypingDone = visibleChars >= currentLine.text.length;

  // Blinking cursor
  const cursorVisible = isTypingDone && Math.sin(sceneFrame * 0.15) > 0;

  // Box entrance animation
  const boxSpring = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const boxY = interpolate(boxSpring, [0, 1], [40, 0]);

  // Name badge entrance
  const nameSpring = spring({
    frame: Math.max(0, sceneFrame - 3),
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.5 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 60,
        right: 60,
        transform: `translateY(${boxY}px)`,
        fontFamily: notoSansTC,
        zIndex: 100,
      }}
    >
      <div
        style={{
          position: "relative",
          background: "rgba(255, 255, 255, 0.92)",
          border: "3px solid rgba(30, 20, 60, 0.85)",
          borderRadius: 12,
          padding: "20px 32px 24px",
          boxShadow:
            "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
          minHeight: 140,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Character name plate */}
        <div
          style={{
            position: "absolute",
            top: -42,
            left: 24,
            transform: `scale(${nameSpring})`,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              backgroundColor: character.color,
              color: "#fff",
              padding: "6px 28px",
              borderRadius: 8,
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "0.08em",
              boxShadow: `0 2px 8px ${character.color}66`,
              border: "2px solid rgba(0,0,0,0.2)",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {character.name}
            {currentLine.effect && (
              <span style={{ marginLeft: 8 }}>
                {effectToEmoji(currentLine.effect)}
              </span>
            )}
          </div>
        </div>

        {/* Dialog text */}
        <div
          style={{
            color: "#1a1a2e",
            fontSize: 42,
            lineHeight: 1.8,
            letterSpacing: "0.03em",
            marginTop: 20,
            fontWeight: 500,
          }}
        >
          {displayText}
          {cursorVisible && (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 42,
                backgroundColor: character.color,
                marginLeft: 3,
                verticalAlign: "middle",
                borderRadius: 2,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
