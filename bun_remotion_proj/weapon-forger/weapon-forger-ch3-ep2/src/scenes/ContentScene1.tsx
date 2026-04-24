import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite, ComicEffects, SystemNotification, DialogBox, MangaSfx, notoSansTC } from "@bun-remotion/shared";
import type { DialogLine, ComicEffect } from "@bun-remotion/shared";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * ContentScene1 — 秘境深處，倒數計時，發現智商測試中心
 * Features: countdown timer, hidden subsystem discovery, comedic banter
 */

const dialogLines: DialogLine[] = [
  { character: "zhoumo" as any, text: "秘境深處。倒數已經從一百八十息變成一百二十息。地面每隔十息震動一次，牆上的上古文字閃爍著紅光。" },
  { character: "luyang" as any, text: "我覺得我們應該往左走。直覺告訴我左邊有出口。", sfx: [{ text: "直覺！", x: 500, y: 320, color: "#38BDF8", rotation: -8, fontSize: 90, font: "playful" }] },
  { character: "mengjingzhou" as any, text: "你上次直覺告訴你食堂有折扣，結果那是上個月的事。", effect: "dots" as ComicEffect, sfx: [{ text: "上個月", x: 1300, y: 350, color: "#FB923C", rotation: 5, fontSize: 85, font: "playful" }] },
  { character: "zhoumo" as any, text: "別爭了。我發現這個秘境的禁制系統底層有一個隱藏的子系統，從未被啟動過。坐標在正前方。", sfx: [{ text: "隱藏系統！", x: 960, y: 280, color: "#F59E0B", rotation: 0, fontSize: 100, font: "action" }] },
  { character: "luyang" as any, text: "等等，你怎麼發現的？" },
  { character: "zhoumo" as any, text: "我剛才用雷射筆切斷禁制的時候，順便掃描了一下整個結構。工程師的基本習慣——動刀之前先做CT。", effect: "sparkle" as ComicEffect, sfx: [{ text: "先做CT！", x: 960, y: 300, color: "#34D399", rotation: 0, fontSize: 95, font: "brush" }] },
  { character: "mengjingzhou" as any, text: "你切之前怎麼不做CT？", effect: "sweat" as ComicEffect },
  { character: "zhoumo" as any, text: "……那是流程上的優化空間。", effect: "sweat" as ComicEffect, sfx: [{ text: "優化空間", x: 960, y: 320, color: "#F59E0B", rotation: 3, fontSize: 90, font: "playful" }] },
  { character: "zhoumo" as any, text: "三人到達秘境核心。一扇巨大的石門出現在眼前，上面刻著八個大字——「智商測試中心，請勿作弊」。石門自動開啟，裡面是一個空曠的大廳，中央漂浮著一個發光的水晶球。", sfx: [{ text: "智商測試！", x: 960, y: 250, color: "#A78BFA", rotation: 0, fontSize: 120, font: "action" }] },
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
  const currentEffects = normalizeEffects(currentLine.effect as ComicEffect | undefined);
  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Countdown timer
  const countdownValue = Math.max(0, 120 - Math.floor(frame / 3));

  // Red pulse for urgency
  const pulsePhase = Math.sin(frame * 0.15);
  const pulseIntensity = interpolate(pulsePhase, [-1, 1], [0.02, 0.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="secret-realm.png"
        gradient={`linear-gradient(135deg, #0a0a1e 0%, #0a0a2e 30%, #1a0a2e 60%, #0a0a1e 100%)`}
      />

      {/* Urgency red pulse */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at center, rgba(239, 68, 68, ${pulseIntensity}), transparent 70%)`,
        zIndex: 0,
        pointerEvents: "none",
      }} />

      {/* Countdown timer */}
      <div style={{
        position: "absolute",
        top: 80,
        right: 80,
        zIndex: 60,
        fontFamily: notoSansTC,
        padding: "16px 24px",
        borderRadius: 8,
        background: "rgba(239, 68, 68, 0.15)",
        border: "2px solid rgba(239, 68, 68, 0.4)",
      }}>
        <div style={{ fontSize: 18, color: "#EF4444", fontWeight: 700, letterSpacing: "0.1em" }}>
          自毀倒數
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: countdownValue < 60 ? "#EF4444" : "#F59E0B",
          textShadow: `0 0 20px ${countdownValue < 60 ? "rgba(239, 68, 68, 0.6)" : "rgba(245, 158, 11, 0.4)"}`,
          fontVariantNumeric: "tabular-nums",
        }}>
          {countdownValue}息
        </div>
      </div>

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
        character="luyang"
        characterConfig={CHARACTERS.luyang}
        image="characters/luyang.png"
        speaking={currentLine.character === "luyang"}
        side="center"
        background={currentLine.character !== "luyang"}
        effects={currentLine.character === "luyang" ? currentEffects : []}
      />

      <CharacterSprite
        character="mengjingzhou"
        characterConfig={CHARACTERS.mengjingzhou}
        image="characters/mengjingzhou.png"
        speaking={currentLine.character === "mengjingzhou"}
        side="right"
        background={currentLine.character !== "mengjingzhou"}
        effects={currentLine.character === "mengjingzhou" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects}
        side={
          currentLine.character === "zhoumo" ? "left"
          : currentLine.character === "luyang" ? "center"
          : "right"
        }
      />

      <MangaSfx events={currentSfx} />

      {/* System notification at discovery */}
      {currentLineIndex === 8 && (
        <SystemNotification
          text="系統掃描完成：隱藏子系統「智商測試中心」已啟動"
          type="info"
          delay={0}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#F59E0B", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          秘境深處 × 隱藏系統
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
