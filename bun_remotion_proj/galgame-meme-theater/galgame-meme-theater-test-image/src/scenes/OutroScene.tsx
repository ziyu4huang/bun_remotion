import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { notoSansTC } from "../../../assets/characters";

/**
 * EP6 Outro
 */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [durationInFrames - 60, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: "#F3E8FF",
            letterSpacing: "0.12em",
            marginBottom: 20,
          }}
        >
          感謝觀看
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(228, 220, 240, 0.7)",
          }}
        >
          共享圖片模組驗證成功
        </div>
      </div>
    </AbsoluteFill>
  );
};
