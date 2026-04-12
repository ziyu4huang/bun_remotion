import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { EnergyWave, BattleAura } from "../components/BattleEffects";
import { DialogBox } from "../components/DialogBox";
import { notoSansTC } from "../characters";
import type { DialogLine, ComicEffect } from "../characters";

/**
 * 梗二：修修的靈力波 — 展示 EnergyWave（弱版）
 * xiuxiu 嘗試施展靈力波，結果只有三條微弱的線。
 */

const dialogLines: DialogLine[] = [
  { character: "system", text: "叮！緊急技能解鎖：靈力波。" },
  { character: "xiuxiu", text: "靈力波？聽起來很厲害啊！" },
  { character: "system", text: "請將靈力集中在雙手，向前推出。" },
  { character: "xiuxiu", text: "看我的——修修超究極靈力波！！", effect: "fire" },
  { character: "shijie", text: "...", effect: "dots" },
  { character: "xiuxiu", text: "怎麼...怎麼只有三條線？", effect: "sweat" },
  { character: "system", text: "靈力不足，技能已自動降級為「靈力微風」。" },
  { character: "xiuxiu", text: "微風？！", effect: "anger" },
  { character: "shijie", text: "師弟，我感覺到了。真的很像微風。", effect: "laugh" },
  { character: "xiuxiu", text: "系統，你給我的技能是不是有bug！", effect: "anger" },
  { character: "system", text: "本系統沒有bug，只有靈力不足的宿主。" },
];

export const JokeScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1
  );
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // EnergyWave triggers when xiuxiu fires (line 3: "修修超究極靈力波")
  const waveLineIndex = 3;
  const waveStart = (waveLineIndex / dialogLines.length) * durationInFrames;
  const waveFrame = frame - waveStart;

  // xiuxiu's aura during "fire" moment
  const showAura = currentLineIndex >= 3 && currentLineIndex < 6;

  // Scene indicator
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer gradient="linear-gradient(135deg, #0a1a2e 0%, #1a0a3e 50%, #0a2a3e 100%)" />

      {/* xiuxiu's aura during the attempt */}
      {showAura && <BattleAura x={350} y={700} color="#60A5FA" intensity={0.5} />}

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

      {/* Weak EnergyWave — only 3 lines, thin, low intensity */}
      {waveFrame >= 0 && waveFrame < 45 && (
        <EnergyWave
          fromX={400}
          fromY={540}
          toX={1500}
          toY={540}
          delay={0}
          color="#60A5FA"
          waveCount={3}
          spread={15}
          thickness={2}
          intensity={0.3}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene title */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#60A5FA", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          梗二：修修的靈力波
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #60A5FA, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
