import React from "react";
import { Img, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { CHARACTERS, resolveCharacterImage, type Character, type Emotion, type ComicEffect } from "../characters";

/**
 * CharacterSprite with multi-emotion support.
 * Resolves character-emotion images via the emotion prop.
 * Falls back to {character}-default.png if emotion image not available.
 */

interface CharacterSpriteProps {
  character: Character;
  image?: string;
  emotion?: Emotion;
  chibi?: boolean;
  speaking?: boolean;
  side?: "left" | "center" | "right";
  background?: boolean;
  effects?: ComicEffect[];
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  character,
  image,
  emotion,
  chibi = false,
  speaking = true,
  side = "left",
  background = false,
  effects = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = CHARACTERS[character];

  // Entrance animation with dramatic overshoot
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 70, mass: 0.8 },
  });
  const entranceScale = interpolate(entrance, [0, 1], [0.7, 1]);

  // Position mapping
  const positionMap = { left: "10%", center: "50%", right: "90%" };
  const translateX = side === "center" ? "-50%" : side === "left" ? "-10%" : "-90%";

  // ─── Speaking: breathing ──────────────────────────────────────────────
  const breathScale = speaking
    ? interpolate(Math.sin(frame * 0.06), [-1, 1], [1, 1.025])
    : 1;

  // ─── Enhanced shake/bounce animations ────────────────────────────────
  const hasShake = effects.includes("shake");
  const hasSurprise = effects.includes("surprise");
  const hasShock = effects.includes("shock");
  const hasAnger = effects.includes("anger");
  const hasFire = effects.includes("fire");
  const hasGloating = effects.includes("gloating");
  const hasLaugh = effects.includes("laugh");

  let shakeX = 0;
  if (speaking && hasShake) {
    shakeX = Math.sin(frame * 2) * 10;
  } else if (speaking && hasSurprise) {
    const shakeDecay = Math.exp(-frame * 0.06);
    shakeX = Math.sin(frame * 4) * 12 * shakeDecay;
  } else if (speaking && hasShock) {
    const shakeDecay = Math.exp(-frame * 0.05);
    shakeX = Math.sin(frame * 5) * 15 * shakeDecay;
  } else if (speaking && hasAnger) {
    shakeX = Math.sin(frame * 3) * 8;
  } else if (speaking && hasFire) {
    shakeX = Math.sin(frame * 2.5) * 7;
  } else if (speaking) {
    shakeX = Math.sin(frame * 0.1) * 2.5;
  }

  let bounceY = 0;
  if (speaking && hasShake) {
    bounceY = Math.abs(Math.sin(frame * 1.5)) * -12;
  } else if (speaking && hasShock) {
    bounceY = Math.abs(Math.sin(frame * 0.8)) * -15;
  } else if (speaking && hasSurprise) {
    bounceY = Math.abs(Math.sin(frame * 0.7)) * -10;
  } else if (speaking && hasLaugh) {
    bounceY = Math.abs(Math.sin(frame * 0.2)) * -10;
  } else if (speaking && hasGloating) {
    bounceY = Math.sin(frame * 0.05) * -6;
  } else if (speaking) {
    bounceY = Math.sin(frame * 0.08) * -3;
  }

  let tilt = 0;
  if (speaking && hasSurprise) {
    tilt = Math.sin(frame * 0.3) * 5;
  } else if (speaking && hasAnger) {
    tilt = Math.sin(frame * 0.35) * -6;
  } else if (speaking && hasShock) {
    tilt = Math.sin(frame * 0.25) * 8;
  } else if (speaking && hasGloating) {
    tilt = Math.sin(frame * 0.04) * 3;
  }

  // ─── Scale pulse for dramatic moments ────────────────────────────────
  let effectScale = 1;
  if (speaking && hasShock) {
    effectScale = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.95, 1.05]);
  } else if (speaking && hasFire) {
    effectScale = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.97, 1.04]);
  }

  // Non-speaking: dimmed, scaled down
  const targetOpacity = speaking ? 1 : background ? 0.25 : 0.4;
  const targetScale = speaking ? 1 : 0.88;
  const opacity = interpolate(entrance, [0, 1], [0, targetOpacity]);
  const scale = entranceScale * targetScale * breathScale * effectScale;

  // ─── Enhanced glow ────────────────────────────────────────────────────
  const glowOpacity = speaking
    ? interpolate(Math.sin(frame * 0.1), [-1, 1], [0.08, 0.3])
    : 0;
  const brightness = speaking ? 1 : 0.5;

  const glowColor = hasFire ? "#EF4444"
    : hasAnger ? "#F97316"
    : hasShock ? "#FBBF24"
    : hasGloating ? "#A78BFA"
    : config.color;

  // ─── Emotion overlay flash ───────────────────────────────────────────
  const emotionFlash = (() => {
    if (!speaking) return 0;
    if (hasShock || hasFire) return interpolate(Math.sin(frame * 0.3), [-1, 1], [0, 0.1]);
    if (hasAnger) return interpolate(Math.sin(frame * 0.25), [-1, 1], [0, 0.08]);
    return 0;
  })();

  // ─── Chibi mode ──────────────────────────────────────────────────────
  const spriteHeight = chibi ? "40%" : "75%";
  const spriteMaxHeight = chibi ? 480 : 900;
  const chibiBounce = chibi && speaking
    ? Math.abs(Math.sin(frame * 0.15)) * -18
    : 0;
  const chibiBottom = chibi ? "30%" : 0;

  // Face direction — ALL raw images face LEFT
  const faceMirror = side === "left" ? -1 : 1;

  // Priority: explicit image > emotion-resolved > null (placeholder)
  const resolvedImage = image || resolveCharacterImage(character, emotion);
  const imgSrc = chibi && emotion === "chibi"
    ? staticFile(`characters/${character}-chibi.png`)
    : resolvedImage
    ? staticFile(`characters/${resolvedImage}`)
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
      {/* Glow behind character */}
      {speaking && (
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 500,
            borderRadius: "50%",
            backgroundColor: glowColor,
            opacity: glowOpacity,
            filter: "blur(50px)",
          }}
        />
      )}

      {/* Character image */}
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
              filter: `brightness(${brightness}) ${speaking ? "" : "saturate(0.4)"} drop-shadow(0 0 ${speaking ? "30px" : "0px"} rgba(0,0,0,0.3))`,
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

      {/* Emotion color overlay */}
      {emotionFlash > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: glowColor,
            opacity: emotionFlash,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};
