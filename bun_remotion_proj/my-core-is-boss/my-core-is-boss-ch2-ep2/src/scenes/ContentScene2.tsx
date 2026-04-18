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
  { character: "narrator" as const, text: "趙小七循著靈力波動找到洞窟，看到一幕讓她畢生難忘的景象。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "師、師兄？！", emotion: "shock" as const },
  { character: "narrator" as const, text: "林逸站在洞窟中央，周圍的妖獸排著隊，一隻接一隻走過來，然後在他面前倒下。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "妖獸們……排隊來朝拜師兄？這、這是傳說中的「萬獸朝聖」！", emotion: "shock" as const, effect: "sparkle" as ComicEffect },
  { character: "linyi" as const, text: "什麼朝聖？我在刷經驗值。這裡刷新率超高，站著不動就行。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "「刷新率」——師兄是指天道輪迴的速度嗎？！妖獸們選擇在師兄面前倒下，是因為感應到了超越天道的氣息！", emotion: "think" as const },
  { character: "linyi" as const, text: "不是，牠們重生點就在這。打死三十秒又出來一隻，跟打地鼠一樣。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "「三十秒」——三十秒即一輪生死輪迴！師兄是在超度這些妖獸啊！", emotion: "gloating" as const, effect: "gloating" as ComicEffect },
  { character: "narrator" as const, text: "趙小七拿出紙筆，開始瘋狂記錄。她的新日記標題已經想好了——《萬獸朝聖錄：林逸師兄超度妖獸全紀錄》。", emotion: "default" as const },
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
      <BackgroundLayer image="spirit-beast-cave.png" />

      {/* Blue-purple crystal glow — CS2 accent */}
      <div style={{
        position: "absolute", top: -80, right: -30,
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scene indicator */}
      <SceneIndicator text="靈獸洞窟·深處" color="#818CF8" />

      {/* Lin Yi — left */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {/* Zhao Xiaoqi — right (appears from line 1) */}
      {currentLineIndex >= 1 && (
        <CharacterSprite
          character="zhaoxiaoqi"
          emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "zhaoxiaoqi"}
          side="right"
          background={currentLine.character !== "zhaoxiaoqi"}
          effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
        />
      )}

      {/* Comic effects */}
      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
