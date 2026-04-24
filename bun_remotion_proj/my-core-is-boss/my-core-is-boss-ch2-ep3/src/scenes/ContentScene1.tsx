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
  { character: "narrator" as const, text: "修煉場的角落，林逸百無聊賴地盯著眼前的半透明面板。系統跳出一條他等了好久的通知。", emotion: "default" as const },
  { character: "linyi" as const, text: "「你已累積 52 技能點，請分配至天賦樹。」終於可以點技能了！", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "linyi" as const, text: "讓我看看……攻擊強化、防禦精通、靈力增幅……這些太費操作了，我懶得研究。", emotion: "default" as const },
  { character: "linyi" as const, text: "採集？就是撿東西吧。這個簡單，全點滿。辨識？自動看物品屬性？這個有用，也全點。跳躍？方便跑圖，滿上。", emotion: "smile" as const },
  { character: "narrator" as const, text: "林逸把五十二個技能點全砸在採集、辨識和跳躍上，攻擊和防禦一個都沒點。", emotion: "default" as const },
  { character: "narrator" as const, text: "系統面板閃過一道金光，彈出一條從沒見過的通知——「隱藏職業已解鎖：全能採集者。被動效果：所到之處，寸草不生。」", emotion: "default" as const },
  { character: "linyi" as const, text: "隱藏職業？聽起來還不錯。不過這被動效果的描述怎麼有點怪……算了，反正不用打架。", emotion: "confused" as const },
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

  const showHiddenClass = frame >= durationInFrames * 0.65 && frame <= durationInFrames * 0.85;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-training.png" />

      <div style={{
        position: "absolute", top: -50, left: "20%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="天道宗·修煉場" color="#F59E0B" />

      {showHiddenClass && (
        <SystemNotification
          text="隱藏職業已解鎖：全能採集者 — 所到之處，寸草不生"
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
