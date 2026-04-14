import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { notoSansTC } from "../../../assets/characters";

/**
 * EP5 Opening — 6-phase cinematic title sequence.
 * Fills the ENTIRE scene duration (driven by TTS audio).
 * Uses useVideoConfig().durationInFrames — never hardcoded.
 *
 * Phase 1 (0-90):     Title Reveal — gradient, streaks, kanji, title slam, subtitle, badge
 * Phase 2 (90-200):   Title Hold — breathing pulse, continuous particles, ambient shimmer
 * Phase 3 (200-420):  Joke Teasers — 4 joke topics slide in/out one by one
 * Phase 4 (420-560):  Character Showcase — 3 characters with name + personality tagline
 * Phase 5 (560-635):  Build-up — "準備好了嗎？" with pulsing glow + dramatic flash
 * Phase 6 (635-end):  Fade Out — everything fades to black
 */
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // ─── Fade Out — anchored to scene end ────────────────────────────────────
  const fadeOutStart = durationInFrames - 60;
  const fadeOut = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 1: Background — visible from frame 0 ──────────────────────────
  const bgHue = interpolate(frame, [0, durationInFrames], [200, 280], {
    extrapolateRight: "clamp",
  });

  // ─── Phase 1: Color streaks sweep immediately ─────────────────────────────
  const streaks = [
    { startFrame: 0, y: 15, color: "#F472B6", speed: 1.2 },
    { startFrame: 2, y: 40, color: "#818CF8", speed: 0.9 },
    { startFrame: 1, y: 65, color: "#FFD700", speed: 1.1 },
    { startFrame: 3, y: 85, color: "#06D6A0", speed: 0.8 },
  ];

  // ─── Phase 1: Character kanji burst ───────────────────────────────────────
  const charReveals = [
    { startFrame: 3, color: "#F472B6", label: "雪", x: 20 },
    { startFrame: 6, color: "#818CF8", label: "月", x: 80 },
    { startFrame: 9, color: "#FB923C", label: "樱", x: 50 },
  ];

  // ─── Phase 1: Screen shake ────────────────────────────────────────────────
  const shakeIntensity = interpolate(frame, [8, 14, 24], [0, 10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeIntensity * Math.sin(frame * 2.5);
  const shakeY = shakeIntensity * Math.cos(frame * 3.1);

  // ─── Phase 1: Title SLAM — scale from 3x with overshoot ────────────────
  const titleScale = interpolate(frame, [10, 28], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.3)),
  });
  const titleOpacity = interpolate(frame, [10, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 1: Bloom/glow behind title ────────────────────────────────────
  const bloomOpacity = interpolate(frame, [12, 18, 28], [0, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 1: Decorative lines sweep out ────────────────────────────────
  const lineWidth = interpolate(frame, [14, 34], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // ─── Phase 1: Subtitle character-by-character ────────────────────────────
  const subtitleText = "— 職場求生指南 —";
  const subtitleCharsShown = Math.floor(
    interpolate(frame, [18, 36], [0, subtitleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const subtitleDisplay = subtitleText.slice(0, subtitleCharsShown);

  // ─── Phase 1: EP5 badge with spring pop ─────────────────────────────────
  const badgeScale = interpolate(frame, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.6)),
  });
  const badgeGlow = interpolate(frame, [26, 38, 55], [0, 35, 12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── Phase 2: Breathing pulse for title hold ────────────────────────────
  const breatheScale = interpolate(
    Math.sin(frame * 0.03),
    [-1, 1],
    [0.98, 1.02]
  );

  // ─── Phase 2: Hold-phase ambient glow ───────────────────────────────────
  const holdGlowOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const holdGlow = interpolate(
    Math.sin(frame * 0.02),
    [-1, 1],
    [0.05, 0.2]
  ) * holdGlowOpacity;

  // ─── Continuous floating star particles (persist throughout) ──────────────
  const stars = Array.from({ length: 20 }).map((_, i) => {
    const x = ((i * 53 + 7) % 100);
    const startY = -5 - ((i * 29) % 25);
    const size = 3 + (i % 5) * 1.5;
    const speedY = 0.5 + (i % 3) * 0.15;
    const wobble = Math.sin(frame * 0.025 + i * 1.9) * 25;
    const starX = x + wobble;
    const starY = startY + (frame * speedY) % 120;
    const rotation = frame * (0.3 + (i % 3) * 0.2);
    const baseOpacity = 0.25 + 0.2 * Math.sin(frame * 0.04 + i * 1.9);
    const fadeInOpacity = interpolate(frame, [18 + i, 24 + i], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const opacity = baseOpacity * fadeInOpacity;
    const colors = ["#F472B6", "#818CF8", "#FFD700", "#06D6A0", "#FBCFE8"];
    return { x: starX, y: starY, size, rotation, opacity, color: colors[i % colors.length] };
  });

  // ─── Continuous shimmer dots (persist throughout) ───────────────────────
  const shimmers = Array.from({ length: 12 }).map((_, i) => {
    const x = ((i * 31 + 13) % 100);
    const y = ((i * 37 + 9) % 80) + 10;
    const opacity = interpolate(
      Math.sin(frame * 0.055 + i * 2.3),
      [-1, 1],
      [0.08, 0.3]
    );
    const size = 1.5 + (i % 2);
    const colors = ["#F472B6", "#818CF8", "#FFD700", "#06D6A0"];
    return { x, y, opacity, size, color: colors[i % colors.length] };
  });

  // ─── Phase 3: Joke Topic Teasers ────────────────────────────────────────
  const topics = [
    { label: "梗一：面試現場", color: "#F472B6", accent: "#FBBF24" },
    { label: "梗二：老闆畫大餅", color: "#818CF8", accent: "#38BDF8" },
    { label: "梗三：開會廢話大全", color: "#06D6A0", accent: "#34D399" },
    { label: "梗四：加班文化", color: "#FB923C", accent: "#FCD34D" },
  ];

  // ─── Phase 4: Character Showcase ────────────────────────────────────────
  const characterShowcase = [
    { name: "小雪", tagline: "元氣系美少女", color: "#F472B6" },
    { name: "小月", tagline: "毒舌學霸", color: "#818CF8" },
    { name: "小樱", tagline: "社恐常駐", color: "#FB923C" },
  ];

  // ─── Phase 5: Build-up ─────────────────────────────────────────────────
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
      {/* Background — colorful gradient from frame 0, NO BLACK */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg,
            hsl(${bgHue}, 60%, 15%) 0%,
            hsl(${bgHue + 30}, 50%, 12%) 35%,
            hsl(${bgHue + 60}, 55%, 10%) 65%,
            hsl(${bgHue + 90}, 45%, 8%) 100%)`,
        }}
      />

      {/* Phase 1: Color streaks — sweep from frame 0 */}
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
          <div
            key={`streak-${i}`}
            style={{
              position: "absolute",
              top: `${s.y}%`,
              left: `${-20 + progress * 120}%`,
              width: "35%",
              height: 3,
              background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
              opacity: streakOpacity,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Phase 1: Character kanji bursts */}
      {charReveals.map((char, i) => {
        const revealFlash = interpolate(
          frame,
          [char.startFrame, char.startFrame + 2, char.startFrame + 5, char.startFrame + 10],
          [0, 1, 0.5, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const revealScale = interpolate(
          frame,
          [char.startFrame, char.startFrame + 4],
          [1.8, 1],
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
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${breatheScale})`,
        }}
      >
        {/* Bloom/glow behind title (Phase 1) */}
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(244, 114, 182, 0.5), rgba(129, 140, 248, 0.25), rgba(6, 214, 160, 0.1), transparent)",
            opacity: bloomOpacity,
            filter: "blur(40px)",
          }}
        />

        {/* Phase 2: Hold-phase ambient glow behind title */}
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(244, 114, 182, 0.3), rgba(129, 140, 248, 0.15), transparent)",
            opacity: holdGlow,
            filter: "blur(50px)",
          }}
        />

        {/* Top decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #06D6A0, #FFD700, #F472B6, transparent)",
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
            background: "linear-gradient(90deg, transparent, #F472B6, #FFD700, #818CF8, transparent)",
            marginTop: 24,
            marginBottom: 20,
            opacity: titleOpacity,
          }}
        />

        {/* Subtitle — typed in character by character */}
        <div
          style={{
            fontSize: 30,
            color: "rgba(228, 220, 240, 0.8)",
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
              }}
            />
          )}
        </div>

        {/* EP5 badge */}
        <div
          style={{
            marginTop: 32,
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #06D6A0, #0EA5E9)",
              color: "#fff",
              padding: "6px 32px",
              borderRadius: 20,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.15em",
              boxShadow: `0 0 ${badgeGlow}px rgba(6, 214, 160, 0.6), 0 0 ${badgeGlow * 2}px rgba(14, 165, 233, 0.3)`,
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            第五集
          </div>
        </div>
      </div>

      {/* Floating star particles (continuous) */}
      {stars.map((star, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: "absolute",
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: "50% 0 50% 0",
            backgroundColor: star.color,
            opacity: star.opacity,
            transform: `rotate(${star.rotation}deg)`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Shimmer dots (continuous) */}
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

      {/* ═══════════════ Phase 3: Joke Topic Teasers ═══════════════ */}
      {topics.map((topic, i) => {
        const topicStart = 200 + i * 55;
        const localFrame = frame - topicStart;
        if (localFrame < 0 || localFrame >= 55) return null;

        const translateX = localFrame < 12
          ? interpolate(localFrame, [0, 12], [800, 0], {
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            })
          : localFrame < 42
          ? 0
          : interpolate(localFrame, [42, 55], [0, -800], {
              extrapolateLeft: "clamp",
              easing: Easing.in(Easing.cubic),
            });

        const opacity = localFrame < 12
          ? interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" })
          : localFrame < 42
          ? 1
          : interpolate(localFrame, [42, 55], [1, 0], { extrapolateLeft: "clamp" });

        const accentWidth = localFrame < 12
          ? interpolate(localFrame, [4, 14], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : localFrame < 42
          ? 200
          : interpolate(localFrame, [42, 52], [200, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

        return (
          <div
            key={`topic-${i}`}
            style={{
              position: "absolute",
              top: "38%",
              left: "50%",
              transform: `translate(-50%, -50%) translateX(${translateX}px)`,
              opacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: notoSansTC,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: topic.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 16,
                boxShadow: `0 0 20px ${topic.color}66`,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "#F3E8FF",
                textShadow: `0 0 20px ${topic.color}88, 0 4px 12px rgba(0,0,0,0.6)`,
                letterSpacing: "0.08em",
              }}
            >
              {topic.label}
            </div>
            <div
              style={{
                width: accentWidth,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${topic.accent}, transparent)`,
                marginTop: 12,
                borderRadius: 2,
              }}
            />
          </div>
        );
      })}

      {/* ═══════════════ Phase 4: Character Showcase ═══════════════ */}
      {characterShowcase.map((char, i) => {
        const charStart = 420 + i * 47;
        const localFrame = frame - charStart;
        if (localFrame < 0 || localFrame >= 47) return null;

        const opacity = localFrame < 10
          ? interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" })
          : localFrame < 37
          ? 1
          : interpolate(localFrame, [37, 47], [1, 0], { extrapolateLeft: "clamp" });

        const scale = localFrame < 10
          ? interpolate(localFrame, [0, 10], [0.8, 1], {
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(0.3)),
            })
          : 1;

        const glowPulse = localFrame >= 10 && localFrame < 37
          ? interpolate(
              Math.sin(localFrame * 0.1),
              [-1, 1],
              [0.1, 0.3]
            )
          : 0;

        return (
          <div
            key={`char-showcase-${i}`}
            style={{
              position: "absolute",
              top: "42%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: notoSansTC,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 400,
                height: 120,
                borderRadius: "50%",
                background: `radial-gradient(ellipse, ${char.color}44, transparent)`,
                opacity: glowPulse,
                filter: "blur(30px)",
                top: -20,
              }}
            />
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: char.color,
                textShadow: `0 0 30px ${char.color}88, 0 4px 12px rgba(0,0,0,0.6)`,
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              {char.name}
            </div>
            <div
              style={{
                fontSize: 28,
                color: "rgba(228, 220, 240, 0.75)",
                letterSpacing: "0.06em",
              }}
            >
              {char.tagline}
            </div>
            <div
              style={{
                width: 120,
                height: 3,
                backgroundColor: char.color,
                marginTop: 16,
                borderRadius: 2,
                boxShadow: `0 0 10px ${char.color}66`,
              }}
            />
          </div>
        );
      })}

      {/* ═══════════════ Phase 5: Build-up "準備好了嗎？" ═══════════════ */}
      {frame >= 560 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: notoSansTC,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 150,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(255, 215, 0, 0.4), rgba(244, 114, 182, 0.2), transparent)",
              opacity: buildUpTextOpacity * (buildUpGlow / 30),
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#F3E8FF",
              textShadow: `0 0 ${buildUpGlow}px rgba(255, 215, 0, 0.6), 0 0 ${buildUpGlow * 2}px rgba(244, 114, 182, 0.3), 0 6px 20px rgba(0,0,0,0.7)`,
              letterSpacing: "0.12em",
              opacity: buildUpTextOpacity,
              transform: `scale(${buildUpTextScale})`,
            }}
          >
            準備好了嗎？
          </div>
        </div>
      )}

      {/* Phase 5: Dramatic flash */}
      {flashOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8), transparent 70%)",
            opacity: flashOpacity,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
