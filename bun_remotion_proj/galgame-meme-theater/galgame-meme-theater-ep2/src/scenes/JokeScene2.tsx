import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import type { DialogLine } from "../../../fixture/characters";

// 梗：打折永遠買不完 (Sales are never-ending)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "小樱，妳的Steam遊戲庫有多少個遊戲？" },
  { character: "xiaoying", text: "三百...四十二個吧，我沒仔細數。" },
  { character: "xiaoxue", text: "妳打了幾個？" },
  { character: "xiaoying", text: "...七個。" },
  { character: "xiaoyue", text: "花錢買一堆不玩的東西，妳是圖什麼？" },
  { character: "xiaoying", text: "可是打折的時候不買，會覺得虧啊！" },
  { character: "xiaoxue", text: "妳虧的不是錢，是硬碟空間。" },
  { character: "xiaoying", text: "不對！我是在投資！萬一哪天想玩呢？" },
  { character: "xiaoyue", text: "妳三年前買的那款，現在還在特價，更便宜了。" },
  { character: "xiaoying", text: "...那我再買一份，省得後悔。" },
  { character: "xiaoxue", text: "等等，什麼邏輯？？" },
];

export const JokeScene2: React.FC = () => {
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
        image="gaming-setup.png"
        gradient="linear-gradient(135deg, #0f0a2e 0%, #1a1030 50%, #0f1a3e 100%)"
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
          color: "rgba(129, 140, 248, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        梗二：打折永遠買不完
      </div>
    </AbsoluteFill>
  );
};
