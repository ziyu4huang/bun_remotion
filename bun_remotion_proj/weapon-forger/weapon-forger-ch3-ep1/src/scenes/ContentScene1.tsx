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

/**
 * ContentScene1 — 秘境入口，各宗門準備破解禁制
 * Features: elder briefing, laser pen introduction, comedic setup
 */

const dialogLines: DialogLine[] = [
  { character: "elder", text: "這次秘境探索，你們三個給我安分點。別丟問道宗的臉。", effect: "anger", sfx: [{ text: "安分！", x: 960, y: 300, color: "#A78BFA", rotation: 0, fontSize: 100, font: "brush" }] },
  { character: "luyang", text: "長老放心，我帶了五份投降表，涵蓋所有可能的宗門。", sfx: [{ text: "五份？", x: 600, y: 350, color: "#38BDF8", rotation: -5, fontSize: 90, font: "playful" }] },
  { character: "mengjingzhou", text: "我帶了論文草稿——「秘境環境對單身光環的影響研究」。如果遇到女修，這是很好的數據採集機會。", effect: "dots" },
  { character: "elder", text: "……你們能不能有一次正常的準備？", effect: "sweat", sfx: [{ text: "無語", x: 1300, y: 320, color: "#A78BFA", rotation: 5, fontSize: 90, font: "playful" }] },
  { character: "zhoumo", text: "長老，我準備了「雷射切割陣法」。根據古籍記載，這個秘境的禁制是三千年前的陣法構建，結構規律性很高，可以用線性切割的方式高效破解。", sfx: [{ text: "雷射切割！", x: 960, y: 280, color: "#F59E0B", rotation: 0, fontSize: 110, font: "action" }] },
  { character: "elder", text: "你說的是那個……看起來像一根會發光的筷子一樣的東西？", effect: "dots" },
  { character: "zhoumo", text: "那是「聚焦式靈氣切割陣法發射器」。我簡稱它「雷射筆」。", sfx: [{ text: "雷射筆", x: 1300, y: 300, color: "#F59E0B", rotation: 3, fontSize: 85, font: "playful" }] },
  { character: "luyang", text: "看起來確實像一支筆。一支會把東西切開的筆。" },
  { character: "mengjingzhou", text: "記錄：周墨又造了一個危險的東西。這是第幾次了？", effect: "sweat", sfx: [{ text: "第N次", x: 600, y: 350, color: "#FB923C", rotation: -5, fontSize: 90, font: "playful" }] },
  { character: "zhoumo", text: "這不是危險，這是效率。", effect: "sparkle", sfx: [{ text: "效率！", x: 960, y: 300, color: "#34D399", rotation: 0, fontSize: 100, font: "action" }] },
];

export const ContentScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1
  );
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

      {/* System notification when laser pen is introduced */}
      {currentLineIndex === 4 && (
        <SystemNotification
          text="法寶登記：聚焦式靈氣切割陣法發射器（雷射筆）"
          type="info"
          delay={0}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#F59E0B", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          秘境入口 × 雷射筆登場
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #F59E0B, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
