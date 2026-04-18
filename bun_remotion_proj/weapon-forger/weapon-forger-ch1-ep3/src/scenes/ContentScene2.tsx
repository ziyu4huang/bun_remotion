import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import {
  CharacterSprite, ComicEffects, DialogBox, SystemNotification, SystemMessage, MangaSfx,
  notoSansTC,
} from "@bun-remotion/shared";
import type { DialogLine, ComicEffect } from "@bun-remotion/shared";
import {
  ScreenShake, ScreenFlash, ImpactBurst,
  PowerUpRings, SpeedLines,
} from "../../../assets/components/BattleEffects";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * ContentScene2 — 周墨升級丹爐：情緒管理系統、語音控制、音樂播放
 * Features: power-up rings, impact burst, speed lines, screen flash
 */

const dialogLines: DialogLine[] = [
  { character: "zhoumo", text: "好了，我來幫您做一個全面的系統升級。火焰陣法重寫、自動控溫模組、還有——情緒管理系統。", sfx: [{ text: "升級！", x: 960, y: 400, color: "#F59E0B", rotation: 0, fontSize: 120, font: "brush" }] },
  { character: "elder", text: "情緒管理系統？你要給丹爐做心理諮詢？", effect: "surprise", sfx: [{ text: "什麼？", x: 600, y: 350, color: "#A78BFA", rotation: -8, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "準確地說，是情感交互界面。它生氣是因為沒有人聽它說話，所以我裝了一個傾聽模組。" },
  { character: "elder", text: "所以你修丹爐的方式是......陪它聊天？", effect: "dots", sfx: [{ text: "......", x: 700, y: 380, color: "#94A3B8", rotation: 0, fontSize: 80, font: "playful" }] },
  { character: "zhoumo", text: "這只是其中一個功能。我還加了語音控制。現在只需要說一聲「請幫忙燒一下」就自動點火了。", effect: "sparkle" },
  { character: "elder", text: "倒是方便。不過......為什麼它在唱歌？", effect: "surprise", sfx: [{ text: "♪～", x: 1100, y: 300, color: "#FBBF24", rotation: 10, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "哦，那是音樂播放功能。我覺得丹爐工作時也需要娛樂，不然多無聊。", effect: "sweat" },
  { character: "elder", text: "你連丹爐的使用者體驗都考慮到了？", effect: "sparkle" },
  { character: "zhoumo", text: "當然。使用者體驗是產品設計的核心。", sfx: [{ text: "核心！", x: 1500, y: 350, color: "#F59E0B", rotation: 8, fontSize: 95, font: "playful" }] },
  { character: "elder", text: "好吧......不過它會不會在半夜自動開派對？" },
  { character: "zhoumo", text: "不會。我加了定時休眠功能，它晚上會自動安靜下來。" },
  { character: "elder", text: "不錯不錯。看來你終於記得加停止鍵了。", effect: "gloating", sfx: [{ text: "嗯哼～", x: 700, y: 350, color: "#A78BFA", rotation: 5, fontSize: 90, font: "playful" }] },
  { character: "zhoumo", text: "嗯......不過我忘加音量控制了。", effect: "sweat", sfx: [{ text: "哎呀！", x: 1500, y: 380, color: "#EF4444", rotation: -8, fontSize: 100, font: "brush" }] },
];

export const ContentScene2: React.FC = () => {
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
  const isUpgradeStart = currentLineIndex === 0;
  const isSingingReveal = currentLineIndex === 5;
  const isFinalPunch = currentLineIndex === 12;

  // Frame offsets
  const upgradeFrame = (0 / dialogLines.length) * durationInFrames;
  const singingFrame = (5 / dialogLines.length) * durationInFrames;
  const punchFrame = (12 / dialogLines.length) * durationInFrames;

  const upgradeOffset = frame - upgradeFrame;
  const singingOffset = frame - singingFrame;
  const punchOffset = frame - punchFrame;

  // System notification: upgrade in progress
  const showUpgradeNotif = currentLineIndex >= 0 && currentLineIndex < 5;

  // Current SFX
  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <ScreenShake
        delay={isFinalPunch ? Math.floor(punchFrame) : undefined}
        intensity={10}
        duration={15}
      >
        <BackgroundLayer
          image="sect-gate.png"
          gradient="linear-gradient(135deg, #1a0a1e 0%, #2a1a2e 30%, #1a2a1e 60%, #0a0a1e 100%)"
        />

        {/* Power-up rings during upgrade */}
        {currentLineIndex >= 0 && currentLineIndex < 4 && (
          <PowerUpRings x={960} y={450} delay={Math.floor(upgradeFrame)} color="#F59E0B" ringCount={4} maxRadius={400} />
        )}

        {/* Impact burst at upgrade start */}
        {upgradeOffset >= 0 && upgradeOffset < 20 && (
          <ImpactBurst x={960} y={450} delay={Math.floor(upgradeFrame)} color="#F59E0B" maxRadius={300} particleCount={18} />
        )}

        {/* Screen flash at singing reveal */}
        {singingOffset >= 0 && singingOffset < 10 && (
          <ScreenFlash delay={Math.floor(singingFrame)} duration={8} color="#FBBF24" />
        )}

        {/* Speed lines during final punchline */}
        {isFinalPunch && (
          <SpeedLines delay={0} lineCount={8} color="rgba(239, 68, 68, 0.3)" />
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

        {/* System notification during upgrade */}
        {showUpgradeNotif && (
          <SystemNotification
            text="丹爐升級中：安裝情緒管理系統"
            type="success"
            delay={Math.max(0, frame - upgradeFrame)}
          />
        )}

        {/* Big text at singing reveal */}
        {singingOffset >= 5 && singingOffset < 50 && (
          <SystemMessage
            text="🎵 丹爐唱歌中 🎵"
            delay={Math.floor(singingFrame) + 5}
            position="center"
            color="#FBBF24"
          />
        )}

        <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

        {/* Scene indicator */}
        <div style={{
          position: "absolute", top: 40, left: 60,
          opacity: indicatorOpacity, zIndex: 50,
        }}>
          <div style={{ color: "#F59E0B", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
            丹爐升級
          </div>
          <div style={{
            width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            height: 2, background: "linear-gradient(90deg, #F59E0B, transparent)", marginTop: 4,
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
