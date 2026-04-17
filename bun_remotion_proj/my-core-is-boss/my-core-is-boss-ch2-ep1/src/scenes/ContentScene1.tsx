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

const SCENE_NAME = "ContentScene1";

const dialogLines = [
  { character: "narrator" as const, text: "大比結束後，林逸回到洞府，盤腿打坐。這是他第一次認真嘗試修煉。趙小七正好路過。", emotion: "default" as const },
  { character: "linyi" as const, text: "好，來試試這個世界的修煉是怎麼回事……等等，系統面板上怎麼多了一個按鈕？", emotion: "default" as const },
  { character: "linyi" as const, text: "「自動修煉腳本」？這什麼？", emotion: "shock" as const, effect: "sparkle" as ComicEffect },
  { character: "linyi" as const, text: "哦——打坐就等於掛機啊！那我不需要自己操作？", emotion: "smile" as const },
  { character: "linyi" as const, text: "按下去試試……嗯，靈力開始自動運轉了。太好了，本來就不想動。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "師兄！你剛才說「不想動」——這是「以不動應萬動」的境界嗎？！", emotion: "shock" as const },
  { character: "linyi" as const, text: "不是，我就是懶。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "師兄太謙虛了！您一定是在進入深層修煉狀態！我來替師兄守門，絕不讓任何人打擾！", emotion: "gloating" as const },
  { character: "linyi" as const, text: "隨便你，我先睡了。", emotion: "default" as const },
  { character: "narrator" as const, text: "林逸設定好自動修煉腳本，靈力開始以不可思議的速度自動運轉。然後——他躺下睡覺了。", emotion: "default" as const },
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
      <BackgroundLayer image="sect-training.png" />

      {/* Warm lamp glow */}
      <div style={{
        position: "absolute", top: -100, left: -50,
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scene indicator */}
      <SceneIndicator text="修煉場" color="#FBBF24" />

      {/* Lin Yi — left */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {/* Zhao Xiaoqi — right (appears from line 5) */}
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

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
