import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { MangaSfx } from "../../../assets/components/MangaSfx";
import { normalizeEffects, CHARACTERS, type ComicEffect, type MangaSfxEvent } from "../../../assets/characters";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene3";

const dialogLines = [
  { character: "zhaoxiaoqi" as const, text: "我明白了！師兄根本不需要打敗妖獸！他以大乘期的修為，直接無視了妖獸的存在！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "「走過去」——師兄的意思是，這些妖獸根本不值一提，就像路邊的石頭一樣！", emotion: "think" as const },
  { character: "zhaoxiaoqi" as const, text: "「三秒通關」——師兄用三秒完成了我們需要三天的任務！這是何等境界！", emotion: "gloating" as const, effect: "fire" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "我要更新《林逸師兄語錄》！第二篇：「跳過」——真正的強者，不需要出手！", emotion: "gloating" as const, effect: "gloating" as ComicEffect, sfx: [{ text: "超越！", x: 960, y: 350, color: "#38BDF8", rotation: -5, fontSize: 120, font: "brush" as const }] as MangaSfxEvent[] },
  { character: "linyi" as const, text: "不是，我只是用了系統的跳過功能……", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "師兄又在謙虛了！「跳過」的真諦就是——超越！超越一切障礙！", emotion: "gloating" as const },
  { character: "linyi" as const, text: "……算了，你高興就好。", emotion: "sweat" as const, effect: "dots" as ComicEffect },
];

export const ContentScene3: React.FC = () => {
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
      <BackgroundLayer image="mysterious-forest.png" />

      {/* Scene indicator */}
      <SceneIndicator text="腦補升級" color="#38BDF8" />

      {/* Characters */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      <CharacterSprite
        character="zhaoxiaoqi"
        emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "zhaoxiaoqi"}
        side="right"
        background={currentLine.character !== "zhaoxiaoqi"}
        effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
      />

      {/* Comic effects */}
      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      {/* Manga SFX */}
      <MangaSfx events={currentLine.sfx ?? []} />

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
