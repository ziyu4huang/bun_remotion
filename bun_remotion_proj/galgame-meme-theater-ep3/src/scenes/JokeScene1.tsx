import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

// 梗：過年親戚靈魂拷問 (Chinese New Year soul-searching questions)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "過年最可怕的事是什麼？不是紅包給太多。" },
  { character: "xiaoyue", text: "是親戚的靈魂拷問。" },
  { character: "xiaoying", text: "考第幾名？有沒有男朋友？什麼時候結婚？" },
  { character: "xiaoxue", text: "我...我才大一啊..." },
  { character: "xiaoyue", text: "標準答案：『還在努力，謝謝關心。』" },
  { character: "xiaoying", text: "可是阿嬤說我小時候胖胖的很可愛..." },
  { character: "xiaoxue", text: "然後她現在每年都說：『怎麼又胖了？』" },
  { character: "xiaoyue", text: "過年不是放假，是一場生存遊戲。" },
  { character: "xiaoying", text: "我決定了，今年過年我要出國旅行！" },
  { character: "xiaoxue", text: "那我們明年見？" },
  { character: "xiaoying", text: "...明年我會說我在加班。" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #3a0a0a 0%, #6B0000 30%, #2d0a0a 70%, #1a0505 100%)"
      />

      {/* Subtle Chinese New Year lantern glow */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          right: "15%",
          width: 80,
          height: 100,
          borderRadius: "50% / 60%",
          background: "radial-gradient(ellipse, rgba(255, 50, 50, 0.15), transparent)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
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

      {/* Scene title indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          opacity: indicatorOpacity,
          zIndex: 50,
        }}
      >
        <div
          style={{
            color: "#FF6B6B",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗一：過年親戚靈魂拷問
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #FF6B6B, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
