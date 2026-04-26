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
  { character: "narrator" as const, text: "林逸帶著趙小七重新進入秘境。上次的穿牆路線太無聊了，這次他打算走正常路線看看。秘境第二層是一個巨大的迷宮，牆壁上刻滿了上古符文，每隔一段就有一個岔路。", emotion: "default" as const },
  { character: "linyi" as const, text: "這迷宮少說有幾百個岔路，靠試的話得走幾年吧。系統有沒有攻略？", emotion: "confused" as const },
  { character: "narrator" as const, text: "系統彈出提示：「新技能已解鎖：查看代碼。功能：顯示目標的底層法則。消耗：極低。限制：無。」", emotion: "default" as const },
  { character: "linyi" as const, text: "查看代碼？不就是開發者模式嗎。讓我看看這迷宮是怎麼寫的……", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "narrator" as const, text: "林逸對著迷宮入口使用了「查看代碼」。瞬間，整個迷宮的結構以半透明藍色線條浮現在空中——每條路、每個死胡同、每個隱藏通道，全部可見。就像打開了迷宮的源代碼。", emotion: "default" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "哈，這迷宮的邏輯挺簡單的。右轉、左轉、右轉、穿牆……等等，最後一步是穿牆？設計這個迷宮的人是不是忘了加邊界檢測？", emotion: "smile" as const },
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

  const showViewCodeUnlock = frame >= durationInFrames * 0.3 && frame <= durationInFrames * 0.5;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="ancient-realm-inside.png" />

      <div style={{
        position: "absolute", top: -50, left: "20%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="秘境第二層·上古迷宮" color="#60A5FA" />

      {showViewCodeUnlock && (
        <SystemNotification
          text="查看代碼 已解鎖 — 功能：顯示底層法則"
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
