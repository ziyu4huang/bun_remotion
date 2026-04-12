import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import type { DialogLine } from "../characters";

// 梗：實習生的真實生活 (The real life of an intern)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "我拿到實習了！好興奮！", effect: "sparkle" },
  { character: "xiaoyue", text: "恭喜...準備好做免費勞工了嗎？", effect: "laugh" },
  { character: "xiaoying", text: "第一天：好新鮮！公司的咖啡機好高級！", effect: "heart" },
  { character: "xiaoxue", text: "第二天：原來咖啡機這麼難用...", effect: "sweat" },
  { character: "xiaoyue", text: "第三天：我為什麼要幫大家訂便當？", effect: "anger" },
  { character: "xiaoying", text: "第七天：我現在的正式工作是影印、掃描、倒垃圾。", effect: ["dots", "shake"] },
  { character: "xiaoxue", text: "實習學到的最重要的事是什麼？" },
  { character: "xiaoying", text: "如何用Excel排出好看的表格。", effect: "sweat" },
  { character: "xiaoyue", text: "還有？" },
  { character: "xiaoxue", text: "如何在開會時假裝聽懂。", effect: "sweat" },
  { character: "xiaoying", text: "以及如何在老闆走過來的瞬間切回工作畫面。", effect: "laugh" },
  { character: "xiaoyue", text: "這就是職場預備班。歡迎來到真實世界。", effect: "fire" },
  { character: "xiaoxue", text: "我...我想回學校上課...", effect: "cry" },
];

export const JokeScene4: React.FC = () => {
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

  // Office screen glow
  const screenGlow = interpolate(
    Math.sin(frame * 0.06),
    [-1, 1],
    [0.05, 0.1]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="bedroom-dawn.png" />

      {/* Office monitor glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "45%",
          width: 140,
          height: 100,
          borderRadius: 8,
          background: `rgba(96, 165, 250, ${screenGlow})`,
          filter: "blur(35px)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle desk lamp warm glow */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          right: "25%",
          width: 100,
          height: 80,
          borderRadius: "50%",
          background: "rgba(251, 191, 36, 0.06)",
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
            color: "#60A5FA",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗四：實習生的真實生活
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 220], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #60A5FA, transparent)",
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
