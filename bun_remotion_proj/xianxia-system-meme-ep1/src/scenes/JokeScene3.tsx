import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { BattleAura, SlashEffect, ImpactBurst, SpeedLines, ScreenFlash } from "../components/BattleEffects";
import { SystemNotification } from "../components/SystemOverlay";
import { DialogBox } from "../components/DialogBox";
import { notoSansTC } from "../characters";
import type { DialogLine } from "../characters";

/**
 * 梗三：Q版戰鬥模式 — 修修的尷尬 vs 師姐的淡定
 * This is the showcase scene for chibi battle effects!
 * Uses a simplified "battle scene" pattern with vector effects.
 */

// Battle-phase dialog
const battleLines: DialogLine[] = [
  { character: "xiuxiu", text: "等等，剛才那個表白不算數吧？", effect: "sweat" },
  { character: "shijie", text: "怎麼？說了就說了，修仙之人豈能出爾反爾。" },
  { character: "system", text: "叮！觸發隱藏任務：與師姐進行修仙對決。" },
  { character: "xiuxiu", text: "什麼！我打不過師姐啊！", effect: "shock" },
  { character: "system", text: "任務獎勵：晉升一個境界。失敗懲罰：退回煉氣期。", effect: "shock" },
  { character: "xiuxiu", text: "我連煉氣期都還沒離開，退回去是什麼？變回凡人嗎！", effect: ["cry", "shake"] },
  { character: "shijie", text: "來吧，師弟。讓我看看你有多少斤兩。", effect: "sparkle" },
  { character: "xiuxiu", text: "接招！修修超究極奧義——！", effect: "fire" },
  { character: "shijie", text: "就這？", effect: "dots" },
  { character: "xiuxiu", text: "我的靈力...用完了...", effect: "cry" },
];

export const JokeScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * battleLines.length),
    battleLines.length - 1
  );
  const currentLine = battleLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Battle phase timing
  const isPreBattle = currentLineIndex < 3;
  const isBattleActive = currentLineIndex >= 3 && currentLineIndex < 8;
  const isPostBattle = currentLineIndex >= 8;

  // Slash effect triggers when 修修 attacks (line 7)
  const attackLineIndex = 7;
  const attackStart = (attackLineIndex / battleLines.length) * durationInFrames;
  const attackFrame = frame - attackStart;

  // Impact triggers when 師姐 deflects (line 8)
  const deflectLineIndex = 8;
  const deflectStart = (deflectLineIndex / battleLines.length) * durationInFrames;
  const deflectFrame = frame - deflectStart;

  // Background flash for battle activation
  const battleActivationFrame = (3 / battleLines.length) * durationInFrames;

  // Scene title indicator
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Battle arena ground line
  const groundOpacity = isBattleActive ? interpolate(frame, [battleActivationFrame, battleActivationFrame + 20], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) : 0;

  return (
    <AbsoluteFill>
      <BackgroundLayer gradient="linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 30%, #2a0a3e 60%, #0a0a2e 100%)" />

      {/* Battle arena ground glow */}
      <div style={{
        position: "absolute", bottom: "25%", left: "10%", right: "10%",
        height: 3,
        background: "linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), rgba(244, 114, 182, 0.5), transparent)",
        opacity: groundOpacity,
        boxShadow: "0 0 20px rgba(96, 165, 250, 0.3), 0 0 40px rgba(244, 114, 182, 0.2)",
        pointerEvents: "none",
      }} />

      {/* Character auras during battle */}
      {isBattleActive && (
        <>
          <BattleAura x={350} y={700} color="#60A5FA" intensity={0.8} />
          <BattleAura x={1570} y={700} color="#F472B6" intensity={0.8} />
        </>
      )}

      <CharacterSprite
        character="xiuxiu"
        image="xiuxiu.png"
        chibi={true}
        chibiImage="xiuxiu-chibi.png"
        speaking={currentLine.character === "xiuxiu"}
        side="left"
        background={currentLine.character !== "xiuxiu"}
        effects={currentLine.character === "xiuxiu" ? currentEffects : []}
      />
      <CharacterSprite
        character="shijie"
        image="shijie.png"
        chibi={true}
        chibiImage="shijie-chibi.png"
        speaking={currentLine.character === "shijie"}
        side="right"
        background={currentLine.character !== "shijie"}
        effects={currentLine.character === "shijie" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiuxiu" ? "left" : currentLine.character === "shijie" ? "right" : "center"}
      />

      {/* Battle effects! */}
      {/* Speed lines during battle */}
      {isBattleActive && <SpeedLines delay={0} lineCount={16} />}

      {/* Slash when 修修 attacks */}
      {attackFrame >= 0 && attackFrame < 40 && (
        <SlashEffect delay={0} direction="ltr" color="#60A5FA" thickness={6} />
      )}

      {/* Impact burst when 師姐 deflects */}
      {deflectFrame >= 0 && deflectFrame < 40 && (
        <>
          <ImpactBurst x={1200} y={500} delay={0} color="#F472B6" maxRadius={200} particleCount={12} />
          <ScreenFlash delay={0} duration={8} color="#F472B6" />
        </>
      )}

      {/* System notification at battle start */}
      {currentLineIndex >= 2 && currentLineIndex < 5 && (
        <SystemNotification
          text="隱藏任務：修仙對決"
          type="warning"
          delay={Math.max(0, frame - (2 / battleLines.length) * durationInFrames)}
        />
      )}

      <DialogBox lines={battleLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* "VS" indicator during battle */}
      {isBattleActive && (
        <div style={{
          position: "absolute", top: "15%", left: "50%",
          transform: "translateX(-50%)",
          fontFamily: notoSansTC,
          pointerEvents: "none", zIndex: 50,
          opacity: interpolate(frame, [battleActivationFrame, battleActivationFrame + 15], [0, 0.7], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}>
          <div style={{
            fontSize: 48, fontWeight: 900,
            color: "#FFD700",
            textShadow: "0 0 20px rgba(255, 215, 0, 0.6), 0 2px 8px rgba(0,0,0,0.8)",
            letterSpacing: "0.2em",
          }}>
            VS
          </div>
        </div>
      )}

      {/* Scene title indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#60A5FA", fontSize: 24, fontWeight: 700, fontFamily: "sans-serif" }}>
          梗三：Q版戰鬥模式
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #60A5FA, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: string | string[]): string[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}
