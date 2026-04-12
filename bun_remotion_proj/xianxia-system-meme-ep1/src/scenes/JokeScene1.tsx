import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { SystemNotification, MissionPanel } from "../components/SystemOverlay";
import type { DialogLine } from "../characters";

// 梗一：系統綁定 — 修修突然被綁定修仙系統
const lines: DialogLine[] = [
  { character: "xiuxiu", text: "啊——頭好痛！剛才打坐的時候到底發生了什麼？" },
  { character: "system", text: "叮！修仙系統已成功綁定宿主。" },
  { character: "xiuxiu", text: "誰在說話？系統？什麼系統？", effect: "surprise" },
  { character: "system", text: "本系統將協助宿主完成修仙之路。請查收新手任務。" },
  { character: "xiuxiu", text: "等等等等，我連築基都還沒完成，你綁定我幹嘛？" },
  { character: "system", text: "新手任務：在十秒內向師姐表白。失敗懲罰：抹除。", effect: "shock" },
  { character: "xiuxiu", text: "抹除？！抹除是什麼意思！我不要被抹除啊！", effect: ["fire", "shake"] },
  { character: "system", text: "倒數計時開始。十、九、八..." },
  { character: "xiuxiu", text: "這個系統是認真的嗎！", effect: "cry" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Scene indicator
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // System notification appears on line index 1 (system first speaks)
  const systemNotifLineIndex = 1;
  const systemNotifStart = (systemNotifLineIndex / lines.length) * durationInFrames;
  const systemNotifDelay = Math.max(0, frame - systemNotifStart);

  // Mission panel appears on line index 5 (抹除 warning)
  const missionLineIndex = 5;
  const missionStart = (missionLineIndex / lines.length) * durationInFrames;
  const missionDelay = Math.max(0, frame - missionStart);

  return (
    <AbsoluteFill>
      <BackgroundLayer gradient="linear-gradient(135deg, #0a1a2e 0%, #1a0a3e 40%, #0a2a1e 70%, #0a0a2e 100%)" />

      {/* Mystical glow */}
      <div style={{
        position: "absolute", top: "20%", left: "40%",
        width: 400, height: 300, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(52, 211, 153, 0.1), transparent)",
        filter: "blur(50px)", pointerEvents: "none",
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
        speaking={false}
        side="right"
        background={true}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiuxiu" ? "left" : "center"}
      />

      {/* System notification overlay when system first speaks */}
      {currentLineIndex >= systemNotifLineIndex && currentLineIndex < systemNotifLineIndex + 3 && (
        <SystemNotification
          text="修仙系統已綁定宿主"
          type="mission"
          delay={systemNotifDelay}
        />
      )}

      {/* Mission panel with punishment warning */}
      {currentLineIndex >= missionLineIndex && currentLineIndex < missionLineIndex + 3 && (
        <MissionPanel
          title="新手任務"
          objective="十秒內向師姐表白"
          punishment="抹除"
          delay={missionDelay}
        />
      )}

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene title indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#34D399", fontSize: 24, fontWeight: 700, fontFamily: "sans-serif" }}>
          梗一：系統綁定
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #34D399, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: string | string[]): string[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}
