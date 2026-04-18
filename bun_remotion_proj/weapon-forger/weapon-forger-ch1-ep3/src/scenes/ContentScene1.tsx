import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import {
  CharacterSprite, ComicEffects, DialogBox, SystemNotification, MangaSfx,
  notoSansTC,
} from "@bun-remotion/shared";
import type { DialogLine, ComicEffect, MangaSfxEvent } from "@bun-remotion/shared";
import { ScreenShake, ConcentrationLines, ImpactBurst, TriangleBurst } from "../../../assets/components/BattleEffects";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * ContentScene1 — 周墨加入煉器峰，長老介紹會說話的丹爐
 * Features: concentration lines, triangle bursts, manga SFX
 */

const dialogLines: DialogLine[] = [
  { character: "elder", text: "周墨，歡迎加入煉器峰。從今天起，你就是正式弟子了。" },
  { character: "zhoumo", text: "謝謝長老！請問我的第一個任務是什麼？", effect: "sparkle", sfx: [{ text: "期待！", x: 1500, y: 380, color: "#F59E0B", rotation: 8, fontSize: 95, font: "playful" }] },
  { character: "elder", text: "修丹爐。" },
  { character: "zhoumo", text: "修丹爐？聽起來很簡單。", effect: "sweat" },
  { character: "elder", text: "不簡單。這座丹爐有三百年歷史，上一位負責修理的弟子，被它罵哭了。", sfx: [{ text: "慘！", x: 960, y: 350, color: "#A78BFA", rotation: -5, fontSize: 110, font: "brush" }] },
  { character: "zhoumo", text: "丹爐......罵人？", effect: "surprise", sfx: [{ text: "？？？", x: 1500, y: 350, color: "#60A5FA", rotation: 5, fontSize: 100, font: "playful" }] },
  { character: "elder", text: "它會說話。而且說的都是髒話。昨天它還在罵我們煉器峰的人連火都不會點。", effect: "anger" },
  { character: "zhoumo", text: "有意思。技術上來說，一個有意識的丹爐，這是一個高級智能終端。" },
  { character: "elder", text: "你在說什麼？", effect: "dots" },
  { character: "zhoumo", text: "沒什麼。帶我去看看吧。" },
  { character: "elder", text: "到了，就是這座。你小心點，它最近心情不好。", sfx: [{ text: "哼！", x: 800, y: 300, color: "#EF4444", rotation: -10, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "嗯......火焰陣法老化、溫控模組失靈、意識晶片過載。所以您生氣是因為沒有人維護您，對吧？", effect: "sparkle" },
  { character: "elder", text: "它好像......安靜了？", effect: "surprise", sfx: [{ text: "嗯？", x: 960, y: 380, color: "#A78BFA", rotation: 3, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "問題的核心是使用者體驗。這座丹爐不是壞了，它是被忽視了三百年。", sfx: [{ text: "懂了！", x: 1500, y: 350, color: "#F59E0B", rotation: 8, fontSize: 90, font: "playful" }] },
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

  // Dramatic moment: encountering the furnace (line 10-11)
  const isFurnaceEncounter = currentLineIndex >= 10 && currentLineIndex <= 11;
  const isDiagnosis = currentLineIndex >= 11 && currentLineIndex <= 13;

  // Furnace encounter frame offset
  const furnaceFrame = (10 / dialogLines.length) * durationInFrames;
  const furnaceFrameOffset = frame - furnaceFrame;

  // Diagnosis moment: system notification
  const showDiagnosis = currentLineIndex >= 11 && currentLineIndex < 14;

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <ScreenShake
        delay={isFurnaceEncounter ? Math.floor(furnaceFrame) : undefined}
        intensity={12}
        duration={18}
      >
        <BackgroundLayer
          image="sect-gate.png"
          gradient="linear-gradient(135deg, #0a1a0e 0%, #1a2a1e 30%, #0a1a2e 60%, #0a0a1e 100%)"
        />

        {/* Concentration lines at furnace encounter */}
        {isFurnaceEncounter && (
          <ConcentrationLines delay={Math.floor(furnaceFrame)} angle={90} lineCount={25} duration={30} color="rgba(245, 158, 11, 0.4)" />
        )}

        {/* Triangle burst at furnace encounter */}
        {isFurnaceEncounter && (
          <TriangleBurst x={960} y={400} delay={Math.floor(furnaceFrame)} color="#F59E0B" count={6} maxRadius={300} />
        )}

        {/* Impact burst when furnace reacts */}
        {furnaceFrameOffset >= 0 && furnaceFrameOffset < 20 && (
          <ImpactBurst x={960} y={400} delay={Math.floor(furnaceFrame)} color="#EF4444" maxRadius={250} particleCount={16} />
        )}

        {/* Characters */}
        <CharacterSprite
          character="zhoumo"
          characterConfig={CHARACTERS.zhoumo}
          image="characters/zhoumo.png"
          chibi={false}
          chibiImage="characters/zhoumo-chibi.png"
          speaking={currentLine.character === "zhoumo"}
          side="left"
          background={currentLine.character !== "zhoumo"}
          effects={currentLine.character === "zhoumo" ? currentEffects : []}
        />

        <CharacterSprite
          character="elder"
          characterConfig={CHARACTERS.elder}
          image="characters/elder.png"
          speaking={currentLine.character === "elder"}
          side="right"
          background={currentLine.character !== "elder"}
          effects={currentLine.character === "elder" ? currentEffects : []}
        />

        <ComicEffects
          effects={currentEffects.filter((e) => e !== "shake")}
          side={currentLine.character === "zhoumo" ? "left" : "right"}
        />

        {/* Manga SFX */}
        <MangaSfx events={currentSfx} />

        {/* System notification during diagnosis */}
        {showDiagnosis && (
          <SystemNotification
            text="丹爐診斷中：分析意識晶片"
            type="info"
            delay={Math.max(0, frame - (11 / dialogLines.length) * durationInFrames)}
          />
        )}

        <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

        {/* Scene indicator */}
        <div style={{
          position: "absolute", top: 40, left: 60,
          opacity: indicatorOpacity, zIndex: 50,
        }}>
          <div style={{ color: "#34D399", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
            初見丹爐
          </div>
          <div style={{
            width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            height: 2, background: "linear-gradient(90deg, #34D399, transparent)", marginTop: 4,
          }} />
        </div>
      </ScreenShake>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
