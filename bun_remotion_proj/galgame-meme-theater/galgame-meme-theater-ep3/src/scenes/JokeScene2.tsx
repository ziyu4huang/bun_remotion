import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { DialogBox } from "../../../assets/components/DialogBox";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import type { DialogLine } from "../../../assets/characters";

// 梗：夜市永遠吃不飽 (Night market — can never get full)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "走！去夜市！" },
  { character: "xiaoyue", text: "妳不是說要減肥？" },
  { character: "xiaoxue", text: "減肥是明天的事，今天是夜市的事。" },
  { character: "xiaoying", text: "我要大腸包小腸、鹽酥雞、珍珠奶茶、地瓜球..." },
  { character: "xiaoyue", text: "這是妳一個人的量？" },
  { character: "xiaoxue", text: "這只是開胃菜！" },
  { character: "xiaoying", text: "啊！那邊有蚵仔煎！" },
  { character: "xiaoyue", text: "妳們不是剛吃完晚餐嗎？" },
  { character: "xiaoxue", text: "在夜市，沒有所謂的『剛吃完』。" },
  { character: "xiaoying", text: "這裡的甜不辣好好吃...對了，還有雞蛋糕！" },
  { character: "xiaoyue", text: "我後悔跟妳們出門了...給我一口。" },
];

export const JokeScene2: React.FC = () => {
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

  // Neon flicker effect for night market vibes
  const neonFlicker = interpolate(
    Math.sin(frame * 0.12),
    [-1, 1],
    [0.08, 0.15]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #1a0a2e 0%, #4a1942 35%, #2d0a3e 65%, #0f0a20 100%)"
      />

      {/* Neon glow effects — night market atmosphere */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "20%",
          width: 200,
          height: 60,
          borderRadius: 8,
          background: `rgba(255, 100, 200, ${neonFlicker})`,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "25%",
          width: 150,
          height: 50,
          borderRadius: 8,
          background: `rgba(100, 200, 255, ${neonFlicker * 0.8})`,
          filter: "blur(25px)",
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
            color: "#E879F9",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗二：夜市永遠吃不飽
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #E879F9, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
