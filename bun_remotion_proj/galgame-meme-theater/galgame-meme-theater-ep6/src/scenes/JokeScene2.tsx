import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import type { DialogLine } from "../../../fixture/characters";

// 梗：直男迷惑行為 (Clueless guy behavior)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "他說妳今天看起來不一樣，我問哪裡不一樣。" },
  { character: "xiaoyue", text: "他說有吧。", effect: "laugh" },
  { character: "xiaoxue", text: "我化了兩小時的妝。", effect: "anger" },
  { character: "xiaoyue", text: "妳以為直男看得懂妝容嗎，他只分得出有沒有眉毛。", effect: "laugh" },
  { character: "xiaoying", text: "有個男生說要給我驚喜。" },
  { character: "xiaoxue", text: "結果呢？" },
  { character: "xiaoying", text: "他送了我一個電競滑鼠，說這個打遊戲超好用。", effect: ["sweat", "dots"] },
  { character: "xiaoyue", text: "這就是直男的浪漫。", effect: "laugh" },
  { character: "xiaoxue", text: "我生日他說要帶我吃大餐。" },
  { character: "xiaoyue", text: "然後帶妳去吃了什麼？" },
  { character: "xiaoxue", text: "鹽酥雞配珍奶，他說這就是台灣的米其林。", effect: "sweat" },
  { character: "xiaoyue", text: "……至少很台。" },
  { character: "xiaoying", text: "他說想帶我看星星。" },
  { character: "xiaoxue", text: "好浪漫喔。", effect: "sparkle" },
  { character: "xiaoying", text: "結果帶我去電子街看螢幕。", effect: "shock" },
];

export const JokeScene2: React.FC = () => {
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

  // Golden shimmer spots
  const shimmerSpots = Array.from({ length: 5 }).map((_, i) => {
    const x = 15 + ((i * 19) % 70);
    const y = 15 + ((i * 23) % 50);
    const opacity = interpolate(
      Math.sin(frame * 0.06 + i * 1.7),
      [-1, 1],
      [0.05, 0.2]
    );
    return { x, y, opacity };
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer image="cafe.png" />

      {/* Golden warm glow */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          right: "20%",
          width: 350,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255, 215, 0, 0.1), transparent)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Shimmer spots */}
      {shimmerSpots.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: "#FFD700",
            opacity: s.opacity,
            pointerEvents: "none",
          }}
        />
      ))}

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
            color: "#FFD700",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗二：直男迷惑行為
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 180], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #FFD700, transparent)",
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
