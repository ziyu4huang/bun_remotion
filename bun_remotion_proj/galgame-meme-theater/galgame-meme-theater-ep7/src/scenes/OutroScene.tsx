import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { notoSansTC } from "../../../fixture/characters";
import { getSegmentTiming } from "./useSegmentTiming";

/**
 * OutroScene — 感謝收看 + 下集預告
 * Segment-based: 3 narrator segments drive the subtitle display.
 * Uses getSegmentTiming() to sync subtitle text to TTS audio.
 *
 * Narration segments: 3 (all narrator, no dialog)
 * isDialog: [false, false, false]
 */

const NARRATOR_TEXTS = [
  "感謝收看美少女梗圖劇場第七集！AI 時代求生。",
  "AI 可以幫我們寫作業、回訊息、做影片，但有一件事 AI 永遠做不到——那就是像小雪一樣在半夜買不需要的東西。人類的不完美，才是我們最可愛的地方。",
  "下集預告：三人踏入了加密貨幣的世界。小雪投資了一萬塊買了一個叫「狗狗幣超級無敵版」的虛擬貨幣。小月冷靜分析後發現，這個幣的官網是用 Canva 做的。",
];

const SEGMENT_IS_DIALOG = [false, false, false];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Segment-based subtitle timing
  const { lineIndex: segIdx, lineFrame: segFrame } = getSegmentTiming(
    frame, "OutroScene", SEGMENT_IS_DIALOG,
  );
  const activeTextIdx = segIdx >= 0 && segIdx < NARRATOR_TEXTS.length ? segIdx : -1;

  // Fade in
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Content animations
  const contentOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentY = interpolate(frame, [15, 45], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Decorative line
  const lineWidth = interpolate(frame, [30, 55], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Character color bars
  const charBars = [
    { color: "#F472B6", name: "小雪", delay: 35 },
    { color: "#818CF8", name: "小月", delay: 45 },
    { color: "#FB923C", name: "小樱", delay: 55 },
  ];

  // Subtitle items
  const subtitles = [
    { text: "AI 幫我們寫作業", delay: 60 },
    { text: "AI 幫我們回訊息", delay: 72 },
    { text: "但人類的不完美才是最可愛的", delay: 84 },
    { text: "記得，犯蠢是一種特權", delay: 96 },
  ];

  // Narrator subtitle: typewriter effect
  const charsPerFrame = 2.5;
  const visibleChars = activeTextIdx >= 0
    ? Math.floor(segFrame * charsPerFrame)
    : 0;
  const subtitleTextContent = activeTextIdx >= 0
    ? NARRATOR_TEXTS[activeTextIdx].slice(0, visibleChars)
    : "";
  const isTypingDone = activeTextIdx >= 0 && visibleChars >= NARRATOR_TEXTS[activeTextIdx].length;
  const cursorVisible = isTypingDone && Math.sin(frame * 0.15) > 0;

  // Subtitle bar opacity
  const subtitleBarOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 40%, #0a1a3e 70%, #0a0a2e 100%)"
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: notoSansTC,
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
          paddingBottom: 80, // leave room for narrator subtitle
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 30px rgba(56, 189, 248, 0.4), 0 0 60px rgba(129, 140, 248, 0.2)",
            letterSpacing: "0.1em",
            marginBottom: 20,
          }}
        >
          感謝收看
        </div>

        <div
          style={{
            width: lineWidth,
            height: 2,
            background: "linear-gradient(90deg, transparent, #38BDF8, #A78BFA, #818CF8, transparent)",
            marginBottom: 24,
          }}
        />

        {/* Character color bars */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 30,
          }}
        >
          {charBars.map((bar, i) => {
            const barScale = interpolate(frame, [bar.delay, bar.delay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(0.5)),
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transform: `scale(${barScale})`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: bar.color,
                    boxShadow: `0 0 10px ${bar.color}66`,
                  }}
                />
                <div
                  style={{
                    color: bar.color,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {bar.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtitle items */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {subtitles.map((sub, i) => {
            const subOpacity = interpolate(frame, [sub.delay, sub.delay + 12], [0, 0.6], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  fontSize: 22,
                  color: `rgba(228, 220, 240, ${subOpacity})`,
                  letterSpacing: "0.06em",
                }}
              >
                {sub.text}
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontSize: 18,
            color: "rgba(56, 189, 248, 0.4)",
            letterSpacing: "0.05em",
            marginTop: 40,
            opacity: interpolate(frame, [100, 115], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          美少女梗圖劇場 — 第七集 · AI 時代求生
        </div>
      </div>

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
