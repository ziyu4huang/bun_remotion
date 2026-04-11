import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { CHARACTERS, notoSansTC, type DialogLine, type Character } from "../characters";

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

  // Each dialog line gets an equal share of the scene
  const lineDuration = sceneDuration / lines.length;
  const currentLineIndex = Math.min(
    Math.floor(sceneFrame / lineDuration),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];
  const character = CHARACTERS[currentLine.character];

  // Typewriter effect: show chars based on progress within this line's time slot
  const lineFrame = sceneFrame - currentLineIndex * lineDuration;
  const charsPerFrame = 2.5;
  const visibleChars = Math.floor(lineFrame * charsPerFrame);
  const displayText = currentLine.text.slice(0, visibleChars);
  const isTypingDone = visibleChars >= currentLine.text.length;

  // Blinking cursor
  const cursorVisible = isTypingDone && Math.sin(sceneFrame * 0.2) > 0;

  // Box entrance animation
  const boxOpacity = interpolate(sceneFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const boxY = interpolate(sceneFrame, [0, 15], [40, 0], {
    extrapolateRight: "clamp",
  });

  // Name badge slide in
  const nameOpacity = interpolate(sceneFrame, [5, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const nameX = interpolate(sceneFrame, [5, 20], [-20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "35%",
        background:
          "linear-gradient(to top, rgba(10, 5, 30, 0.95) 0%, rgba(10, 5, 30, 0.85) 80%, transparent 100%)",
        opacity: boxOpacity,
        transform: `translateY(${boxY}px)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 60px 50px",
        fontFamily: notoSansTC,
      }}
    >
      {/* Character name badge */}
      <div
        style={{
          opacity: nameOpacity,
          transform: `translateX(${nameX}px)`,
          marginBottom: 12,
          display: "inline-flex",
          alignSelf: "flex-start",
        }}
      >
        <div
          style={{
            backgroundColor: character.bgColor,
            border: `2px solid ${character.color}`,
            borderRadius: 8,
            padding: "6px 20px",
            color: character.color,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {character.name}
        </div>
      </div>

      {/* Dialog text */}
      <div
        style={{
          color: "#E8E0F0",
          fontSize: 36,
          lineHeight: 1.7,
          letterSpacing: "0.02em",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
          minHeight: 70,
        }}
      >
        {displayText}
        {cursorVisible && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 36,
              backgroundColor: character.color,
              marginLeft: 2,
              verticalAlign: "middle",
            }}
          />
        )}
      </div>

      {/* Scene number indicator */}
      <div
        style={{
          position: "absolute",
          top: 15,
          right: 60,
          color: "rgba(255, 255, 255, 0.3)",
          fontSize: 18,
          fontFamily: notoSansTC,
        }}
      >
        {currentLineIndex + 1} / {lines.length}
      </div>
    </div>
  );
};
