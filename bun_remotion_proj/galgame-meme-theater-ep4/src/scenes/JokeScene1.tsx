import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import type { DialogLine } from "../characters";

// 梗：期末考前一週的狀態 (One week before finals)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "期末考還有一週！" },
  { character: "xiaoyue", text: "沒關係，我還有七天可以讀。" },
  { character: "xiaoying", text: "六天..." },
  { character: "xiaoxue", text: "五天..." },
  { character: "xiaoyue", text: "三天..." },
  { character: "xiaoying", text: "明天考...我現在開始讀還來得及嗎？", effect: "surprise" },
  { character: "xiaoxue", text: "這就是所謂的『極限操作』。", effect: "sparkle" },
  { character: "xiaoyue", text: "教授說這次是開書考。太好了！", effect: "sparkle" },
  { character: "xiaoxue", text: "對啊！可以帶課本進去！" },
  { character: "xiaoyue", text: "...結果整本書都考。", effect: "shock" },
  { character: "xiaoying", text: "我的人生已經結束了。", effect: ["dots", "shake"] },
  { character: "xiaoxue", text: "別灰心，補考也是一種體驗。", effect: "sweat" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer image="classroom-morning.png" />

      {/* Warm study lamp glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "30%",
          width: 300,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255, 200, 100, 0.12), transparent)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <CharacterSprite
        character="xiaoxue"
        image="xiaoxue.png"
        speaking={currentLine.character === "xiaoxue"}
        side="left"
        background={currentLine.character !== "xiaoxue"}
        effects={currentLine.character === "xiaoxue" ? currentEffects : []}
      />
      <CharacterSprite
        character="xiaoyue"
        image="xiaoyue.png"
        speaking={currentLine.character === "xiaoyue"}
        side="right"
        background={currentLine.character !== "xiaoyue"}
        effects={currentLine.character === "xiaoyue" ? currentEffects : []}
      />
      <CharacterSprite
        character="xiaoying"
        image="xiaoying.png"
        speaking={currentLine.character === "xiaoying"}
        side="center"
        background={currentLine.character !== "xiaoying"}
        effects={currentLine.character === "xiaoying" ? currentEffects : []}
      />

      {/* Comic emoji effects above speaking character */}
      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiaoxue" ? "left" : currentLine.character === "xiaoyue" ? "right" : "center"}
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
            color: "#FBBF24",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗一：期末考前一週
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #FBBF24, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: string | string[]): string[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}
