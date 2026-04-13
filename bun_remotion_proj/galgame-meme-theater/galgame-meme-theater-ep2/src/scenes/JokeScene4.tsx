import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import type { DialogLine } from "../../../fixture/characters";

// 梗：排位連敗甩鍋 (Ranked losing streak blame game)
const lines: DialogLine[] = [
  { character: "xiaoyue", text: "又輸了...這已經第六場了。" },
  { character: "xiaoxue", text: "要不要休息一下？喝口水？" },
  { character: "xiaoyue", text: "不用！我一定能贏回來！這局穩的！" },
  { character: "xiaoying", text: "小月妳的手在抖耶..." },
  { character: "xiaoyue", text: "沒有！那是...興奮！" },
  { character: "xiaoxue", text: "小月，妳連敗十場了，要不要考慮..." },
  { character: "xiaoyue", text: "考慮什麼？考慮這遊戲有問題？我也覺得！" },
  { character: "xiaoying", text: "那個...小月...妳的KDA是零比十二..." },
  { character: "xiaoyue", text: "那是隊友不給我支援！不是我的問題！" },
  { character: "xiaoxue", text: "好好好，都是隊友的錯。妳先放下滑鼠，我們去吃飯。" },
  { character: "xiaoyue", text: "...再打最後一局。這次一定贏。" },
  { character: "xiaoxue", text: "小月！！！" },
];

export const JokeScene4: React.FC = () => {
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
        image="gaming-room.png"
        gradient="linear-gradient(135deg, #1a0a2e 0%, #0f1a30 50%, #0a0f20 100%)"
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
        梗四：排位連敗甩鍋
      </div>
    </AbsoluteFill>
  );
};
