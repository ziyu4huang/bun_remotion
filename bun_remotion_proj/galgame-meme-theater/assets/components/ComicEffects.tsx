import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import type { ComicEffect } from "../characters";

interface ComicEffectsProps {
  effects: ComicEffect[];
  /** Which side the speaking character is on (to position effects above them) */
  side: "left" | "center" | "right";
}

/**
 * Comic-style emoji/effect overlays that appear above the speaking character.
 * Each effect has its own entrance animation and idle behavior.
 */
export const ComicEffects: React.FC<ComicEffectsProps> = ({ effects, side }) => {
  const frame = useCurrentFrame();

  // Position above character
  const horizontalPos = side === "left" ? "15%" : side === "right" ? "75%" : "50%";
  const translateX = side === "center" ? "-50%" : "-50%";

  return (
    <div
      style={{
        position: "absolute",
        top: "8%",
        left: horizontalPos,
        transform: `translateX(${translateX})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      {effects.map((effect, i) => (
        <SingleEffect key={i} effect={effect} frame={frame} delay={i * 3} />
      ))}
    </div>
  );
};

const SingleEffect: React.FC<{
  effect: ComicEffect;
  frame: number;
  delay: number;
}> = ({ effect, frame, delay }) => {
  const f = Math.max(0, frame - delay);

  switch (effect) {
    case "surprise":
      return <SurpriseEffect frame={f} />;
    case "shock":
      return <ShockEffect frame={f} />;
    case "sweat":
      return <SweatEffect frame={f} />;
    case "sparkle":
      return <SparkleEffect frame={f} />;
    case "heart":
      return <HeartEffect frame={f} />;
    case "anger":
      return <AngerEffect frame={f} />;
    case "dots":
      return <DotsEffect frame={f} />;
    case "cry":
      return <CryEffect frame={f} />;
    case "laugh":
      return <LaughEffect frame={f} />;
    case "fire":
      return <FireEffect frame={f} />;
    case "shake":
      return null; // shake is handled in CharacterSprite, no visual overlay
    default:
      return null;
  }
};

// ─── ?! Surprise ─────────────────────────────────────────────────────────────
const SurpriseEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.8)),
  });
  const wobble = Math.sin(frame * 0.3) * 3;

  return (
    <div
      style={{
        fontSize: 64,
        fontWeight: 900,
        color: "#FFD700",
        transform: `scale(${scale}) rotate(${wobble}deg)`,
        textShadow: "3px 3px 0 #B45309, 0 0 20px rgba(255, 215, 0, 0.6)",
        fontFamily: "sans-serif",
      }}
    >
      ?!
    </div>
  );
};

// ─── ! Shock ─────────────────────────────────────────────────────────────────
const ShockEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [0, 6], [2.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.5)),
  });
  const opacity = interpolate(frame, [0, 4, 60, 70], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 72,
        fontWeight: 900,
        color: "#EF4444",
        transform: `scale(${scale})`,
        opacity,
        textShadow: "3px 3px 0 #991B1B, 0 0 25px rgba(239, 68, 68, 0.6)",
        fontFamily: "sans-serif",
      }}
    >
      !
    </div>
  );
};

// ─── Sweat drop 💧 ──────────────────────────────────────────────────────────
const SweatEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const dropY = interpolate(frame, [0, 40], [-10, 30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 5, 35, 45], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wobble = Math.sin(frame * 0.15) * 5;

  return (
    <div
      style={{
        transform: `translateY(${dropY}px) translateX(${wobble}px)`,
        opacity,
      }}
    >
      <div
        style={{
          width: 28,
          height: 36,
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          background: "linear-gradient(135deg, #93C5FD, #3B82F6)",
          boxShadow: "0 2px 8px rgba(59, 130, 246, 0.4), inset 3px 3px 6px rgba(255,255,255,0.5)",
        }}
      />
    </div>
  );
};

// ─── ✨ Sparkles ─────────────────────────────────────────────────────────────
const SparkleEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const sparkles = [
    { x: -30, y: -5, size: 18, delay: 0 },
    { x: 15, y: -20, size: 14, delay: 3 },
    { x: 35, y: 5, size: 20, delay: 6 },
    { x: -10, y: -30, size: 12, delay: 9 },
  ];

  return (
    <>
      {sparkles.map((s, i) => {
        const sf = Math.max(0, frame - s.delay);
        const scale = interpolate(sf, [0, 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(0.5)),
        });
        const rotation = sf * 4;
        const opacity = interpolate(sf, [0, 4, 50, 60], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              opacity,
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            {/* 4-point star shape */}
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#FFD700",
                clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                boxShadow: "0 0 10px rgba(255, 215, 0, 0.6)",
              }}
            />
          </div>
        );
      })}
    </>
  );
};

// ─── ❤️ Heart ───────────────────────────────────────────────────────────────
const HeartEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.6)),
  });
  const heartBeat = interpolate(Math.sin(frame * 0.15), [-1, 1], [1, 1.15]);
  const floatY = Math.sin(frame * 0.06) * 5;
  const opacity = interpolate(frame, [0, 6, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 48,
        transform: `scale(${scale * heartBeat}) translateY(${floatY}px)`,
        opacity,
        filter: "drop-shadow(0 2px 6px rgba(244, 63, 94, 0.5))",
      }}
    >
      ❤️
    </div>
  );
};

// ─── 💢 Anger cross ──────────────────────────────────────────────────────────
const AngerEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [0, 5], [2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.4)),
  });
  const pulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.9, 1.1]);
  const opacity = interpolate(frame, [0, 4, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 44,
        transform: `scale(${scale * pulse}) rotate(${Math.sin(frame * 0.1) * 5}deg)`,
        opacity,
      }}
    >
      💢
    </div>
  );
};

// ─── ... Dots (speechless) ──────────────────────────────────────────────────
const DotsEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const dots = ["•", "•", "•"];
  const baseDelay = 5;

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
      {dots.map((dot, i) => {
        const dotOpacity = interpolate(
          frame,
          [baseDelay + i * 8, baseDelay + i * 8 + 6, baseDelay + i * 8 + 30, baseDelay + i * 8 + 40],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const dotBounce = interpolate(
          Math.sin((frame - baseDelay - i * 8) * 0.2),
          [-1, 1],
          [-3, 3]
        );

        return (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "#94A3B8",
              opacity: dotOpacity,
              transform: `translateY(${dotBounce}px)`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
        );
      })}
    </div>
  );
};

// ─── 😢 Cry / Tears ─────────────────────────────────────────────────────────
const CryEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 5, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tearY = interpolate(frame, [5, 60], [0, 40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ display: "flex", gap: 20, opacity }}>
      {/* Left tear */}
      <div
        style={{
          width: 8,
          height: 18,
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          background: "linear-gradient(180deg, #93C5FD, #60A5FA)",
          transform: `translateY(${tearY}px)`,
          opacity: interpolate(tearY, [0, 10, 35], [0, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      {/* Right tear */}
      <div
        style={{
          width: 8,
          height: 18,
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          background: "linear-gradient(180deg, #93C5FD, #60A5FA)",
          transform: `translateY(${tearY + 5}px)`,
          opacity: interpolate(tearY + 5, [0, 10, 35], [0, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      {/* Sad face */}
      <div
        style={{
          fontSize: 36,
          transform: `translateY(${Math.sin(frame * 0.08) * 3}px)`,
        }}
      >
        😢
      </div>
    </div>
  );
};

// ─── 😆 Laugh ───────────────────────────────────────────────────────────────
const LaughEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.5)),
  });
  const bounce = Math.abs(Math.sin(frame * 0.15)) * 8;
  const opacity = interpolate(frame, [0, 5, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 44,
        transform: `scale(${scale}) translateY(-${bounce}px)`,
        opacity,
      }}
    >
      😆
    </div>
  );
};

// ─── 🔥 Fire / Burn ─────────────────────────────────────────────────────────
const FireEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.4)),
  });
  const flicker = Math.sin(frame * 0.2) * 3;
  const opacity = interpolate(frame, [0, 4, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 44,
        transform: `scale(${scale}) rotate(${flicker}deg)`,
        opacity,
      }}
    >
      🔥
    </div>
  );
};
