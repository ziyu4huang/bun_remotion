import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import {
  CharacterSprite,
  ComicEffects,
  DialogBox,
  MangaSfx,
  SystemNotification,
  notoSansTC,
} from "@bun-remotion/shared";
import type { DialogLine, ComicEffect } from "@bun-remotion/shared";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import {
  ScreenShake, ImpactBurst, SpeedLines, ScreenFlash,
} from "../../../assets/components/BattleEffects";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * ContentScene1 — 鍋爐爆炸 + 陸陽初遇
 * Features: explosion FX, impact burst, speed lines, screen shake, screen flash
 */

const dialogLines: DialogLine[] = [
  { character: "zhoumo", text: "新的實驗！這次我改良了壓力釋放模組。理論上，效率應該提高百分之三百。", sfx: [{ text: "新實驗！", x: 960, y: 300, color: "#F59E0B", rotation: 0, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "三、二、一——啟動！", effect: "fire", sfx: [{ text: "啟動！", x: 1200, y: 350, color: "#EF4444", rotation: 5, fontSize: 120, font: "action" }] },
  { character: "luyang", text: "那個，不好意思打擾了，請問你們這裡有沒有投降表？", effect: "surprise", sfx: [{ text: "投降？", x: 600, y: 350, color: "#38BDF8", rotation: -8, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "什麼？", effect: "dots", sfx: [{ text: "？", x: 1500, y: 380, color: "#F59E0B", rotation: 0, fontSize: 100, font: "playful" }] },
  { character: "luyang", text: "我是問道宗新弟子陸陽，我的劍法叫「投降劍法」。剛才看到爆炸，想說先填好表，等一下可能用得上。" },
  { character: "zhoumo", text: "你的劍法叫投降劍法？", effect: "surprise", sfx: [{ text: "投降劍法？", x: 1300, y: 320, color: "#60A5FA", rotation: 8, fontSize: 90, font: "playful" }] },
  { character: "luyang", text: "對啊！核心招式是「我認輸」和「別打了」。防守效率極高——因為對手通常笑到沒力氣繼續打。", sfx: [{ text: "我認輸！", x: 600, y: 280, color: "#38BDF8", rotation: -5, fontSize: 90, font: "brush" }] },
  { character: "zhoumo", text: "從邏輯上來說，確實是最短路徑。你直接跳過了戰鬥過程，抵達了終點。" },
  { character: "luyang", text: "對吧！終於有人理解我了！其他人只會說我沒出息。", effect: "cry" },
  { character: "zhoumo", text: "不不不，你是把「效率」做到了極致。這是一種高級演算法思維。", effect: "sparkle", sfx: [{ text: "效率極致！", x: 1400, y: 300, color: "#F59E0B", rotation: 5, fontSize: 90, font: "brush" }] },
  { character: "luyang", text: "你，你是唯一一個說我好話的人。", effect: "cry" },
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

  // Key moments
  const isExplosion = currentLineIndex === 1;
  const isLuyangEntrance = currentLineIndex === 2;

  // Frame offsets
  const explosionFrame = (1 / dialogLines.length) * durationInFrames;
  const luyangFrame = (2 / dialogLines.length) * durationInFrames;

  const explosionOffset = frame - explosionFrame;
  const luyangOffset = frame - luyangFrame;

  // System notification during experiment
  const showExperiment = currentLineIndex >= 0 && currentLineIndex < 2;

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <ScreenShake
        delay={isExplosion ? Math.floor(explosionFrame) : undefined}
        intensity={18}
        duration={25}
      >
        <BackgroundLayer
          image="sect-gate.png"
          gradient="linear-gradient(135deg, #1a0a0e 0%, #2a1a1e 30%, #1a1a0e 60%, #0a0a1e 100%)"
        />

        {/* Explosion: screen flash */}
        {explosionOffset >= 0 && explosionOffset < 12 && (
          <ScreenFlash delay={Math.floor(explosionFrame)} duration={10} color="#EF4444" />
        )}

        {/* Explosion: impact burst */}
        {explosionOffset >= 0 && explosionOffset < 25 && (
          <ImpactBurst x={960} y={400} delay={Math.floor(explosionFrame)} color="#F97316" maxRadius={400} particleCount={24} />
        )}

        {/* Explosion: speed lines */}
        {isExplosion && (
          <SpeedLines delay={0} lineCount={12} color="rgba(239, 68, 68, 0.4)" />
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

        {/* 陸陽 appears from line 2 onward */}
        {currentLineIndex >= 2 && (
          <CharacterSprite
            character="luyang"
            characterConfig={CHARACTERS.luyang}
            image="characters/luyang.png"
            speaking={currentLine.character === "luyang"}
            side="right"
            background={currentLine.character !== "luyang"}
            effects={currentLine.character === "luyang" ? currentEffects : []}
          />
        )}

        <ComicEffects
          effects={currentEffects.filter((e) => e !== "shake")}
          side={currentLine.character === "zhoumo" ? "left" : "right"}
        />

        {/* Manga SFX */}
        <MangaSfx events={currentSfx} />

        {/* System notification during experiment */}
        {showExperiment && (
          <SystemNotification
            text="壓力釋放模組 v3.0 — 效率提升 300%"
            type="warning"
            delay={0}
          />
        )}

        <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

        {/* Scene indicator */}
        <div style={{
          position: "absolute", top: 40, left: 60,
          opacity: indicatorOpacity, zIndex: 50,
        }}>
          <div style={{ color: "#F97316", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
            鍋爐爆炸 × 陸陽初遇
          </div>
          <div style={{
            width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            height: 2, background: "linear-gradient(90deg, #F97316, transparent)", marginTop: 4,
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
