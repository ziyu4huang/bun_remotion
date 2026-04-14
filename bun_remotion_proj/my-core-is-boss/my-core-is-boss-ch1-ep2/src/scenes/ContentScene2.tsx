import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import { MangaSfx } from "../../../fixture/components/MangaSfx";
import { normalizeEffects, CHARACTERS, type ComicEffect, type MangaSfxEvent } from "../../../fixture/characters";
import { SystemNotification } from "../../../fixture/components/SystemOverlay";
import { SceneIndicator } from "../../../fixture/components/SceneIndicator";
import { getLineIndex } from "../../../fixture/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../public/audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene2";

const dialogLines = [
  { character: "narrator" as const, text: "靈獸洞窟外。數十頭妖獸盤踞其中，其他弟子小心翼翼地潛入。而林逸……大搖大擺地走了過去。", emotion: "default" as const },
  { character: "linyi" as const, text: "自動尋路啟動……繞過怪物……直走……左轉……到了。", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "linyi" as const, text: "寶箱……打開。靈石到手，經驗值到手。三秒通關。", emotion: "laugh" as const, effect: "laugh" as ComicEffect, sfx: [{ text: "叮！", x: 1200, y: 400, color: "#F59E0B", rotation: -15, fontSize: 100, font: "brush" as const }] as MangaSfxEvent[] },
  { character: "narrator" as const, text: "妖獸們看著林逸就這麼走過去，集體一臉茫然。", emotion: "default" as const, sfx: [{ text: "？", x: 400, y: 300, color: "#94A3B8", rotation: 20, fontSize: 140, font: "playful" as const }, { text: "？！", x: 900, y: 350, color: "#94A3B8", rotation: -10, fontSize: 120, font: "playful" as const }] as MangaSfxEvent[] },
  { character: "linyi" as const, text: "那些人還在前面打怪呢。算了，先去吃飯。", emotion: "default" as const, effect: "dots" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "師、師兄？！你已經回來了？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "啊，任務做完了。寶箱裡的東西還不錯。", emotion: "smile" as const },
  { character: "zhaoxiaoqi" as const, text: "可是……妖獸都還在啊！你怎麼通過的？", emotion: "shock" as const, effect: "surprise" as ComicEffect },
  { character: "linyi" as const, text: "嗯？就走過去了啊。牠們沒攔我。", emotion: "default" as const, effect: "sweat" as ComicEffect },
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

  // Reward notification at line 2
  const rewardFrame = Math.round(
    ((segmentDurations[SCENE_NAME]?.slice(0, 2).reduce((a, b) => a + b, 0) ?? 0) /
      (segmentDurations[SCENE_NAME]?.reduce((a, b) => a + b, 0) ?? 1)) *
      durationInFrames,
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="spirit-beast-cave.png" />

      {/* Scene indicator */}
      <SceneIndicator text="靈獸洞窟" color="#10B981" />

      {/* Characters */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {currentLineIndex >= 5 && (
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

      {/* Manga SFX */}
      <MangaSfx events={currentLine.sfx ?? []} />

      {/* Reward notification */}
      {currentLineIndex >= 2 && currentLineIndex <= 3 && (
        <SystemNotification
          text="獎勵已領取：靈石 ×100，經驗值 +500"
          type="success"
          delay={Math.floor(rewardFrame)}
        />
      )}

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
