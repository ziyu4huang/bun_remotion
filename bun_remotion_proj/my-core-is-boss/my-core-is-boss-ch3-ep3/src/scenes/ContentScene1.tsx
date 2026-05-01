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
  { character: "narrator" as const, text: "穿過守護者迷宮的最深處，林逸和趙小七來到了秘境的底層。巨大的競技場中央，一頭通體漆黑的上古兇獸正在緩緩睜開眼睛。它就是噬天蛟，三千年前被封印在秘境中的存在。", emotion: "default" as const },
  { character: "narrator" as const, text: "噬天蛟甦醒的瞬間，整個競技場都在顫動。然而林逸的視線沒有看向兇獸本身，而是看向了系統浮現在他面前的資訊面板——仇恨值列表和路徑尋找邏輯。", emotion: "default" as const },
  { character: "linyi" as const, text: "嗯……仇恨值列表，路徑尋找邏輯……追尾判定、碰撞體積、轉向速率……哈，這 Boss 的 AI 也太爛了吧。路徑尋找連大體型碰撞都沒處理。", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "師、師兄！上古兇獸甦醒了！我們要跑嗎？！", emotion: "shock" as const },
  { character: "linyi" as const, text: "跑什麼？這不就是個 Boss 戰嗎。放心，繞柱就行。MMO 玩家基本功。", emotion: "smile" as const },
  { character: "narrator" as const, text: "林逸說完，毫不猶豫地衝上前，對著噬天蛟揮了一拳。仇恨值瞬間拉滿。然後，他轉身就跑——繞著場地中央的巨大石柱開始跑圈。", emotion: "default" as const },
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

  const showAggroPanel = frame >= durationInFrames * 0.2 && frame <= durationInFrames * 0.45;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="boss-arena.png" />

      <div style={{
        position: "absolute", top: -50, left: "20%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="秘境最底層·Boss 競技場" color="#EF4444" />

      {showAggroPanel && (
        <SystemNotification
          text="仇恨列表已載入 — 路徑尋找：大體型碰撞未處理"
          type="danger"
          delay={0}
        />
      )}

      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi" && currentLine.character !== "zhaoxiaoqi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {currentLine.character === "zhaoxiaoqi" && (
        <CharacterSprite
          character="zhaoxiaoqi"
          emotion={currentLine.emotion}
          speaking={true}
          side="right"
          background={false}
          effects={normalizeEffects(currentLine.effect)}
        />
      )}

      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
