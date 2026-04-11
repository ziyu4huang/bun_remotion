import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

const lines: DialogLine[] = [
  { character: "xiaomei", text: "你今天有讀書嗎？" },
  { character: "xiaoming", text: "有啊！我翻開書本就睡著了，這叫夢中學習法！" },
];

export const JokeScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];

  // Scene fade in/out
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BackgroundLayer
        image="hallway.png"
        gradient="linear-gradient(135deg, #1a0a2e 0%, #1b2a4e 50%, #0f2460 100%)"
      />

      {/* Xiao Mei on the right */}
      <CharacterSprite
        character="xiaomei"
        image="xiaomei.png"
        speaking={currentLineIndex === 0}
        side="right"
        background={currentLineIndex !== 0}
      />

      {/* Xiao Ming on the left */}
      <CharacterSprite
        character="xiaoming"
        image="xiaoming.png"
        speaking={currentLineIndex === 1}
        side="left"
        background={currentLineIndex !== 1}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Joke number */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          color: "rgba(192, 132, 252, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        笑話三
      </div>
    </AbsoluteFill>
  );
};
