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
  { character: "zhaoxiaoqi" as const, text: "我看到了！師兄根本不需要出手！他只需站在那裡，對手就被「空間禁錮」了！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "xiaoelder" as const, text: "空……空間禁錮？", emotion: "shock" as const, effect: "surprise" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "這一定是上古失傳的「空間禁錮之術」！以自身氣場扭曲周圍空間，將敵人封鎖在特定區域無法動彈！", emotion: "gloating" as const, effect: "fire" as ComicEffect },
  { character: "xiaoelder" as const, text: "那不是傳說中渡劫期以上才能施展的禁術嗎……？", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "蕭長老你看！師兄連續用了好幾次，每次位置都不同！說明他能精確控制空間扭曲的座標！", emotion: "gloating" as const, sfx: [{ text: "座標控制！", x: 960, y: 380, color: "#38BDF8", rotation: -8, fontSize: 100, font: "brush" as const }] as MangaSfxEvent[] },
  { character: "xiaoelder" as const, text: "（偷偷拿出筆記本）「卡……卡模型……」不對，這名字太俗了……「空間禁錮……以氣場扭曲空間……需找到特定的節點……」", emotion: "sweat" as const, effect: "dots" as ComicEffect },
  { character: "linyi" as const, text: "什麼節點？我就是看哪裡有縫隙而已。", emotion: "default" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "師兄說的「縫隙」就是空間的裂縫！他能直接看到空間結構的弱點！", emotion: "gloating" as const, effect: "sparkle" as ComicEffect },
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
      <BackgroundLayer image="tournament-stage.png" />

      {/* Scene indicator */}
      <SceneIndicator text="腦補升級" color="#A78BFA" />

      {/* Characters — all three visible */}
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

      {/* Xiaoelder appears when he speaks (line 1, 3, 5) */}
      {(currentLineIndex === 1 || currentLineIndex === 3 || currentLineIndex === 5 || currentLineIndex >= 6) && (
        <CharacterSprite
          character="xiaoelder"
          emotion={currentLine.character === "xiaoelder" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "xiaoelder"}
          side="center"
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
