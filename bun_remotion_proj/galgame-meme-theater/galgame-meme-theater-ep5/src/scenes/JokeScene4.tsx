import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import type { DialogLine } from "../../../fixture/characters";

// 梗：加班文化 (Overtime culture)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "今天準時下班，感覺自己在做壞事。", effect: "sweat" },
  { character: "xiaoyue", text: "準時下班確實需要勇氣。" },
  { character: "xiaoying", text: "我昨天加班到十點，走出公司發現同事還在。" },
  { character: "xiaoxue", text: "結果呢？" },
  { character: "xiaoying", text: "他在打電動。", effect: "shock" },
  { character: "xiaoyue", text: "這就是所謂的表演性加班。", effect: "laugh" },
  { character: "xiaoxue", text: "老闆說公司不鼓勵加班。" },
  { character: "xiaoyue", text: "對，但是工作做不完妳自己看著辦。", effect: "anger" },
  { character: "xiaoying", text: "我發現一個規律，下班後發的訊息，隔天才回。" },
  { character: "xiaoxue", text: "但老闆半夜發的，五分鐘內就要回。", effect: "sweat" },
  { character: "xiaoyue", text: "這就是職場的量子力學。", effect: ["sparkle", "shake"] },
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

  // Night-time monitor glow
  const monitorGlow = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [0.06, 0.12]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="bedroom-night.png" />

      {/* Night-time blue monitor glow */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "42%",
          width: 160,
          height: 110,
          borderRadius: 8,
          background: `rgba(96, 165, 250, ${monitorGlow})`,
          filter: "blur(35px)",
          pointerEvents: "none",
        }}
      />

      {/* Desk lamp warm glow */}
      <div
        style={{
          position: "absolute",
          top: "32%",
          right: "22%",
          width: 100,
          height: 80,
          borderRadius: "50%",
          background: "rgba(251, 191, 36, 0.05)",
          filter: "blur(25px)",
          pointerEvents: "none",
        }}
      />

      {/* Moon glow in corner */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          right: "8%",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(226, 232, 240, 0.15), transparent)",
          filter: "blur(10px)",
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
          梗四：加班文化
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 180], {
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
