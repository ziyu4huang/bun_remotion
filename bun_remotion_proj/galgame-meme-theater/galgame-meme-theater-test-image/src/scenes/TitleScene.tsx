import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { notoSansTC } from "../../../fixture/characters";

/**
 * EP6 Title — 美少女梗圖劇場 第六集（共享圖片模組測試）
 */
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeOutStart = durationInFrames - 60;
  const fadeOut = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [10, 28], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.3)),
  });
  const titleOpacity = interpolate(frame, [10, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeScale = interpolate(frame, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.6)),
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
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
        }}
      >
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: "#F3E8FF",
            textShadow: "0 0 50px rgba(244, 114, 182, 0.6), 0 6px 20px rgba(0,0,0,0.7)",
            letterSpacing: "0.12em",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
          }}
        >
          美少女梗圖劇場
        </div>

        <div
          style={{
            fontSize: 30,
            color: "rgba(228, 220, 240, 0.8)",
            marginTop: 20,
            letterSpacing: "0.08em",
          }}
        >
          — 共享圖片模組測試 —
        </div>

        <div style={{ marginTop: 32, transform: `scale(${badgeScale})` }}>
          <div
            style={{
              background: "linear-gradient(135deg, #06D6A0, #0EA5E9)",
              color: "#fff",
              padding: "6px 32px",
              borderRadius: 20,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            第六集
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
