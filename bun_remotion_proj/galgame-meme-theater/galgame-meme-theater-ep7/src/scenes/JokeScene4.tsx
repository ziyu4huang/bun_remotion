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
 * JokeScene4 — 人類存在的意義
 * Segments: 1 narrator + 17 dialog = 18 total
 * isDialog: [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
 */
const SEGMENT_IS_DIALOG = [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];

const dialogLines: DialogLine[] = [
  { character: "xiaoyue", text: "AI 會寫程式、會畫畫、會寫小說、會作曲。人類還能做什麼？" },
  { character: "xiaoxue", text: "人類還能……吃飯！" },
  { character: "xiaoyue", text: "AI 不需要吃飯。" },
  { character: "xiaoxue", text: "人類還能……睡覺！" },
  { character: "xiaoyue", text: "AI 不需要睡覺，而且二十四小時工作。" },
  { character: "xiaoying", text: "人類還能……犯錯。" },
  { character: "xiaoyue", text: "……這倒是真的。AI 不會犯錯。", effect: "surprise" },
  { character: "xiaoxue", text: "等等，小樱這個說法好深。", effect: "sparkle" },
  { character: "xiaoying", text: "我不是在說深奧的話。我只是說，我昨天把鹽當糖加了。" },
  { character: "xiaoxue", text: "……", effect: "dots" },
  { character: "xiaoyue", text: "但她說得對。AI 的完美反而讓它沒有靈魂。人類之所以有趣，就是因為我們會犯蠢。" },
  { character: "xiaoxue", text: "對！AI 永遠不會在半夜三點買一堆不需要的東西！", effect: "fire", sfx: [{ text: "犯蠢！", x: 960, y: 280, color: "#FB923C", rotation: 0, fontSize: 100, font: "brush" }] },
  { character: "xiaoyue", text: "也不會在社群媒體上發布後悔的動態。" },
  { character: "xiaoying", text: "更不會把密碼設成「123456」。" },
  { character: "xiaoxue", text: "……小樱，你的密碼是 123456 嗎？", effect: "shock" },
  { character: "xiaoying", text: "不是。是「123456789」。" },
  { character: "xiaoyue", text: "比原來的還糟。", effect: "laugh" },
];

export const JokeScene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { lineIndex: segLineIdx, lineFrame: segLineFrame } = getSegmentTiming(frame, "JokeScene4", SEGMENT_IS_DIALOG);
  const currentLineIndex = segLineIdx >= 0 ? Math.min(segLineIdx, dialogLines.length - 1) : 0;
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);
  const currentSfx = currentLine.sfx ?? [];

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Warm glow for the heartfelt conclusion (line 10+)
  const isHeartfelt = currentLineIndex >= 10;
  const warmGlowOpacity = isHeartfelt
    ? interpolate(frame, [0, 20], [0, 0.12], { extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="bedroom-dawn.png" />

      {/* Warm heartfelt glow for conclusion */}
      {warmGlowOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "25%",
            width: 960,
            height: 540,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(244, 114, 182, 0.12), rgba(251, 146, 60, 0.06), transparent)",
            opacity: warmGlowOpacity,
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
      )}

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
            color: "#F472B6",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: notoSansTC,
          }}
        >
          梗四：人類存在的意義
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

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
