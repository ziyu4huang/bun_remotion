import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

// 梗：讀書會變開黑局 (Study group becomes a gaming party)
const lines: DialogLine[] = [
  { character: "xiaoyue", text: "今天讀書會，帶好妳們的筆記。" },
  { character: "xiaoxue", text: "收到！我準備好了...手機充電器。" },
  { character: "xiaoying", text: "我帶了零食和肥宅快樂水！" },
  { character: "xiaoyue", text: "...我叫妳們帶筆記，不是開派對。" },
  { character: "xiaoxue", text: "等等，我排位開了，先打一局！" },
  { character: "xiaoying", text: "我剛好蝦皮有折扣...妳們要不要看？" },
  { character: "xiaoyue", text: "妳們到底有沒有人在讀書？" },
  { character: "xiaoxue", text: "有啊，我在讀...對面的出裝。" },
  { character: "xiaoying", text: "我在讀...評價，這個商品好可愛。" },
  { character: "xiaoyue", text: "我悔恨，我不該相信妳們。" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];

  // Fade in/out with overlap
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BackgroundLayer
        image="bedroom-night.png"
        gradient="linear-gradient(135deg, #0a0a1e 0%, #0f1a2e 50%, #0a0f20 100%)"
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
          color: "rgba(244, 114, 182, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        梗一：讀書會變開黑局
      </div>
    </AbsoluteFill>
  );
};
