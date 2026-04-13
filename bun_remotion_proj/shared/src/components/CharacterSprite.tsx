import React from "react";
import { Img, staticFile } from "remotion";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { CharacterConfig, Emotion, ComicEffect, AnimationIntensity } from "../types";
import { resolveCharacterImage } from "../utils";

/**
 * Unified CharacterSprite supporting emotion, chibi, face mirror, and
 * configurable animation intensity.
 *
 * Merges: weapon-forger (pose/chibi/face-mirror/enhanced effects),
 *         galgame (simple image-based),
 *         my-core-is-boss (emotion system).
 *
 * Image resolution priority:
 *   chibiImage > explicit image > emotion-resolved image > placeholder
 */

interface CharacterSpriteProps {
  character: string;
  characterConfig: CharacterConfig;
  image?: string;
  emotion?: Emotion;
  chibi?: boolean;
  chibiImage?: string;
  speaking?: boolean;
  side?: "left" | "center" | "right";
  background?: boolean;
  effects?: ComicEffect[];
  faceMirror?: boolean;
  intensity?: AnimationIntensity;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  character,
  characterConfig: config,
  image,
  emotion,
  chibi = false,
  chibiImage,
  speaking = true,
  side = "left",
  background = false,
  effects = [],
  faceMirror = true,
  intensity = "enhanced",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enhanced = intensity === "enhanced";

  // ─── Entrance animation ───────────────────────────────────────────────────
  const entrance = spring({
    frame,
    fps,
    config: enhanced
      ? { damping: 14, stiffness: 70, mass: 0.8 }
      : { damping: 18, stiffness: 80, mass: 0.8 },
  });
  const entranceScale = interpolate(entrance, [0, 1], [0.7, 1]);

  // ─── Position mapping ─────────────────────────────────────────────────────
  const positionMap = { left: "10%", center: "50%", right: "90%" };
  const translateX = side === "center" ? "-50%" : side === "left" ? "-10%" : "-90%";

  // ─── Speaking: breathing ──────────────────────────────────────────────────
  const breathAmp = enhanced ? 0.025 : 0.008;
  const breathScale = speaking
    ? interpolate(Math.sin(frame * (enhanced ? 0.06 : 0.04)), [-1, 1], [1, 1 + breathAmp])
    : 1;

  // ─── Effect flags ─────────────────────────────────────────────────────────
  const hasShake = effects.includes("shake");
  const hasSurprise = effects.includes("surprise");
  const hasShock = effects.includes("shock");
  const hasAnger = effects.includes("anger");
  const hasFire = effects.includes("fire");
  const hasGloating = effects.includes("gloating");
  const hasLaugh = effects.includes("laugh");

  // ─── Horizontal shake ─────────────────────────────────────────────────────
  const shakeMult = enhanced ? 1 : 0.6;
  let shakeX = 0;
  if (speaking && hasShake) {
    shakeX = Math.sin(frame * 1.5) * 6 * shakeMult;
  } else if (speaking && hasShock) {
    const decay = Math.exp(-frame * (enhanced ? 0.05 : 0.08));
    shakeX = Math.sin(frame * (enhanced ? 5 : 3)) * (enhanced ? 15 : 8) * decay;
  } else if (speaking && hasSurprise) {
    const decay = Math.exp(-frame * 0.06);
    shakeX = Math.sin(frame * 4) * 12 * decay * shakeMult;
  } else if (speaking && hasAnger) {
    shakeX = Math.sin(frame * 3) * (enhanced ? 8 : 5);
  } else if (speaking && hasFire) {
    shakeX = Math.sin(frame * 2.5) * 7 * shakeMult;
  } else if (speaking) {
    shakeX = Math.sin(frame * 0.08) * (enhanced ? 2.5 : 1.5);
  }

  // ─── Vertical bounce ──────────────────────────────────────────────────────
  const bounceMult = enhanced ? 1 : 0.6;
  let bounceY = 0;
  if (speaking && hasShake) {
    bounceY = Math.abs(Math.sin(frame * 1.2)) * -8 * bounceMult;
  } else if (speaking && hasShock) {
    bounceY = Math.abs(Math.sin(frame * (enhanced ? 0.8 : 1))) * -(enhanced ? 15 : 8) * bounceMult;
  } else if (speaking && hasSurprise) {
    bounceY = Math.abs(Math.sin(frame * 0.7)) * -10 * bounceMult;
  } else if (speaking && hasLaugh) {
    bounceY = Math.abs(Math.sin(frame * (enhanced ? 0.2 : 0.15))) * -10 * bounceMult;
  } else if (speaking && hasGloating) {
    bounceY = Math.sin(frame * 0.05) * -6;
  } else if (speaking) {
    bounceY = Math.sin(frame * 0.06) * -(enhanced ? 3 : 2);
  }

  // ─── Tilt ─────────────────────────────────────────────────────────────────
  let tilt = 0;
  if (speaking && hasSurprise) {
    tilt = Math.sin(frame * 0.2) * (enhanced ? 5 : 3);
  } else if (speaking && hasAnger) {
    tilt = Math.sin(frame * 0.35) * -(enhanced ? 6 : 4);
  } else if (speaking && hasShock) {
    tilt = Math.sin(frame * 0.25) * 8 * shakeMult;
  } else if (speaking && hasGloating) {
    tilt = Math.sin(frame * 0.04) * 3;
  }

  // ─── Scale pulse (enhanced only) ──────────────────────────────────────────
  let effectScale = 1;
  if (enhanced && speaking && hasShock) {
    effectScale = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.95, 1.05]);
  } else if (enhanced && speaking && hasFire) {
    effectScale = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.97, 1.04]);
  }

  // ─── Opacity & scale for speaking vs background ───────────────────────────
  const targetOpacity = speaking ? 1 : background ? (enhanced ? 0.25 : 0.3) : (enhanced ? 0.4 : 0.5);
  const targetScale = speaking ? 1 : (enhanced ? 0.88 : 0.92);
  const opacity = interpolate(entrance, [0, 1], [0, targetOpacity]);
  const scale = entranceScale * targetScale * breathScale * effectScale;

  // ─── Glow (enhanced: larger/brighter, subtle: smaller) ────────────────────
  const glowSize = enhanced ? 400 : 300;
  const glowHeight = enhanced ? 500 : 400;
  const glowBlur = enhanced ? 50 : 60;
  const glowOpacityMin = enhanced ? 0.08 : 0.05;
  const glowOpacityMax = enhanced ? 0.3 : 0.18;
  const glowOpacity = speaking
    ? interpolate(Math.sin(frame * (enhanced ? 0.1 : 0.08)), [-1, 1], [glowOpacityMin, glowOpacityMax])
    : 0;
  const brightness = speaking ? 1 : (enhanced ? 0.5 : 0.6);

  const glowColor = hasFire ? "#EF4444"
    : hasAnger ? "#F97316"
    : hasShock ? "#FBBF24"
    : hasGloating ? "#A78BFA"
    : config.color;

  // ─── Emotion flash overlay (enhanced only) ────────────────────────────────
  const emotionFlash = (() => {
    if (!enhanced || !speaking) return 0;
    if (hasShock || hasFire) return interpolate(Math.sin(frame * 0.3), [-1, 1], [0, 0.1]);
    if (hasAnger) return interpolate(Math.sin(frame * 0.25), [-1, 1], [0, 0.08]);
    return 0;
  })();

  // ─── Chibi mode ───────────────────────────────────────────────────────────
  const spriteHeight = chibi ? "40%" : "75%";
  const spriteMaxHeight = chibi ? 480 : 900;
  const chibiBounce = chibi && speaking
    ? Math.abs(Math.sin(frame * 0.15)) * -18
    : 0;
  const chibiBottom = chibi ? "30%" : 0;

  // ─── Face mirror ──────────────────────────────────────────────────────────
  const faceMirrorVal = faceMirror ? (side === "left" ? -1 : 1) : 1;

  // ─── Image resolution ─────────────────────────────────────────────────────
  const resolvedImage = image || resolveCharacterImage(character, emotion);
  const imgSrc = chibi && chibiImage
    ? staticFile(`images/${chibiImage}`)
    : resolvedImage
    ? staticFile(`images/${resolvedImage}`)
    : null;

  // ─── Drop shadow size ─────────────────────────────────────────────────────
  const dropShadow = speaking ? (enhanced ? "30px" : "20px") : "0px";

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
            width: glowSize,
            height: glowHeight,
            borderRadius: "50%",
            backgroundColor: glowColor,
            opacity: glowOpacity,
            filter: `blur(${glowBlur}px)`,
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
              transform: `scaleX(${faceMirrorVal})`,
              filter: `brightness(${brightness}) ${speaking ? "" : `saturate(${enhanced ? 0.4 : 0.5})`} drop-shadow(0 0 ${dropShadow} rgba(0,0,0,0.3))`,
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
              transform: `scaleX(${faceMirrorVal})`,
            }}
          >
            {config.name[0]}
          </div>
        )}
      </div>

      {/* Emotion color overlay (enhanced only) */}
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
