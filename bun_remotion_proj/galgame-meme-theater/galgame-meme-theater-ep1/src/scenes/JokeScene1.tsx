import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { DialogBox } from "../../../assets/components/DialogBox";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import type { DialogLine } from "../../../assets/characters";

// 梗：早八人的痛 (The pain of 8AM classes)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "今天又要早八...我感覺我的靈魂還在被窩裡。" },
  { character: "xiaoyue", text: "你不是昨天也這麼說？" },
  { character: "xiaoxue", text: "對啊，但今天是真的痛...我的黑眼圈已經比妝還濃了。" },
  { character: "xiaoying", text: "我已經把鬧鐘關了七次了...再睡五分鐘..." },
  { character: "xiaoyue", text: "你們兩個已經遲到了，老師在看。" },
  { character: "xiaoxue", text: "完了完了完了！快跑！！" },
];

export const JokeScene1: React.FC = () => {
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
        image="classroom-morning.png"
        gradient="linear-gradient(135deg, #1a0a2e 0%, #1b2a4e 50%, #0f2460 100%)"
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
          color: "rgba(244, 114, 182, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        梗一：早八人的痛
      </div>
    </AbsoluteFill>
  );
};
