import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import { notoSansTC } from "../../../fixture/characters";
import type { DialogLine, ComicEffect } from "../../../fixture/characters";
import { getSegmentTiming } from "./useSegmentTiming";

/**
 * JokeScene3 — 深度偽造危機
 * Segments: 1 narrator + 14 dialog = 15 total
 * isDialog: [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
 */
const SEGMENT_IS_DIALOG = [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true];

const dialogLines: DialogLine[] = [
  { character: "xiaoyue", text: "你們看這個影片。這是我嗎？" },
  { character: "xiaoxue", text: "哇，真的好像你！你在做什麼？", effect: "surprise" },
  { character: "xiaoyue", text: "我在……跳抖音。" },
  { character: "xiaoxue", text: "你會跳舞嗎？" },
  { character: "xiaoyue", text: "不會。這是深度偽造。有人用我的照片做了假的影片。" },
  { character: "xiaoying", text: "那你怎麼辦？" },
  { character: "xiaoyue", text: "我也用 AI 做了一個假的自己。讓那個假的去跳舞，真的我在家睡覺。", effect: "sparkle" },
  { character: "xiaoxue", text: "等等，這樣你不就變成 AI 了嗎？", effect: "shock" },
  { character: "xiaoyue", text: "不，我還是真人。只是我的「數位分身」替我工作。" },
  { character: "xiaoying", text: "那如果大家都有數位分身，真人是不是就不用出門了？" },
  { character: "xiaoyue", text: "理論上是的。" },
  { character: "xiaoxue", text: "太好了！以後數位小雪去上課，真的小雪在家追劇！", effect: "sparkle" },
  { character: "xiaoyue", text: "然後你的數位分身考了第一名。", effect: "laugh" },
  { character: "xiaoxue", text: "……那我就更不想出門了。", effect: "dots" },
];

export const JokeScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { lineIndex: segLineIdx, lineFrame: segLineFrame } = getSegmentTiming(frame, "JokeScene3", SEGMENT_IS_DIALOG);
  const currentLineIndex = segLineIdx >= 0 ? Math.min(segLineIdx, dialogLines.length - 1) : 0;
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glitch effect for deepfake reveal moment (line 5)
  const glitchLineIdx = 5;
  const glitchFrame = (6 / dialogLines.length) * durationInFrames; // +1 for narrator offset
  const glitchActive = currentLineIndex === glitchLineIdx;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="bedroom-night.png" />

      {/* Ominous glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "40%",
          width: 400,
          height: 250,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(251, 146, 60, ${glitchActive ? 0.15 : 0.06}), transparent)`,
          filter: "blur(50px)",
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
            color: "#FB923C",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: notoSansTC,
          }}
        >
          梗三：深度偽造危機
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #FB923C, transparent)",
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
