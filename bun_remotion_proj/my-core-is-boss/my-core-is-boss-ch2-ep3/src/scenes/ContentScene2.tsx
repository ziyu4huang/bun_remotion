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

const SCENE_NAME = "ContentScene2";

const dialogLines = [
  { character: "narrator" as const, text: "林逸走出修煉場，路過宗門廣場的花圃。他隨腳踢了一下路邊的靈草，系統自動觸發了採集。", emotion: "default" as const },
  { character: "linyi" as const, text: "「採集成功：+10 靈草。品質：完美。」什麼？品質完美？我隨便踢一下就完美？", emotion: "shock" as const, effect: "surprise" as ComicEffect },
  { character: "linyi" as const, text: "再試試……「採集成功：千年雪蓮 ×1。品質：完美。」系統還附贈了年份鑑定——「三千年紫芝，煉丹頂級材料，市價五千靈石」。辨識MAX果然好用。", emotion: "smile" as const },
  { character: "narrator" as const, text: "趙小七恰好路過，看到林逸隨手從地上拔起一株靈草，靈草在他手中散發出完美的金色光暈。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "師、師兄？！您隨手摘的靈草……品質怎麼會是完美？！宗門藥圃的靈草，連長老親自採摘也只有上等而已！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "哦，就是採集技能。系統自動的，我也沒幹什麼。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "「系統自動」——師兄已經達到了「隨手皆是道」的境界！路邊野草在師兄手中化為頂級靈材！這是古籍中的「點石成金之術」！", emotion: "think" as const },
  { character: "linyi" as const, text: "不是，就是技能點滿了而已。採集MAX，辨識MAX，品質隨便都是完美。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "「採集MAX」——師兄說的是採集天道之精華至極！「辨識MAX」——洞悉萬物本源至圓滿！這兩項皆至巔峰，師兄已經超越了「採」的層次，而是「化」！", emotion: "gloating" as const, effect: "fire" as ComicEffect },
  { character: "narrator" as const, text: "趙小七翻開空白的一頁，奮筆疾書。新日記標題：《點石成金錄：林逸師兄隨手化腐朽為神奇全紀錄》。", emotion: "default" as const },
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

  const showCollect = frame >= durationInFrames * 0.15 && frame <= durationInFrames * 0.35;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-plaza.png" />

      <div style={{
        position: "absolute", top: -80, right: -30,
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="天道宗·廣場花圃" color="#34D399" />

      {showCollect && (
        <SystemNotification
          text="採集成功：千年雪蓮 ×1 — 品質：完美"
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

      {currentLineIndex >= 3 && (
        <CharacterSprite
          character="zhaoxiaoqi"
          emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "zhaoxiaoqi"}
          side="right"
          background={currentLine.character !== "zhaoxiaoqi"}
          effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
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
