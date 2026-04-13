import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import type { DialogLine } from "../../../fixture/characters";

// 梗：手搖飲中毒 (Hand-shaken drink addiction)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "我今天不喝手搖飲了。" },
  { character: "xiaoyue", text: "真的？妳撐得住嗎？" },
  { character: "xiaoying", text: "她撐不到的，上次她也這樣說。" },
  { character: "xiaoxue", text: "我這次是認真的！我已經戒了...三小時了！", effect: "sparkle" },
  { character: "xiaoyue", text: "才三小時...妳的意志力跟WiFi斷線一樣短。", effect: "fire" },
  { character: "xiaoxue", text: "妳們看好了，我今天只喝水！", effect: "shake" },
  { character: "xiaoying", text: "...那是什麼？", effect: "surprise" },
  { character: "xiaoxue", text: "這不算手搖飲，這是鮮奶茶。", effect: "sweat" },
  { character: "xiaoyue", text: "鮮奶茶也是手搖飲。" },
  { character: "xiaoxue", text: "不一樣！這個是用鮮奶做的！", effect: "anger" },
  { character: "xiaoyue", text: "妳手上那杯明明是黑糖珍奶加珍珠加布丁加椰果。", effect: "shock" },
  { character: "xiaoxue", text: "...這是我的最後一杯。", effect: "sweat" },
  { character: "xiaoying", text: "妳昨天也這樣說。前天也是。大前天也是。", effect: ["laugh", "shake"] },
  { character: "xiaoxue", text: "那是因為每次都是不同的最後一杯！", effect: "heart" },
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

  // Neon cafe glow
  const neonFlicker = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.06, 0.12]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="cafe.png" />

      {/* Warm cafe neon accents */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "15%",
          width: 180,
          height: 50,
          borderRadius: 8,
          background: `rgba(251, 191, 36, ${neonFlicker})`,
          filter: "blur(25px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "12%",
          right: "20%",
          width: 120,
          height: 40,
          borderRadius: 8,
          background: `rgba(244, 114, 182, ${neonFlicker * 0.8})`,
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
            color: "#F472B6",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗二：手搖飲中毒
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #F472B6, transparent)",
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
