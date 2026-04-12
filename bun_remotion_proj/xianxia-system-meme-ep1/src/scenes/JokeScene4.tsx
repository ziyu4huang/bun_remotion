import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { SystemNotification, MissionPanel } from "../components/SystemOverlay";
import type { DialogLine } from "../characters";

// 梗四：師姐的真面目 — 反轉結局
const lines: DialogLine[] = [
  { character: "shijie", text: "師弟，你今天的表現讓我很滿意。", effect: "sparkle" },
  { character: "xiuxiu", text: "師姐...剛才那些不是我在演戲，我是真的害怕啊...", effect: "sweat" },
  { character: "shijie", text: "告訴你一個秘密。", effect: "heart" },
  { character: "xiuxiu", text: "什麼秘密？" },
  { character: "shijie", text: "這個修仙系統啊，是我安裝的。", effect: "surprise" },
  { character: "xiuxiu", text: "什麼？！師姐妳——！", effect: "shock" },
  { character: "shijie", text: "我只是想聽你親口說那句話而已。", effect: "heart" },
  { character: "xiuxiu", text: "妳知不知道我差點被抹除啊！", effect: "anger" },
  { character: "shijie", text: "放心，抹除是假的。但下次的任務是真的喔。", effect: "laugh" },
  { character: "system", text: "叮！新任務發布：在師姐面前做一百個伏地挺身。" },
  { character: "xiuxiu", text: "我的靈力還沒恢復啊——！", effect: "cry" },
];

export const JokeScene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // New mission notification at line 9
  const newMissionLineIndex = 9;
  const newMissionStart = (newMissionLineIndex / lines.length) * durationInFrames;

  return (
    <AbsoluteFill>
      <BackgroundLayer gradient="linear-gradient(135deg, #1a0a2e 0%, #2a0a3e 40%, #3a1a4e 70%, #1a0a2e 100%)" />

      {/* Romantic atmosphere glow */}
      <div style={{
        position: "absolute", top: "30%", left: "45%",
        width: 500, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(244, 114, 182, 0.08), transparent)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <CharacterSprite
        character="xiuxiu"
        image="xiuxiu.png"
        speaking={currentLine.character === "xiuxiu"}
        side="left"
        background={currentLine.character !== "xiuxiu"}
        effects={currentLine.character === "xiuxiu" ? currentEffects : []}
      />
      <CharacterSprite
        character="shijie"
        image="shijie.png"
        speaking={currentLine.character === "shijie"}
        side="right"
        background={currentLine.character !== "shijie"}
        effects={currentLine.character === "shijie" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiuxiu" ? "left" : currentLine.character === "shijie" ? "right" : "center"}
      />

      {/* New mission notification */}
      {currentLineIndex >= newMissionLineIndex && (
        <>
          <SystemNotification
            text="新任務：做一百個伏地挺身"
            type="warning"
            delay={Math.max(0, frame - newMissionStart)}
          />
          <MissionPanel
            title="日常任務"
            objective="在師姐面前做一百個伏地挺身"
            punishment="公開朗讀昨天的日記"
            delay={Math.max(0, frame - newMissionStart)}
            position="right"
          />
        </>
      )}

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene title indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#F472B6", fontSize: 24, fontWeight: 700, fontFamily: "sans-serif" }}>
          梗四：師姐的真面目
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #F472B6, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: string | string[]): string[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}
