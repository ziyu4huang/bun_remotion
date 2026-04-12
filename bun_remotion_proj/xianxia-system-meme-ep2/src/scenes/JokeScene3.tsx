import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { KamehamehaBeam, SpeedLines, BattleAura, ScreenShake } from "../components/BattleEffects";
import { SystemNotification } from "../components/SystemOverlay";
import { DialogBox } from "../components/DialogBox";
import { notoSansTC } from "../characters";
import type { DialogLine, ComicEffect } from "../characters";

/**
 * 梗三：師姐的龜派氣功 — 展示 KamehamehaBeam（全力）
 * 這是 ep2 的高潮場景！師姐示範真正的靈力波。
 */

const dialogLines: DialogLine[] = [
  { character: "xiuxiu", text: "師姐，妳能示範一下什麼叫真正的靈力波嗎？" },
  { character: "shijie", text: "你確定要看？這裡可能會被炸掉。" },
  { character: "xiuxiu", text: "沒關係，我有系統保護！" },
  { character: "system", text: "本系統不提供物理防護。" },
  { character: "xiuxiu", text: "什麼時候說的！", effect: "shock" },
  { character: "shijie", text: "那我就不客氣了。" },
  // Charge phase — shijie starts gathering energy
  { character: "shijie", text: "龜——派——氣——功——" },
  // System warning during charge
  { character: "system", text: "警告！偵測到危險等級靈力波動。建議宿主立即撤退。" },
  { character: "xiuxiu", text: "來不及了啦！！", effect: "shock" },
  // Fire!
  { character: "shijie", text: "——哈！！", effect: "fire" },
  // Aftermath
  { character: "xiuxiu", text: "我的頭髮被燒掉了...", effect: "cry" },
  { character: "system", text: "考試結束。考生修修，不及格。考場已毀損。" },
  { character: "shijie", text: "抱歉抱歉，力道沒控制好。", effect: "laugh" },
];

export const JokeScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1
  );
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // KamehamehaBeam timing:
  // Charge starts at line 6 ("龜——派——氣——功——")
  // Fire at line 9 ("——哈！！")
  // We delay the beam so charge aligns with line 6 and fire with line 9
  const chargeLineIndex = 6;
  const beamStartFrame = (chargeLineIndex / dialogLines.length) * durationInFrames;
  const beamFrame = frame - beamStartFrame;

  // Battle phase: from line 5 onward
  const isBattlePhase = currentLineIndex >= 5;

  // System warning during charge (lines 7-8)
  const showWarning = currentLineIndex >= 7 && currentLineIndex < 9;

  // Speed lines during beam fire (lines 9-10)
  const fireLineIndex = 9;
  const speedLinesStart = (fireLineIndex / dialogLines.length) * durationInFrames;
  const showSpeedLines = frame >= speedLinesStart && frame < speedLinesStart + 40;

  // VS indicator during battle
  const battleActivationFrame = (5 / dialogLines.length) * durationInFrames;

  // Scene indicator
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Battle arena ground line
  const groundOpacity = isBattlePhase ? interpolate(frame, [battleActivationFrame, battleActivationFrame + 20], [0, 0.6], {
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
        background: "linear-gradient(90deg, transparent, rgba(244, 114, 182, 0.5), rgba(96, 165, 250, 0.5), transparent)",
        opacity: groundOpacity,
        boxShadow: "0 0 20px rgba(244, 114, 182, 0.3), 0 0 40px rgba(96, 165, 250, 0.2)",
        pointerEvents: "none",
      }} />

      {/* Character auras during battle */}
      {isBattlePhase && (
        <>
          <BattleAura x={350} y={700} color="#60A5FA" intensity={0.6} />
          <BattleAura x={1570} y={700} color="#F472B6" intensity={1.2} />
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

      {/* KamehamehaBeam! */}
      {beamFrame >= 0 && beamFrame < 80 && (
        <KamehamehaBeam
          fromX={1570}
          fromY={540}
          toX={200}
          toY={540}
          delay={0}
          color="#F472B6"
          chargeColor="#F472B6"
          intensity={1}
          chargeDuration={20}
          fireDuration={8}
          sustainDuration={15}
        />
      )}

      {/* Speed lines during impact */}
      {showSpeedLines && <SpeedLines delay={0} lineCount={20} />}

      {/* System warning */}
      {showWarning && (
        <SystemNotification
          text="警告：偵測到危險等級靈力波動"
          type="warning"
          delay={Math.max(0, frame - (7 / dialogLines.length) * durationInFrames)}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* "VS" indicator */}
      {isBattlePhase && (
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

      {/* Scene title */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#F472B6", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          梗三：師姐的龜派氣功
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #F472B6, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
