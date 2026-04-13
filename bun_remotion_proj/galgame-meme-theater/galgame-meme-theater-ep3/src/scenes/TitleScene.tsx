import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { notoSansTC } from "../../../fixture/characters";

/**
 * EP3 Opening — Cinematic anime-style title sequence
 *
 * Phase 1 (0-8):    Pitch black → lightning flash
 * Phase 2 (8-20):   Character silhouettes flash-reveal one by one
 * Phase 3 (18-35):  Screen shake + title SLAMS in with bloom
 * Phase 4 (25-55):  Decorative lines + subtitle + EP3 badge
 * Phase 5 (50-110): Cherry blossom petals float + ambient shimmer
 * Phase 6 (100-120): Gentle fade out
 */
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ─── Phase 1: Lightning flash ─────────────────────────────────────────
  const lightningFlash = interpolate(frame, [5, 8, 12], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 2: Character silhouettes flash-reveal ──────────────────────
  const charReveals = [
    { startFrame: 8, color: "#F472B6", label: "雪", x: 25 },
    { startFrame: 12, color: "#818CF8", label: "月", x: 75 },
    { startFrame: 16, color: "#FB923C", label: "樱", x: 50 },
  ];

  // ─── Phase 3: Screen shake ────────────────────────────────────────────
  const shakeIntensity = interpolate(frame, [15, 22, 35], [0, 8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeIntensity * Math.sin(frame * 2.5);
  const shakeY = shakeIntensity * Math.cos(frame * 3.1);

  // ─── Phase 3: Title SLAM — scale from 3x with overshoot ──────────────
  const titleScale = interpolate(frame, [18, 38], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.25)),
  });
  const titleOpacity = interpolate(frame, [18, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 3: Bloom/glow behind title ─────────────────────────────────
  const bloomOpacity = interpolate(frame, [20, 28, 38], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 4: Decorative lines sweep out ──────────────────────────────
  const lineWidth = interpolate(frame, [25, 48], [0, 240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // ─── Phase 4: Subtitle character-by-character ─────────────────────────
  const subtitleText = "— 台灣日常篇 —";
  const subtitleCharsShown = Math.floor(
    interpolate(frame, [32, 52], [0, subtitleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const subtitleDisplay = subtitleText.slice(0, subtitleCharsShown);

  // ─── Phase 4: EP3 badge with spring pop ──────────────────────────────
  const badgeScale = interpolate(frame, [42, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.6)),
  });
  const badgeGlow = interpolate(frame, [42, 55, 70], [0, 30, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 5: Cherry blossom petals ───────────────────────────────────
  const petals = Array.from({ length: 18 }).map((_, i) => {
    const x = ((i * 47 + 11) % 100);
    const startY = -10 - ((i * 31) % 30);
    const size = 4 + (i % 4) * 2;
    const speedX = 0.3 + (i % 3) * 0.15;
    const speedY = 0.6 + (i % 4) * 0.2;
    const wobble = Math.sin(frame * 0.03 + i * 1.7) * 30;
    const petalX = x + wobble;
    const petalY = startY + (frame * speedY) % 130;
    const rotation = frame * (0.5 + (i % 3) * 0.3);
    const opacity = interpolate(
      frame,
      [50 + i * 2, 60 + i * 2, 100 + i * 2, 115 + i * 2],
      [0, 0.5, 0.5, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return { x: petalX, y: petalY, size, rotation, opacity, color: i % 3 === 0 ? "#F9A8D4" : i % 3 === 1 ? "#FBCFE8" : "#FDF2F8" };
  });

  // ─── Phase 5: Ambient shimmer particles ───────────────────────────────
  const shimmers = Array.from({ length: 10 }).map((_, i) => {
    const x = ((i * 29 + 7) % 100);
    const y = ((i * 41 + 3) % 80) + 10;
    const opacity = interpolate(
      Math.sin(frame * 0.06 + i * 2.1),
      [-1, 1],
      [0.05, 0.25]
    );
    const size = 1 + (i % 2);
    return { x, y, opacity, size, color: i % 2 === 0 ? "#F472B6" : "#818CF8" };
  });

  // ─── Phase 6: Fade out ────────────────────────────────────────────────
  const fadeOut = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Animated gradient hue ────────────────────────────────────────────
  const hue = interpolate(frame, [0, 120], [270, 310], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background with animated hue */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, hsl(${hue}, 50%, 12%) 0%, hsl(${hue + 30}, 40%, 9%) 40%, hsl(${hue + 60}, 45%, 7%) 100%)`,
        }}
      />

      {/* Lightning flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#fff",
          opacity: lightningFlash,
          pointerEvents: "none",
        }}
      />

      {/* Main content with screen shake */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: notoSansTC,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Character silhouette flash reveals */}
        {charReveals.map((char, i) => {
          const revealFlash = interpolate(
            frame,
            [char.startFrame, char.startFrame + 2, char.startFrame + 5, char.startFrame + 8],
            [0, 1, 0.6, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const revealScale = interpolate(
            frame,
            [char.startFrame, char.startFrame + 4],
            [1.5, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }
          );

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${char.x}%`,
                top: "50%",
                transform: `translate(-50%, -50%) scale(${revealScale})`,
                opacity: revealFlash,
                fontSize: 200,
                fontWeight: 900,
                color: char.color,
                textShadow: `0 0 60px ${char.color}, 0 0 120px ${char.color}88`,
                pointerEvents: "none",
              }}
            >
              {char.label}
            </div>
          );
        })}

        {/* Bloom/glow behind title */}
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(244, 114, 182, 0.4), rgba(129, 140, 248, 0.2), transparent)",
            opacity: bloomOpacity,
            filter: "blur(40px)",
          }}
        />

        {/* Top decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #F472B6, #FFD700, #818CF8, transparent)",
            marginBottom: 28,
            opacity: titleOpacity,
          }}
        />

        {/* Title — dramatic slam */}
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 50px rgba(244, 114, 182, 0.6), 0 0 100px rgba(129, 140, 248, 0.3), 0 6px 20px rgba(0,0,0,0.7)",
            letterSpacing: "0.12em",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
          }}
        >
          美少女梗圖劇場
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #818CF8, #FFD700, #F472B6, transparent)",
            marginTop: 24,
            marginBottom: 20,
            opacity: titleOpacity,
          }}
        />

        {/* Subtitle — typed in character by character */}
        <div
          style={{
            fontSize: 30,
            color: "rgba(228, 220, 240, 0.75)",
            letterSpacing: "0.08em",
            minHeight: 42,
          }}
        >
          {subtitleDisplay}
          {subtitleCharsShown < subtitleText.length && subtitleCharsShown > 0 && (
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: 30,
                backgroundColor: "#FFD700",
                marginLeft: 2,
                verticalAlign: "middle",
                animation: "blink 0.5s infinite",
              }}
            />
          )}
        </div>

        {/* EP3 badge — gold themed for Taiwan flavor */}
        <div
          style={{
            marginTop: 32,
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFD700",
              color: "#1a0a2e",
              padding: "6px 32px",
              borderRadius: 20,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.15em",
              boxShadow: `0 0 ${badgeGlow}px rgba(255, 215, 0, 0.6), 0 0 ${badgeGlow * 2}px rgba(255, 215, 0, 0.3)`,
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            第三集
          </div>
        </div>
      </div>

      {/* Cherry blossom petals */}
      {petals.map((petal, i) => (
        <div
          key={`petal-${i}`}
          style={{
            position: "absolute",
            left: `${petal.x}%`,
            top: `${petal.y}%`,
            width: petal.size,
            height: petal.size,
            borderRadius: "50% 0 50% 0",
            backgroundColor: petal.color,
            opacity: petal.opacity,
            transform: `rotate(${petal.rotation}deg)`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Ambient shimmer particles */}
      {shimmers.map((s, i) => (
        <div
          key={`shimmer-${i}`}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: s.color,
            opacity: s.opacity,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Horizontal light streaks (Phase 2 cinematic effect) */}
      {[8, 11, 14].map((startFrame, i) => {
        const streakProgress = interpolate(frame, [startFrame, startFrame + 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const streakOpacity = interpolate(frame, [startFrame, startFrame + 2, startFrame + 6], [0, 0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const streakY = 20 + i * 35;

        return (
          <div
            key={`streak-${i}`}
            style={{
              position: "absolute",
              top: `${streakY}%`,
              left: `${-20 + streakProgress * 120}%`,
              width: "30%",
              height: 2,
              background: `linear-gradient(90deg, transparent, ${i % 2 === 0 ? "#F472B6" : "#818CF8"}, transparent)`,
              opacity: streakOpacity,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
