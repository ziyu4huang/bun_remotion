import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

// 梗：再一局就睡 (Just one more game)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "好，最後一局，打完就睡！" },
  { character: "xiaoyue", text: "妳半小時前也這麼說的。" },
  { character: "xiaoxue", text: "這次是真的！我看一下時間...凌晨兩點半。" },
  { character: "xiaoying", text: "我也要睡了，晚安..." },
  { character: "xiaoxue", text: "等等，這局我快贏了！再打一局！" },
  { character: "xiaoyue", text: "小雪，現在凌晨三點四十七分。" },
  { character: "xiaoxue", text: "好好好，這局打完真的睡！我發誓！" },
  { character: "xiaoying", text: "...天亮了。小雪妳還在打？" },
  { character: "xiaoxue", text: "我沒有在打，我在等...排隊。" },
  { character: "xiaoyue", text: "妳的『再一局』跟減肥的『最後一杯』是同一個老師教的吧。" },
];

export const JokeScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BackgroundLayer
        image="bedroom-dawn.png"
        gradient="linear-gradient(135deg, #0a0a1e 0%, #1a1030 50%, #0f1a3e 100%)"
      />

      <CharacterSprite
        character="xiaoxue"
        image="xiaoxue.png"
        speaking={currentLine.character === "xiaoxue"}
        side="left"
        background={currentLine.character !== "xiaoxue"}
      />
      <CharacterSprite
        character="xiaoyue"
        image="xiaoyue.png"
        speaking={currentLine.character === "xiaoyue"}
        side="right"
        background={currentLine.character !== "xiaoyue"}
      />
      <CharacterSprite
        character="xiaoying"
        image="xiaoying.png"
        speaking={currentLine.character === "xiaoying"}
        side="center"
        background={currentLine.character !== "xiaoying"}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

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
        梗三：再一局就睡
      </div>
    </AbsoluteFill>
  );
};
