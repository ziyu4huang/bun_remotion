import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "../../../assets/characters";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene1";

const dialogLines = [
  { character: "narrator" as const, text: "秘境入口前，數百名修行者肅穆列隊。石壁上刻著三千年前的古文：「非有大毅力、大智慧、大機緣者，不得入內。」", emotion: "default" as const },
  { character: "linyi" as const, text: "這秘境就一個入口？排隊排到什麼時候……系統有沒有快速通道？", emotion: "confused" as const },
  { character: "narrator" as const, text: "系統面板彈出一條新通知：「noclip 模式已解鎖。功能：穿牆。消耗：零。冷卻：零。」", emotion: "default" as const },
  { character: "linyi" as const, text: "穿牆？這不是經典作弊碼嗎？這遊戲居然有控制台。省得排隊了。", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "narrator" as const, text: "就在所有修行者準備正式闖關的時候，林逸面朝石壁，直接走了過去。沒有停止。沒有碰撞。他就那樣穿過了三千年無人能破的石壁，像穿過一層薄霧。", emotion: "default" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "嗯，還挺順滑的，沒有延遲。這穿牆手感不錯。", emotion: "smile" as const },
];

export const ContentScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = getLineIndex(
    frame,
    durationInFrames,
    dialogLines.length,
    segmentDurations[SCENE_NAME],
  );
  const currentLine = dialogLines[currentLineIndex];

  const showNoclipUnlock = frame >= durationInFrames * 0.3 && frame <= durationInFrames * 0.5;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="ancient-realm-entrance.png" />

      <div style={{
        position: "absolute", top: -50, left: "20%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="上古秘境·虛空遺跡入口" color="#60A5FA" />

      {showNoclipUnlock && (
        <SystemNotification
          text="noclip 模式已解鎖 — 功能：穿牆 — 消耗：0"
          type="success"
          delay={0}
        />
      )}

      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
