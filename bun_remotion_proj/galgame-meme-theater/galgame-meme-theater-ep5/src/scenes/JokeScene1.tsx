import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { DialogBox } from "../../../assets/components/DialogBox";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import type { DialogLine } from "../../../assets/characters";

// 梗：面試現場 (Interview scene)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "我的優點是抗压能力強，缺點是太追求完美。", effect: "sparkle" },
  { character: "xiaoyue", text: "翻譯一下，優點是習慣被壓榨，缺點是沒有缺點。", effect: "laugh" },
  { character: "xiaoying", text: "面試官問我為什麼想來這家公司。" },
  { character: "xiaoxue", text: "妳怎麼說的？" },
  { character: "xiaoying", text: "因為你們離我家最近。", effect: "sweat" },
  { character: "xiaoyue", text: "……至少很誠實。" },
  { character: "xiaoxue", text: "面試官問我期望待遇，我說隨便。" },
  { character: "xiaoyue", text: "結果真的給我很隨便。", effect: "shock" },
  { character: "xiaoxue", text: "這就是為什麼我們說要有底線。", effect: "anger" },
  { character: "xiaoying", text: "我寫了精通Excel，其實我只會合併儲存格。", effect: ["sweat", "shake"] },
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

      {/* Interview room warm light */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "35%",
          width: 350,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255, 200, 100, 0.1), transparent)",
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
          梗一：面試現場
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 180], {
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
