import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import type { DialogLine } from "../../../fixture/characters";

// 梗：老闆畫大餅 (Boss drawing big flatbreads = empty promises)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "老闆說我們公司就像一個大家庭。" },
  { character: "xiaoyue", text: "對，大家庭的意思是，加班沒有加班費。", effect: "fire" },
  { character: "xiaoxue", text: "他還說年終看表現，表現好有驚喜。" },
  { character: "xiaoyue", text: "驚喜就是沒有年終。", effect: "laugh" },
  { character: "xiaoying", text: "我們老闆更厲害，他說我們是夥伴關係。" },
  { character: "xiaoxue", text: "所以呢？" },
  { character: "xiaoying", text: "夥伴的意思是一起倒楣。", effect: "dots" },
  { character: "xiaoyue", text: "老闆畫大餅的等級分三層。" },
  { character: "xiaoxue", text: "初級，公司會越來越好。" },
  { character: "xiaoyue", text: "中級，你的努力我都看在眼裡。" },
  { character: "xiaoxue", text: "高級，明年我們上市。", effect: "sparkle" },
  { character: "xiaoying", text: "我們老闆直接說，等公司賺錢了，虧待不了你們。" },
  { character: "xiaoxue", text: "等公司賺錢，這句話我聽了三年了。", effect: ["anger", "shake"] },
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

  // Golden "大餅" glow
  const pieGlow = interpolate(
    Math.sin(frame * 0.06),
    [-1, 1],
    [0.04, 0.1]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="cafe.png" />

      {/* Golden flatbread glow — boss promise aesthetic */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "20%",
          width: 200,
          height: 60,
          borderRadius: 8,
          background: `rgba(251, 191, 36, ${pieGlow})`,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "15%",
          width: 150,
          height: 50,
          borderRadius: 8,
          background: `rgba(251, 191, 36, ${pieGlow * 0.7})`,
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
            color: "#FBBF24",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗二：老闆畫大餅
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
