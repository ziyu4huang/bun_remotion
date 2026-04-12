import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { notoSansTC } from "../characters";

/**
 * EP1 Title Scene — 系統文小說梗 第一集：不完成任務就抹除
 * Dramatic xianxia-themed title with system UI aesthetics.
 *
 * Layout zones (1920x1080):
 *   - Title area:  upper portion (top ~22%), fades out before topics
 *   - Topic area:  center (top ~50%), slides in after title clears
 *   - Build-up:    center, appears after topics are done
 */
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Global fade out anchored to end
  const fadeOutStart = durationInFrames - 60;
  const fadeOut = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background hue shift (mystical xianxia feel)
  const bgHue = interpolate(frame, [0, durationInFrames], [220, 300], {
    extrapolateRight: "clamp",
  });

  // ─── Phase 1: Opening streaks ────────────────────────────────────
  const streaks = [
    { startFrame: 0, y: 20, color: "#34D399", speed: 1.2 },
    { startFrame: 2, y: 45, color: "#60A5FA", speed: 0.9 },
    { startFrame: 1, y: 70, color: "#FFD700", speed: 1.1 },
    { startFrame: 3, y: 88, color: "#F472B6", speed: 0.8 },
  ];

  // ─── Phase 1: Character kanji burst ──────────────────────────────
  const charReveals = [
    { startFrame: 3, color: "#34D399", label: "系", x: 25, y: 35 },
    { startFrame: 6, color: "#60A5FA", label: "統", x: 75, y: 35 },
    { startFrame: 9, color: "#FFD700", label: "仙", x: 50, y: 55 },
  ];

  // ─── Screen shake on impact ──────────────────────────────────────
  const shakeIntensity = interpolate(frame, [8, 14, 24], [0, 10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeIntensity * Math.sin(frame * 2.5);
  const shakeY = shakeIntensity * Math.cos(frame * 3.1);

  // ─── Title SLAM ──────────────────────────────────────────────────
  const titleScale = interpolate(frame, [10, 28], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.3)),
  });
  const titleOpacity = interpolate(frame, [10, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bloom behind title
  const bloomOpacity = interpolate(frame, [12, 18, 28], [0, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative lines
  const lineWidth = interpolate(frame, [14, 34], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Subtitle typed character by character
  const subtitleText = "— 不完成任務就抹除 —";
  const subtitleCharsShown = Math.floor(
    interpolate(frame, [18, 36], [0, subtitleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const subtitleDisplay = subtitleText.slice(0, subtitleCharsShown);

  // EP1 badge
  const badgeScale = interpolate(frame, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.6)),
  });
  const badgeGlow = interpolate(frame, [26, 38, 55], [0, 35, 12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Title fade-out before topics ────────────────────────────────
  // Title content slides up and fades starting at frame 160, gone by 195
  const titleSlideUp = interpolate(frame, [160, 195], [0, -80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleContentFade = interpolate(frame, [170, 195], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 2: Breathing ──────────────────────────────────────────
  const breatheScale = interpolate(
    Math.sin(frame * 0.03),
    [-1, 1],
    [0.98, 1.02]
  );

  // Floating particles (system-themed green/blue)
  const particles = Array.from({ length: 20 }).map((_, i) => {
    const x = ((i * 53 + 7) % 100);
    const startY = -5 - ((i * 29) % 25);
    const size = 3 + (i % 5) * 1.5;
    const speedY = 0.5 + (i % 3) * 0.15;
    const wobble = Math.sin(frame * 0.025 + i * 1.9) * 25;
    const pX = x + wobble;
    const pY = startY + (frame * speedY) % 120;
    const rotation = frame * (0.3 + (i % 3) * 0.2);
    const baseOpacity = 0.25 + 0.2 * Math.sin(frame * 0.04 + i * 1.9);
    const fadeInOpacity = interpolate(frame, [18 + i, 24 + i], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const colors = ["#34D399", "#60A5FA", "#FFD700", "#F472B6", "#A78BFA"];
    return { x: pX, y: pY, size, rotation, opacity: baseOpacity * fadeInOpacity, color: colors[i % colors.length] };
  });

  // ─── Phase 3: Topic teasers ──────────────────────────────────────
  const topics = [
    { label: "系統綁定", color: "#34D399" },
    { label: "表白倒數計時", color: "#EF4444" },
    { label: "Q版戰鬥模式", color: "#60A5FA" },
    { label: "師姐的真面目", color: "#F472B6" },
  ];

  // ─── Phase 5: Build-up ──────────────────────────────────────────
  const buildUpTextScale = interpolate(frame, [560, 580], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.4)),
  });
  const buildUpTextOpacity = interpolate(frame, [560, 575], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buildUpGlow = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [10, 30]
  );
  const flashOpacity = interpolate(frame, [620, 625, 635], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background — mystical xianxia gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg,
            hsl(${bgHue}, 50%, 12%) 0%,
            hsl(${bgHue + 30}, 45%, 8%) 35%,
            hsl(${bgHue + 60}, 40%, 6%) 65%,
            hsl(${bgHue + 90}, 35%, 4%) 100%)`,
        }}
      />

      {/* Phase 1: Color streaks */}
      {streaks.map((s, i) => {
        const progress = interpolate(frame, [s.startFrame, s.startFrame + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const streakOpacity = interpolate(
          frame,
          [s.startFrame, s.startFrame + 1, s.startFrame + 8, s.startFrame + 12],
          [0, 0.7, 0.5, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div key={`streak-${i}`} style={{
            position: "absolute", top: `${s.y}%`,
            left: `${-20 + progress * 120}%`,
            width: "35%", height: 3,
            background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
            opacity: streakOpacity, pointerEvents: "none",
          }} />
        );
      })}

      {/* Phase 1: Character kanji bursts — positioned around title zone */}
      {charReveals.map((char, i) => {
        const revealFlash = interpolate(frame,
          [char.startFrame, char.startFrame + 2, char.startFrame + 5, char.startFrame + 10],
          [0, 1, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const revealScale = interpolate(frame,
          [char.startFrame, char.startFrame + 4],
          [1.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
        return (
          <div key={i} style={{
            position: "absolute", left: `${char.x}%`, top: `${char.y}%`,
            transform: `translate(-50%, -50%) scale(${revealScale})`,
            opacity: revealFlash, fontSize: 200, fontWeight: 900,
            color: char.color,
            textShadow: `0 0 60px ${char.color}, 0 0 120px ${char.color}88`,
            pointerEvents: "none",
          }}>{char.label}</div>
        );
      })}

      {/* ─── TITLE ZONE (upper portion) ──────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center",
        /* Position title in upper area — paddingTop pushes content to ~25% */
        justifyContent: "center",
        paddingTop: "4%",
        fontFamily: notoSansTC,
        transform: `translate(${shakeX}px, ${shakeY}px) scale(${breatheScale}) translateY(${titleSlideUp}px)`,
        opacity: titleContentFade,
      }}>
        {/* Bloom/glow */}
        <div style={{
          position: "absolute", width: 900, height: 220,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(52, 211, 153, 0.5), rgba(96, 165, 250, 0.25), rgba(255, 215, 0, 0.1), transparent)",
          opacity: bloomOpacity, filter: "blur(40px)",
        }} />

        {/* Top decorative line */}
        <div style={{
          width: lineWidth, height: 2,
          background: "linear-gradient(90deg, transparent, #34D399, #60A5FA, #FFD700, transparent)",
          marginBottom: 28, opacity: titleOpacity,
        }} />

        {/* Title — dramatic slam */}
        <div style={{
          fontSize: 86, fontWeight: 700, color: "#F3E8FF",
          textShadow: "0 0 50px rgba(52, 211, 153, 0.6), 0 0 100px rgba(96, 165, 250, 0.3), 0 6px 20px rgba(0,0,0,0.7)",
          letterSpacing: "0.12em",
          opacity: titleOpacity, transform: `scale(${titleScale})`,
        }}>
          系統文小說梗
        </div>

        {/* Bottom decorative line */}
        <div style={{
          width: lineWidth, height: 2,
          background: "linear-gradient(90deg, transparent, #F472B6, #FFD700, #34D399, transparent)",
          marginTop: 24, marginBottom: 20, opacity: titleOpacity,
        }} />

        {/* Subtitle — typed in */}
        <div style={{ fontSize: 30, color: "rgba(228, 220, 240, 0.8)", letterSpacing: "0.08em", minHeight: 42 }}>
          {subtitleDisplay}
          {subtitleCharsShown < subtitleText.length && subtitleCharsShown > 0 && (
            <span style={{ display: "inline-block", width: 2, height: 30, backgroundColor: "#34D399", marginLeft: 2, verticalAlign: "middle" }} />
          )}
        </div>

        {/* EP1 badge */}
        <div style={{ marginTop: 32, transform: `scale(${badgeScale})` }}>
          <div style={{
            background: "linear-gradient(135deg, #34D399, #60A5FA)",
            color: "#fff", padding: "6px 32px", borderRadius: 20,
            fontSize: 24, fontWeight: 700, letterSpacing: "0.15em",
            boxShadow: `0 0 ${badgeGlow}px rgba(52, 211, 153, 0.6), 0 0 ${badgeGlow * 2}px rgba(96, 165, 250, 0.3)`,
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}>
            第一集
          </div>
        </div>
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={`particle-${i}`} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: "50% 0 50% 0",
          backgroundColor: p.color, opacity: p.opacity,
          transform: `rotate(${p.rotation}deg)`,
          pointerEvents: "none",
        }} />
      ))}

      {/* ─── TOPIC ZONE (center, after title fades) ─────────────── */}
      {topics.map((topic, i) => {
        const topicStart = 200 + i * 55;
        const localFrame = frame - topicStart;
        if (localFrame < 0 || localFrame >= 55) return null;
        const translateX = localFrame < 12
          ? interpolate(localFrame, [0, 12], [800, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })
          : localFrame < 42 ? 0
          : interpolate(localFrame, [42, 55], [0, -800], { extrapolateLeft: "clamp", easing: Easing.in(Easing.cubic) });
        const opacity = localFrame < 12
          ? interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" })
          : localFrame < 42 ? 1
          : interpolate(localFrame, [42, 55], [1, 0], { extrapolateLeft: "clamp" });
        return (
          <div key={`topic-${i}`} style={{
            position: "absolute", top: "50%", left: "50%",
            transform: `translate(-50%, -50%) translateX(${translateX}px)`,
            opacity, display: "flex", flexDirection: "column",
            alignItems: "center", fontFamily: notoSansTC, pointerEvents: "none",
          }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: topic.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 16,
              boxShadow: `0 0 20px ${topic.color}66` }}>{i + 1}</div>
            <div style={{ fontSize: 48, fontWeight: 700, color: "#F3E8FF",
              textShadow: `0 0 20px ${topic.color}88, 0 4px 12px rgba(0,0,0,0.6)`,
              letterSpacing: "0.08em" }}>{topic.label}</div>
          </div>
        );
      })}

      {/* ─── BUILD-UP ZONE (center, after topics are done) ──────── */}
      {frame >= 560 && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: notoSansTC, pointerEvents: "none",
        }}>
          <div style={{ position: "absolute", width: 600, height: 150, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(52, 211, 153, 0.4), rgba(96, 165, 250, 0.2), transparent)",
            opacity: buildUpTextOpacity * (buildUpGlow / 30), filter: "blur(40px)" }} />
          <div style={{
            fontSize: 72, fontWeight: 700, color: "#F3E8FF",
            textShadow: `0 0 ${buildUpGlow}px rgba(52, 211, 153, 0.6), 0 0 ${buildUpGlow * 2}px rgba(96, 165, 250, 0.3), 0 6px 20px rgba(0,0,0,0.7)`,
            letterSpacing: "0.12em",
            opacity: buildUpTextOpacity, transform: `scale(${buildUpTextScale})`,
          }}>
            任務開始！
          </div>
        </div>
      )}

      {/* Flash */}
      {flashOpacity > 0 && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(52, 211, 153, 0.8), transparent 70%)",
          opacity: flashOpacity, pointerEvents: "none",
        }} />
      )}
    </AbsoluteFill>
  );
};
