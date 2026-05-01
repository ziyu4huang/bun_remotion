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
  { character: "narrator" as const, text: "噬天蛟怒吼一聲，張開巨口朝林逸衝來。三千年的沉睡讓它積累了無盡的怒意，而眼前這個渺小的人類居然敢主動挑釁。它發誓要把這個蟲子撕碎。", emotion: "default" as const },
  { character: "narrator" as const, text: "然而，當噬天蛟龐大的身軀繞過第一根石柱時，它的路徑計算出現了……問題。巨大的蛟龍身體卡在了石柱和競技場牆壁之間，進退不得。它掙扎著，但越掙扎卡得越緊。", emotion: "default" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "看到了吧？路徑尋找算法沒有處理大體型碰撞體，柱子和牆壁之間的空間不夠它轉身。經典 AI bug。我這個動作叫仇恨繞柱。", emotion: "smile" as const },
  { character: "zhaoxiaoqi" as const, text: "師兄！這招叫什麼？！上古兇獸被幾根石柱困住了！這是什麼陣法？！", emotion: "shock" as const },
  { character: "linyi" as const, text: "不叫陣法，叫繞柱。就是拉著 Boss 的仇恨值繞柱子跑，它的路徑計算會出錯。在遊戲裡……呃，在任何戰鬥裡都一樣。", emotion: "smile" as const },
  { character: "narrator" as const, text: "趙小七的筆記本再次翻開，筆走如龍：「林逸師兄以天地間之石柱為陣眼，不需佈陣，不需法力，僅憑跑位便困住上古兇獸。以天地為陣，困萬古兇獸於方寸之間。此乃何等境界！」", emotion: "default" as const },
  { character: "narrator" as const, text: "噬天蛟用盡全力終於掙脫了第一根柱子。它怒不可遏，再次朝林逸衝去。林逸淡定地換了一根柱子繼續繞。果然，噬天蛟又卡住了。這次卡得更深了——半個身體都嵌進了地板和柱子的夾角裡。", emotion: "default" as const, effect: "sweat" as ComicEffect },
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
      <BackgroundLayer image="boss-arena.png" />

      <div style={{
        position: "absolute", top: -50, left: "30%",
        width: 800, height: 800,
        background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="Boss 競技場·仇恨繞柱中" color="#F97316" />

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
