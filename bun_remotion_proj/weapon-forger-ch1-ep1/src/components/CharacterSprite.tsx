import React from "react";
import { Img, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CHARACTERS, type Character, type ComicEffect } from "../characters";

interface CharacterSpriteProps {
  character: Character;
  image?: string;
  /** Chibi mode — smaller, cuter version for battle scenes */
  chibi?: boolean;
  chibiImage?: string;
  speaking?: boolean;
  side?: "left" | "center" | "right";
  background?: boolean;
  effects?: ComicEffect[];
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  character,
  image,
  chibi = false,
  chibiImage,
  speaking = true,
  side = "left",
  background = false,
  effects = [],
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

  // Speaking: breathing + bounce
  const breathScale = speaking
    ? interpolate(Math.sin(frame * 0.04), [-1, 1], [1, 1.008])
    : 1;

  // ─── Shake/bounce animations ────────────────────────────────────
  const hasShake = effects.includes("shake");
  const hasSurprise = effects.includes("surprise");
  const hasShock = effects.includes("shock");
  const hasAnger = effects.includes("anger");
  const hasFire = effects.includes("fire");

  let shakeX = 0;
  if (speaking && hasShake) {
    shakeX = Math.sin(frame * 1.5) * 6;
  } else if (speaking && (hasSurprise || hasShock)) {
    const shakeDecay = Math.exp(-frame * 0.08);
    shakeX = Math.sin(frame * 3) * 8 * shakeDecay;
  } else if (speaking && (hasAnger || hasFire)) {
    shakeX = Math.sin(frame * 2) * 5;
  } else if (speaking) {
    shakeX = Math.sin(frame * 0.08) * 1.5;
  }

  let bounceY = 0;
  if (speaking && hasShake) {
    bounceY = Math.abs(Math.sin(frame * 1.2)) * -8;
  } else if (speaking && effects.includes("laugh")) {
    bounceY = Math.abs(Math.sin(frame * 0.15)) * -6;
  } else if (speaking) {
    bounceY = Math.sin(frame * 0.06) * -2;
  }

  let tilt = 0;
  if (speaking && hasSurprise) {
    tilt = Math.sin(frame * 0.2) * 3;
  } else if (speaking && hasAnger) {
    tilt = Math.sin(frame * 0.25) * -4;
  }

  // Non-speaking: dimmed, scaled down
  const targetOpacity = speaking ? 1 : background ? 0.3 : 0.5;
  const targetScale = speaking ? 1 : 0.92;
  const opacity = interpolate(entrance, [0, 1], [0, targetOpacity]);
  const scale = interpolate(entrance, [0, 1], [0.9, targetScale]) * breathScale;

  const glowOpacity = speaking
    ? interpolate(Math.sin(frame * 0.08), [-1, 1], [0.05, 0.18])
    : 0;
  const brightness = speaking ? 1 : 0.6;

  const glowColor = hasFire ? "#EF4444"
    : hasAnger ? "#F97316"
    : hasShock ? "#FBBF24"
    : config.color;

  // ─── Chibi mode sizing ──────────────────────────────────────────
  const spriteHeight = chibi ? "40%" : "75%";
  const spriteMaxHeight = chibi ? 480 : 900;
  // Chibi characters float above dialog box with a bounce
  const chibiBounce = chibi && speaking
    ? Math.abs(Math.sin(frame * 0.12)) * -12
    : 0;
  const chibiBottom = chibi ? "30%" : 0;

  // Face direction: convention is all character images face LEFT by default.
  // Left side → flip (scaleX(-1)) to face RIGHT toward partner
  // Right side → no flip (scaleX(1)), already facing LEFT toward partner
  // Center → no flip
  const faceMirror = side === "left" ? -1 : 1;

  // Choose image source
  const imgSrc = chibi && chibiImage
    ? staticFile(`images/${chibiImage}`)
    : image
    ? staticFile(`images/${image}`)
    : null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: chibiBottom || 0,
        left: positionMap[side],
        transform: `translateX(${translateX}) scale(${scale})`,
        opacity,
        height: spriteHeight,
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
            backgroundColor: glowColor,
            opacity: glowOpacity,
            filter: "blur(60px)",
          }}
        />
      )}

      {/* Character image with shake/bounce/tilt */}
      <div
        style={{
          transform: `translateX(${shakeX}px) translateY(${bounceY + chibiBounce}px) rotate(${tilt}deg)`,
        }}
      >
        {imgSrc ? (
          <Img
            src={imgSrc}
            style={{
              height: "100%",
              maxHeight: spriteMaxHeight,
              objectFit: "contain",
              objectPosition: "bottom center",
              transform: `scaleX(${faceMirror})`,
              filter: `brightness(${brightness}) ${speaking ? "" : "saturate(0.5)"} drop-shadow(0 0 ${speaking ? "20px" : "0px"} rgba(0,0,0,0.3))`,
            }}
          />
        ) : (
          <div
            style={{
              width: chibi ? 200 : 350,
              height: "90%",
              borderRadius: "16px 16px 0 0",
              background: `linear-gradient(180deg, ${config.color}22 0%, ${config.color}44 100%)`,
              border: `2px solid ${config.color}66`,
              borderBottom: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: chibi ? 60 : 120,
              opacity: 0.5,
              transform: `scaleX(${faceMirror})`,
            }}
          >
            {config.name[0]}
          </div>
        )}
      </div>
    </div>
  );
};
