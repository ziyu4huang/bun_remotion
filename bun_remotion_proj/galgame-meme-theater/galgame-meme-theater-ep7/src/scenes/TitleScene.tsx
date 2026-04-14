import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { notoSansTC } from "../../../assets/characters";
import { getSegmentTiming } from "./useSegmentTiming";

/**
 * EP7 Opening — cinematic title with narrator subtitles at the bottom.
 *
 * Segment-based: 2 narrator segments drive the subtitle display.
 * Uses getSegmentTiming() to sync subtitle text to TTS audio.
 *
 * Narration segments: 2 (both narrator, no dialog)
 * isDialog: [false, false]
 */

// Narrator texts shown as subtitles (synced to audio segments)
const NARRATOR_TEXTS = [
  "歡迎來到美少女梗圖劇場第七集！AI 時代求生。",
  "小雪、小月和小樱面對人工智能的全面入侵，發現人類的生存危機不是 AI 太聰明，而是自己太依賴 AI。",
];

// All segments are narrator — no dialog lines
const SEGMENT_IS_DIALOG = [false, false];

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Segment-based subtitle timing
  const { segmentIndex: segIdx, lineFrame: segFrame } = getSegmentTiming(
    frame, "TitleScene", SEGMENT_IS_DIALOG,
  );

  // Determine which narrator text to show (-1 = no segment yet, show nothing)
  const activeTextIdx = segIdx < NARRATOR_TEXTS.length ? segIdx : -1;

  // --- Fade Out — anchored to scene end ---
  const fadeOutStart = durationInFrames - 60;
  const fadeOut = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Background hue ---
  const bgHue = interpolate(frame, [0, durationInFrames], [220, 260], {
    extrapolateRight: "clamp",
  });

  // --- Phase 1: Color streaks ---
  const streaks = [
    { startFrame: 0, y: 15, color: "#38BDF8", speed: 1.2 },
    { startFrame: 2, y: 40, color: "#818CF8", speed: 0.9 },
    { startFrame: 1, y: 65, color: "#A78BFA", speed: 1.1 },
    { startFrame: 3, y: 85, color: "#60A5FA", speed: 0.8 },
  ];

  // --- Phase 1: Character kanji burst ---
  const charReveals = [
    { startFrame: 3, color: "#F472B6", label: "雪", x: 20 },
    { startFrame: 6, color: "#818CF8", label: "月", x: 80 },
    { startFrame: 9, color: "#FB923C", label: "樱", x: 50 },
  ];

  // --- Phase 1: Screen shake ---
  const shakeIntensity = interpolate(frame, [8, 14, 24], [0, 10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeIntensity * Math.sin(frame * 2.5);
  const shakeY = shakeIntensity * Math.cos(frame * 3.1);

  // --- Phase 1: Title SLAM ---
  const titleScale = interpolate(frame, [10, 28], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.3)),
  });
  const titleOpacity = interpolate(frame, [10, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Main content fade-out before Phase 3 (topic teasers at frame 200) ---
  const mainContentOpacity = interpolate(frame, [160, 195], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Phase 1: Bloom ---
  const bloomOpacity = interpolate(frame, [12, 18, 28], [0, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Phase 1: Decorative lines ---
  const lineWidth = interpolate(frame, [14, 34], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // --- Phase 1: Subtitle typed in ---
  const subtitleText = "— AI 時代求生 —";
  const subtitleCharsShown = Math.floor(
    interpolate(frame, [18, 36], [0, subtitleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const subtitleDisplay = subtitleText.slice(0, subtitleCharsShown);

  // --- Phase 1: EP7 badge ---
  const badgeScale = interpolate(frame, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.6)),
  });
  const badgeGlow = interpolate(frame, [26, 38, 55], [0, 35, 12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Phase 2: Breathing pulse ---
  const breatheScale = interpolate(
    Math.sin(frame * 0.03),
    [-1, 1],
    [0.98, 1.02]
  );

  // --- Phase 2: Hold-phase ambient glow ---
  const holdGlowOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const holdGlow = interpolate(
    Math.sin(frame * 0.02),
    [-1, 1],
    [0.05, 0.2]
  ) * holdGlowOpacity;

  // --- Continuous floating particles ---
  const particles = Array.from({ length: 15 }).map((_, i) => {
    const x = ((i * 53 + 7) % 100);
    const startY = -5 - ((i * 29) % 25);
    const size = 10 + (i % 4) * 4;
    const speedY = 0.4 + (i % 3) * 0.12;
    const wobble = Math.sin(frame * 0.02 + i * 1.9) * 20;
    const particleX = x + wobble;
    const particleY = startY + (frame * speedY) % 120;
    const baseOpacity = 0.15 + 0.12 * Math.sin(frame * 0.03 + i * 1.9);
    const fadeInOpacity = interpolate(frame, [18 + i, 24 + i], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const opacity = baseOpacity * fadeInOpacity;
    const colors = ["#38BDF8", "#818CF8", "#A78BFA", "#60A5FA", "#F472B6"];
    return { x: particleX, y: particleY, size, opacity, color: colors[i % colors.length] };
  });

  // --- Phase 3: Joke Topic Teasers ---
  const topics = [
    { label: "梗一：AI 代寫作業", color: "#38BDF8", accent: "#60A5FA" },
    { label: "梗二：AI 回訊息翻車", color: "#A78BFA", accent: "#818CF8" },
    { label: "梗三：深度偽造危機", color: "#FB923C", accent: "#FCD34D" },
    { label: "梗四：人類存在的意義", color: "#F472B6", accent: "#FF6B9D" },
  ];

  // --- Phase 4: Character Showcase ---
  const characterShowcase = [
    { name: "小雪", tagline: "元氣系美少女", color: "#F472B6" },
    { name: "小月", tagline: "毒舌學霸", color: "#818CF8" },
    { name: "小樱", tagline: "社恐常駐", color: "#FB923C" },
  ];

  // --- Phase 5: Build-up ---
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

  // --- Narrator subtitle: typewriter effect ---
  const charsPerFrame = 2.5;
  const visibleChars = activeTextIdx >= 0
    ? Math.floor(segFrame * charsPerFrame)
    : 0;
  const subtitleTextContent = activeTextIdx >= 0
    ? NARRATOR_TEXTS[activeTextIdx].slice(0, visibleChars)
    : "";
  const isTypingDone = activeTextIdx >= 0 && visibleChars >= NARRATOR_TEXTS[activeTextIdx].length;
  const cursorVisible = isTypingDone && Math.sin(frame * 0.15) > 0;

  // Subtitle bar opacity (fade in with first segment, fade out at end)
  const subtitleBarOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background — blue/purple AI-themed gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg,
            hsl(${bgHue}, 60%, 12%) 0%,
            hsl(${bgHue + 20}, 50%, 10%) 35%,
            hsl(${bgHue + 40}, 55%, 8%) 65%,
            hsl(${bgHue + 60}, 45%, 6%) 100%)`,
        }}
      />

      {/* Color streaks */}
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

      {/* Character kanji bursts */}
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
          paddingBottom: 80, // leave room for narrator subtitle
          opacity: mainContentOpacity,
        }}
      >
        {/* Bloom */}
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(56, 189, 248, 0.5), rgba(129, 140, 248, 0.25), rgba(167, 139, 250, 0.1), transparent)",
            opacity: bloomOpacity,
            filter: "blur(40px)",
          }}
        />

        {/* Hold-phase glow */}
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(56, 189, 248, 0.3), rgba(129, 140, 248, 0.15), transparent)",
            opacity: holdGlow,
            filter: "blur(50px)",
          }}
        />

        {/* Top decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #38BDF8, #A78BFA, #818CF8, transparent)",
            marginBottom: 28,
            opacity: titleOpacity,
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 50px rgba(56, 189, 248, 0.6), 0 0 100px rgba(129, 140, 248, 0.3), 0 6px 20px rgba(0,0,0,0.7)",
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
            background: "linear-gradient(90deg, transparent, #818CF8, #A78BFA, #38BDF8, transparent)",
            marginTop: 24,
            marginBottom: 20,
            opacity: titleOpacity,
          }}
        />

        {/* Subtitle typed in */}
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
                backgroundColor: "#38BDF8",
                marginLeft: 2,
                verticalAlign: "middle",
              }}
            />
          )}
        </div>

        {/* EP7 badge */}
        <div style={{ marginTop: 32, transform: `scale(${badgeScale})` }}>
          <div
            style={{
              background: "linear-gradient(135deg, #38BDF8, #818CF8)",
              color: "#fff",
              padding: "6px 32px",
              borderRadius: 20,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.15em",
              boxShadow: `0 0 ${badgeGlow}px rgba(56, 189, 248, 0.6), 0 0 ${badgeGlow * 2}px rgba(129, 140, 248, 0.3)`,
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            第七集
          </div>
        </div>
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            opacity: p.opacity,
            pointerEvents: "none",
          }}
        >
          {i % 3 === 0 ? "⚡" : i % 3 === 1 ? "✦" : "◇"}
        </div>
      ))}

      {/* ========== Phase 3: Joke Topic Teasers ========== */}
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

      {/* ========== Phase 4: Character Showcase ========== */}
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
          ? interpolate(Math.sin(localFrame * 0.1), [-1, 1], [0.1, 0.3])
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

      {/* ========== Phase 5: Build-up ========== */}
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
              background: "radial-gradient(ellipse, rgba(56, 189, 248, 0.4), rgba(129, 140, 248, 0.2), transparent)",
              opacity: buildUpTextOpacity * (buildUpGlow / 30),
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#F3E8FF",
              textShadow: `0 0 ${buildUpGlow}px rgba(56, 189, 248, 0.6), 0 0 ${buildUpGlow * 2}px rgba(129, 140, 248, 0.3), 0 6px 20px rgba(0,0,0,0.7)`,
              letterSpacing: "0.12em",
              opacity: buildUpTextOpacity,
              transform: `scale(${buildUpTextScale})`,
            }}
          >
            準備好了嗎？
          </div>
        </div>
      )}

      {/* Dramatic flash */}
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

      {/* ========== Narrator Subtitle Bar (bottom) ========== */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 80,
          right: 80,
          opacity: subtitleBarOpacity,
          zIndex: 200,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "rgba(10, 10, 40, 0.75)",
            borderRadius: 10,
            padding: "14px 28px",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            backdropFilter: "blur(8px)",
            minHeight: 50,
          }}
        >
          <div
            style={{
              color: "rgba(228, 220, 240, 0.9)",
              fontSize: 26,
              lineHeight: 1.6,
              letterSpacing: "0.04em",
              fontFamily: notoSansTC,
            }}
          >
            {subtitleTextContent}
            {cursorVisible && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 26,
                  backgroundColor: "#38BDF8",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
