import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import type { DialogLine } from "../../../fixture/characters";

// 梗：學霸的謊言 (The top student's lies)
const lines: DialogLine[] = [
  { character: "xiaoying", text: "小月，妳考了多少分？" },
  { character: "xiaoyue", text: "沒複習，隨便考考而已。" },
  { character: "xiaoxue", text: "我也是沒複習..." },
  { character: "xiaoying", text: "我也是！" },
  { character: "xiaoxue", text: "等等...成績出來了。小月妳九十八分？！" },
  { character: "xiaoyue", text: "嗯，運氣好而已。" },
  { character: "xiaoxue", text: "那我們三十二分和二十八分也是運氣好？！" },
  { character: "xiaoyue", text: "那你們下次也隨便考考嘛。" },
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
        image="school-corridor.png"
        gradient="linear-gradient(135deg, #0f1a2e 0%, #1a2a4e 50%, #0f2460 100%)"
      />

      {/* 小雪 on the left */}
      <CharacterSprite
        character="xiaoxue"
        image="xiaoxue.png"
        speaking={currentLine.character === "xiaoxue"}
        side="left"
        background={currentLine.character !== "xiaoxue"}
      />

      {/* 小月 on the right */}
      <CharacterSprite
        character="xiaoyue"
        image="xiaoyue.png"
        speaking={currentLine.character === "xiaoyue"}
        side="right"
        background={currentLine.character !== "xiaoyue"}
      />

      {/* 小樱 in center */}
      <CharacterSprite
        character="xiaoying"
        image="xiaoying.png"
        speaking={currentLine.character === "xiaoying"}
        side="center"
        background={currentLine.character !== "xiaoying"}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Joke title */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          color: "rgba(251, 146, 60, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        梗三：學霸的謊言
      </div>
    </AbsoluteFill>
  );
};
