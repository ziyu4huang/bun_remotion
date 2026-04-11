import React from "react";
import { Img, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CHARACTERS, type Character } from "../characters";

interface CharacterSpriteProps {
  character: Character;
  image?: string;
  speaking?: boolean;
  side?: "left" | "center" | "right";
  background?: boolean;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  character,
  image,
  speaking = true,
  side = "left",
  background = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = CHARACTERS[character];

  // Entrance animation
  const entrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
  });

  // Position mapping
  const positionMap = {
    left: "10%",
    center: "50%",
    right: "90%",
  };
  const translateX = side === "center" ? "-50%" : side === "left" ? "-10%" : "-90%";

  // Speaking: subtle breathing + slight bounce
  const breathScale = speaking
    ? interpolate(Math.sin(frame * 0.04), [-1, 1], [1, 1.008])
    : 1;

  // Non-speaking characters: dimmed and slightly scaled down
  const targetOpacity = speaking ? 1 : background ? 0.3 : 0.5;
  const targetScale = speaking ? 1 : 0.92;
  const opacity = interpolate(entrance, [0, 1], [0, targetOpacity]);
  const scale = interpolate(entrance, [0, 1], [0.9, targetScale]) * breathScale;

  // Speaking glow pulse (subtle)
  const glowOpacity = speaking
    ? interpolate(Math.sin(frame * 0.08), [-1, 1], [0.05, 0.15])
    : 0;

  // Brightness for non-speaking
  const brightness = speaking ? 1 : 0.6;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: positionMap[side],
        transform: `translateX(${translateX}) scale(${scale})`,
        opacity,
        height: "75%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Glow behind character when speaking */}
      {speaking && (
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 300,
            height: 400,
            borderRadius: "50%",
            backgroundColor: config.color,
            opacity: glowOpacity,
            filter: "blur(60px)",
          }}
        />
      )}

      {/* Character image or placeholder */}
      {image ? (
        <Img
          src={staticFile(`images/${image}`)}
          style={{
            height: "100%",
            maxHeight: 900,
            objectFit: "contain",
            objectPosition: "bottom center",
            filter: `brightness(${brightness}) ${speaking ? "" : "saturate(0.5)"} drop-shadow(0 0 ${speaking ? "20px" : "0px"} rgba(0,0,0,0.3))`,
          }}
        />
      ) : (
        // Placeholder character silhouette
        <div
          style={{
            width: 350,
            height: "90%",
            borderRadius: "16px 16px 0 0",
            background: `linear-gradient(180deg, ${config.color}22 0%, ${config.color}44 100%)`,
            border: `2px solid ${config.color}66`,
            borderBottom: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 120,
            opacity: 0.5,
          }}
        >
          {config.name[0]}
        </div>
      )}
    </div>
  );
};
