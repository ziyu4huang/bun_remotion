import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

const lines: DialogLine[] = [
  { character: "teacher", text: "小明，你的作業呢？" },
  { character: "xiaoming", text: "老師，我的狗把它吃了。" },
  { character: "teacher", text: "你昨天也這麼說。" },
  { character: "xiaoming", text: "對啊，因為我昨天也沒寫。" },
];

export const JokeScene2: React.FC = () => {
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
      <BackgroundLayer image="classroom.png" />

      {/* Teacher on the right */}
      <CharacterSprite
        character="teacher"
        image="teacher.png"
        speaking={currentLine.character === "teacher"}
        side="right"
        background={currentLine.character !== "teacher"}
      />

      {/* Xiao Ming on the left */}
      <CharacterSprite
        character="xiaoming"
        image="xiaoming.png"
        speaking={currentLine.character === "xiaoming"}
        side="left"
        background={currentLine.character !== "xiaoming"}
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
        笑話二
      </div>
    </AbsoluteFill>
  );
};
