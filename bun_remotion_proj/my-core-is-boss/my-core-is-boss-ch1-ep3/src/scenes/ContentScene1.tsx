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
  try { return require("../../public/audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene1";

const dialogLines = [
  { character: "narrator" as const, text: "宗門大比正式開始。擂台之上，弟子們各展所長，劍氣縱橫。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "林逸！第一場對手是你！上場！", emotion: "anger" as const },
  { character: "linyi" as const, text: "哦，來了。", emotion: "default" as const },
  { character: "narrator" as const, text: "林逸的對手是一位煉氣期九層的師兄，靈力外放，氣勢驚人。", emotion: "default" as const },
  { character: "linyi" as const, text: "這攻擊前搖也太長了吧……等等他在衝過來了！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "閃閃閃——！", emotion: "shock" as const, effect: "surprise" as ComicEffect, sfx: [{ text: "閃！", x: 500, y: 400, color: "#EF4444", rotation: -15, fontSize: 120, font: "action" as const }] as MangaSfxEvent[] },
  { character: "narrator" as const, text: "林逸慌忙後退，一腳踩進了比武台的角落——然後，穿過了牆壁。", emotion: "default" as const, sfx: [{ text: "穿牆！", x: 1100, y: 350, color: "#A78BFA", rotation: 10, fontSize: 100, font: "brush" as const }] as MangaSfxEvent[] },
  { character: "linyi" as const, text: "……我怎麼卡進來了？", emotion: "confused" as const, effect: "dots" as ComicEffect },
  { character: "linyi" as const, text: "等等，這個碰撞體有問題！牆壁的判定有縫隙！", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "linyi" as const, text: "咦，對手也追過來了……他也卡住了？", emotion: "confused" as const },
  { character: "linyi" as const, text: "哦——NPC 的尋路邏輯有缺陷，碰到邊界就會卡住不動。這不就是經典的「卡牆 Bug」嗎？", emotion: "smile" as const, effect: "gloating" as ComicEffect },
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

  return (
    <AbsoluteFill>
      <BackgroundLayer image="tournament-stage.png" />

      {/* Scene indicator */}
      <SceneIndicator text="宗門大比" color="#EF4444" />

      {/* Characters */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {currentLineIndex >= 1 && currentLine.character === "xiaoelder" && (
        <CharacterSprite
          character="xiaoelder"
          emotion={currentLine.character === "xiaoelder" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "xiaoelder"}
          side="right"
          background={currentLine.character !== "xiaoelder"}
          effects={currentLine.character === "xiaoelder" ? normalizeEffects(currentLine.effect) : []}
        />
      )}

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
