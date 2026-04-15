import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { MangaSfx } from "../../../assets/components/MangaSfx";
import { normalizeEffects, CHARACTERS, type ComicEffect, type MangaSfxEvent } from "../../../assets/characters";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { HpBar, LevelTag } from "../../../assets/components/GameUI";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../public/audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene2";

const dialogLines = [
  { character: "narrator" as const, text: "林逸發現，只要把對手引到比武台的邊界縫隙，他們就會被卡住，無法移動，無法出招。", emotion: "default" as const },
  { character: "linyi" as const, text: "好，下一個。來來來，跟我到這裡來。", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "linyi" as const, text: "再過來一點……好，卡住了。", emotion: "laugh" as const, effect: "gloating" as ComicEffect, sfx: [{ text: "卡！", x: 1100, y: 380, color: "#EF4444", rotation: -10, fontSize: 130, font: "action" as const }] as MangaSfxEvent[] },
  { character: "narrator" as const, text: "第二位對手被卡在了比武台邊緣，掙扎不已。", emotion: "default" as const },
  { character: "linyi" as const, text: "第三個……這個精一點，不肯靠牆。", emotion: "confused" as const, effect: "dots" as ComicEffect },
  { character: "linyi" as const, text: "沒關係，右邊還有個縫隙。繞一下……好，也卡住了。", emotion: "smile" as const, effect: "gloating" as ComicEffect },
  { character: "xiaoelder" as const, text: "這……這怎麼可能！他連手都沒抬！對手怎麼全動不了了！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "碰撞判定失效，他們現在是無敵狀態但也動不了。不過 HP 歸零判定還在……慢慢磨就行了。", emotion: "default" as const },
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
      <BackgroundLayer image="tournament-stage.png" />

      {/* Scene indicator */}
      <SceneIndicator text="連勝" color="#EF4444" />

      {/* Characters */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {currentLineIndex >= 6 && (
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

      {/* Battle UI — HP bar for opponent */}
      {currentLineIndex >= 2 && currentLineIndex <= 5 && (
        <HpBar name="對手" level={9} hp={85} maxHp={100} color="#EF4444" x={1300} y={120} delay={0} />
      )}
      {currentLineIndex >= 5 && currentLineIndex <= 7 && (
        <HpBar name="對手3" level={11} hp={92} maxHp={100} color="#F59E0B" x={1300} y={200} delay={10} />
      )}

      {/* Level tag floating above opponent */}
      {currentLineIndex >= 1 && currentLineIndex <= 3 && (
        <LevelTag level="煉氣九層" color="#EF4444" x={1400} y={260} delay={5} />
      )}

      {/* Victory notification */}
      {currentLineIndex >= 7 && (
        <SystemNotification
          text="比武勝利：對手 HP 歸零判定觸發"
          type="success"
          delay={0}
        />
      )}

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
