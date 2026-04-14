import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { DialogBox } from "../../../assets/components/DialogBox";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import type { DialogLine } from "../../../assets/characters";

// 梗：暗戀内心戲 (Secret crush inner drama)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "他今天看了我一眼，一定是喜歡我。", effect: "sparkle" },
  { character: "xiaoyue", text: "他也看了垃圾桶一眼。", effect: "laugh" },
  { character: "xiaoying", text: "我暗戀他三年了，一句話都沒說過。" },
  { character: "xiaoxue", text: "妳有在他的動態按讚嗎？" },
  { character: "xiaoying", text: "有，每篇都按。" },
  { character: "xiaoyue", text: "恭喜妳，妳在他的粉絲列表裡排第兩千三百名。", effect: "laugh" },
  { character: "xiaoxue", text: "我跟他傳訊息，他過了八小時才回「喔」。", effect: "anger" },
  { character: "xiaoyue", text: "八小時，他是在用竹簡回訊息嗎。", effect: "laugh" },
  { character: "xiaoying", text: "我朋友說要主動出擊，於是我跟他說嗨。" },
  { character: "xiaoxue", text: "然後呢？" },
  { character: "xiaoying", text: "他說「妳好，請問有什麼事嗎？」", effect: "sweat" },
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

  // Floating heart particles
  const heartParticles = Array.from({ length: 6 }).map((_, i) => {
    const x = 10 + ((i * 17) % 80);
    const baseY = 20 + ((i * 23) % 40);
    const floatY = baseY + Math.sin(frame * 0.03 + i * 2) * 15;
    const opacity = 0.15 + 0.1 * Math.sin(frame * 0.04 + i * 1.5);
    const size = 14 + (i % 3) * 6;
    return { x, y: floatY, opacity, size };
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer image="classroom-morning.png" />

      {/* Warm romantic glow */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "30%",
          width: 400,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(244, 114, 182, 0.12), transparent)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Floating hearts */}
      {heartParticles.map((h, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${h.x}%`,
            top: `${h.y}%`,
            fontSize: h.size,
            opacity: h.opacity,
            pointerEvents: "none",
          }}
        >
          ❤
        </div>
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
            color: "#F472B6",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗一：暗戀内心戲
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
