import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

// 梗：減肥永遠從明天開始 (Diet always starts tomorrow)
const lines: DialogLine[] = [
  { character: "xiaoyue", text: "從今天開始減肥，不吃了。" },
  { character: "xiaoxue", text: "支持妳！我陪妳一起...等等，那是什麼？" },
  { character: "xiaoyue", text: "...珍珠奶茶。這是最後一杯。" },
  { character: "xiaoying", text: "妳昨天也說是最後一杯喔..." },
  { character: "xiaoyue", text: "昨天那杯不算，因為那天是星期五。" },
  { character: "xiaoxue", text: "那今天星期幾？" },
  { character: "xiaoyue", text: "...不重要，先喝再說。" },
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
      <BackgroundLayer
        image="cafe.png"
        gradient="linear-gradient(135deg, #2a0f2e 0%, #1f1a3e 50%, #1a0f30 100%)"
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
          color: "rgba(129, 140, 248, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        梗二：減肥永遠從明天開始
      </div>
    </AbsoluteFill>
  );
};
