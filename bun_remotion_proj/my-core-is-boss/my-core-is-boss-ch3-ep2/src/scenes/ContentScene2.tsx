import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "../../../assets/characters";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene2";

const dialogLines = [
  { character: "narrator" as const, text: "迷宮盡頭是一扇巨大的石門，門上浮著一個半透明的身影——三千年前佈置迷宮的守護者殘魂。他的任務只有一個：阻止任何人通過迷宮。", emotion: "default" as const },
  { character: "narrator" as const, text: "守護者看到林逸的那一刻，整個迷宮都震動了。因為林逸身上浮著一層淡藍色的光——那是「查看代碼」激活時的法則顯示。守護者第一次看到有人帶著自己創造的藍圖走進來。", emotion: "default" as const, effect: "shock" as ComicEffect },
  { character: "narrator" as const, text: "守護者的殘魂顫抖著開口：「你……你看到了？」", emotion: "default" as const },
  { character: "linyi" as const, text: "嗯，看到了。這迷宮的第三十七個岔路左轉是死路，建議改成右轉。還有第五十二個轉角的符文陣有個邏輯錯誤，會導致迷路者永遠繞圈。", emotion: "smile" as const },
  { character: "narrator" as const, text: "守護者沉默了。他守了三千年的迷宮，被一個外門弟子用十秒鐘找到了所有 bug。", emotion: "default" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "師兄在跟迷宮守護者……討論迷宮設計缺陷？這是修仙還是代碼審查？", emotion: "confused" as const },
  { character: "narrator" as const, text: "趙小七的筆記本翻開了新的一頁：《迷宮源代碼分析手冊——林逸師兄的代碼審查記錄》。旁註：「師兄說第三十七個岔路有 bug，但老師說三千年前沒有 bug 這個詞。」", emotion: "default" as const },
];

export const ContentScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = getLineIndex(
    frame,
    durationInFrames,
    dialogLines.length,
    segmentDurations[SCENE_NAME],
  );
  const currentLine = dialogLines[currentLineIndex];

  return (
    <AbsoluteFill>
      <BackgroundLayer image="ancient-realm-inside.png" />

      <div style={{
        position: "absolute", top: -50, right: "15%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="迷宮盡頭·守護者石門" color="#A78BFA" />

      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
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
