import React from "react";
import { Img, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CHARACTERS, type Character } from "../characters";

interface CharacterSpriteProps {
  character: Character;
  image?: string;
  /** Whether this character is currently speaking */
  speaking?: boolean;
  /** Side of the screen */
  side?: "left" | "right";
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  character,
  image,
  speaking = true,
  side = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = CHARACTERS[character];

  // Slide in animation
  const slideX = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const fromX = side === "left" ? -200 : 200;
  const x = interpolate(slideX, [0, 1], [fromX, 0]);

  // Speaking glow pulse
  const glowOpacity = speaking
    ? interpolate(Math.sin(frame * 0.1), [-1, 1], [0.15, 0.4])
    : 0;

  // Dimming for non-speaking
  const dimOpacity = speaking ? 1 : 0.5;

  // Slight breathing animation
  const breathScale = interpolate(Math.sin(frame * 0.03), [-1, 1], [1, 1.01]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "35%",
        [side]: 40,
        transform: `translateX(${x}px) scale(${breathScale})`,
        opacity: dimOpacity,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Glow behind character */}
      {speaking && (
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: 20,
            backgroundColor: config.color,
            opacity: glowOpacity,
            filter: "blur(30px)",
          }}
        />
      )}

      {/* Character image or placeholder */}
      {image ? (
        <Img
          src={staticFile(`images/${image}`)}
          style={{
            width: 350,
            height: 500,
            objectFit: "contain",
            filter: speaking ? "none" : "brightness(0.5)",
          }}
        />
      ) : (
        <div
          style={{
            width: 200,
            height: 300,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${config.bgColor}, transparent)`,
            border: `2px solid ${config.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            opacity: 0.6,
          }}
        >
          {config.name[0]}
        </div>
      )}

      {/* Character name below sprite */}
      <div
        style={{
          textAlign: "center",
          marginTop: 8,
          color: config.color,
          fontSize: 20,
          fontFamily: "sans-serif",
          fontWeight: 700,
          textShadow: "0 2px 6px rgba(0,0,0,0.8)",
          opacity: speaking ? 1 : 0.4,
        }}
      >
        {config.name}
      </div>
    </div>
  );
};
