import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import { MangaSfx } from "../../../fixture/components/MangaSfx";
import { notoSansTC } from "../../../fixture/characters";
import type { DialogLine, ComicEffect } from "../../../fixture/characters";
import { getSegmentTiming } from "./useSegmentTiming";

/**
 * JokeScene1 — AI 代寫作業
 * Segments: 1 narrator + 13 dialog = 14 total
 * isDialog: [false, true, true, true, true, true, true, true, true, true, true, true, true, true]
 */
const SEGMENT_IS_DIALOG = [false, true, true, true, true, true, true, true, true, true, true, true, true, true];

const dialogLines: DialogLine[] = [
  { character: "xiaoxue", text: "小月！你的報告怎麼寫了三十頁？", effect: "surprise" },
  { character: "xiaoyue", text: "我叫 ChatGPT 幫我擴寫。" },
  { character: "xiaoxue", text: "擴寫？你原本寫了幾頁？" },
  { character: "xiaoyue", text: "三行。" },
  { character: "xiaoxue", text: "三行變三十頁？！", effect: "shock", sfx: [{ text: "暴擊！", x: 960, y: 300, color: "#38BDF8", rotation: -3, fontSize: 100, font: "action" }] },
  { character: "xiaoyue", text: "我說「請詳細擴寫」，它真的很詳細。連參考文獻都幫我編了十七篇。" },
  { character: "xiaoxue", text: "那你交了嗎？" },
  { character: "xiaoyue", text: "當然沒有。教授問我參考文獻的作者，我一個都叫不出來。", effect: "sweat" },
  { character: "xiaoying", text: "其實……我也用 AI 寫了。" },
  { character: "xiaoxue", text: "小樱也？！", effect: "shock" },
  { character: "xiaoying", text: "我的 AI 很貼心，幫我在結尾加了「本報告由 AI 輔助撰寫」。" },
  { character: "xiaoxue", text: "……", effect: "dots" },
  { character: "xiaoyue", text: "至少你的 AI 有良心。", effect: "laugh" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { lineIndex: segLineIdx, lineFrame: segLineFrame } = getSegmentTiming(frame, "JokeScene1", SEGMENT_IS_DIALOG);
  const currentLineIndex = segLineIdx >= 0 ? Math.min(segLineIdx, dialogLines.length - 1) : 0;
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);
  const currentSfx = currentLine.sfx ?? [];

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating tech particles
  const techParticles = Array.from({ length: 6 }).map((_, i) => {
    const x = 10 + ((i * 17) % 80);
    const baseY = 15 + ((i * 23) % 35);
    const floatY = baseY + Math.sin(frame * 0.03 + i * 2) * 12;
    const opacity = 0.12 + 0.08 * Math.sin(frame * 0.04 + i * 1.5);
    return { x, y: floatY, opacity, symbol: i % 2 === 0 ? "{ }" : "</>" };
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer image="classroom-morning.png" />

      {/* Cool tech glow */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "30%",
          width: 400,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(56, 189, 248, 0.1), transparent)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Tech particles */}
      {techParticles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: 16,
            color: "#38BDF8",
            opacity: p.opacity,
            pointerEvents: "none",
            fontFamily: "monospace",
          }}
        >
          {p.symbol}
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
      <MangaSfx events={currentSfx} />

      <DialogBox
        lines={dialogLines}
        sceneFrame={frame}
        sceneDuration={durationInFrames}
        overrideLineIndex={currentLineIndex}
        overrideLineFrame={segLineFrame}
      />

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
            color: "#38BDF8",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: notoSansTC,
          }}
        >
          梗一：AI 代寫作業
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 180], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #38BDF8, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
