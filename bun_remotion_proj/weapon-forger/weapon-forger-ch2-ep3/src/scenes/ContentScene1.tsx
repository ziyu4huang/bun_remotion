import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { DialogBox } from "../../../assets/components/DialogBox";
import { MangaSfx } from "../../../assets/components/MangaSfx";
import { notoSansTC } from "../../../assets/characters";
import type { DialogLine, ComicEffect } from "../../../assets/characters";
import { getSegmentTiming } from "./useSegmentTiming";

/**
 * ContentScene1 — 藏經閣的怨念，長老派任務
 * Features: elder briefing, book grudge explanation, comedic setup
 *
 * Narration segments: 11 (1 narrator + 10 dialog)
 * isDialog: [false, true, true, true, true, true, true, true, true, true, true]
 */
const SEGMENT_IS_DIALOG = [false, true, true, true, true, true, true, true, true, true, true];

const dialogLines: DialogLine[] = [
  { character: "elder", text: "藏經閣三年前因為結構老化崩塌了。裡面的書籍至今沒有人整理。你們去修復一下。", sfx: [{ text: "任務！", x: 960, y: 300, color: "#A78BFA", rotation: 0, fontSize: 100, font: "brush" }] },
  { character: "luyang", text: "長老，藏經閣為什麼會自己崩塌？" },
  { character: "elder", text: "三百年沒人去過。書的怨念太重，把建築震塌了。" },
  { character: "mengjingzhou", text: "……書會有怨念？", effect: "dots" },
  { character: "elder", text: "你試試三百年沒有人翻開你寫的論文。", effect: "sparkle", sfx: [{ text: "暴擊！", x: 960, y: 320, color: "#A78BFA", rotation: -3, fontSize: 100, font: "action" }] },
  { character: "mengjingzhou", text: "……長老這句話比我的論文還殘忍。", effect: "cry", sfx: [{ text: "殘忍！", x: 600, y: 350, color: "#FB923C", rotation: -5, fontSize: 90, font: "playful" }] },
  { character: "zhoumo", text: "藏經閣。三百年沒人維護的資訊系統。典型的「缺乏使用者回饋導致系統退化」。我對這個任務很有興趣。", sfx: [{ text: "系統退化", x: 960, y: 280, color: "#F59E0B", rotation: 0, fontSize: 95, font: "brush" }] },
  { character: "elder", text: "周墨，我警告你，不許把藏經閣改成什麼奇怪的東西。", effect: "anger", sfx: [{ text: "警告！", x: 1300, y: 300, color: "#A78BFA", rotation: 3, fontSize: 90, font: "brush" }] },
  { character: "zhoumo", text: "放心，長老。我只是去做系統維護。" },
  { character: "luyang", text: "每次周墨說「放心」，我就開始擔心。", effect: "sweat", sfx: [{ text: "擔心", x: 500, y: 350, color: "#38BDF8", rotation: -5, fontSize: 85, font: "playful" }] },
];

export const ContentScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { lineIndex: segLineIdx, lineFrame: segLineFrame } = getSegmentTiming(frame, "ContentScene1", SEGMENT_IS_DIALOG);
  const currentLineIndex = segLineIdx >= 0 ? Math.min(segLineIdx, dialogLines.length - 1) : 0;
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="sect-gate.png"
        gradient="linear-gradient(135deg, #0a0a1e 0%, #0a0a2e 30%, #1a0a2e 60%, #0a0a1e 100%)"
      />

      {/* Characters */}
      <CharacterSprite
        character="zhoumo"
        image="zhoumo.png"
        chibi={false}
        chibiImage="zhoumo-chibi.png"
        speaking={currentLine.character === "zhoumo"}
        side="left"
        background={currentLine.character !== "zhoumo"}
        effects={currentLine.character === "zhoumo" ? currentEffects : []}
      />

      <CharacterSprite
        character="luyang"
        image="luyang.png"
        speaking={currentLine.character === "luyang"}
        side="right"
        background={currentLine.character !== "luyang"}
        effects={currentLine.character === "luyang" ? currentEffects : []}
      />

      <CharacterSprite
        character="mengjingzhou"
        image="mengjingzhou.png"
        speaking={currentLine.character === "mengjingzhou"}
        side="right"
        background={currentLine.character !== "mengjingzhou"}
        effects={currentLine.character === "mengjingzhou" ? currentEffects : []}
      />

      {/* Elder — center position */}
      <CharacterSprite
        character="elder"
        image="elder.png"
        speaking={currentLine.character === "elder"}
        side="center"
        background={currentLine.character !== "elder"}
        effects={currentLine.character === "elder" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={
          currentLine.character === "zhoumo" ? "left"
          : currentLine.character === "elder" ? "center"
          : "right"
        }
      />

      {/* Manga SFX */}
      <MangaSfx events={currentSfx} />

      {/* System notification for mission */}
      {currentLineIndex === 0 && (
        <SystemNotification
          text="任務：修復後山藏經閣 — 難度：未知"
          type="info"
          delay={0}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} overrideLineIndex={currentLineIndex} overrideLineFrame={segLineFrame} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#A78BFA", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          藏經閣的怨念 × 長老派任務
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #A78BFA, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
