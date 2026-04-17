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

const SCENE_NAME = "ContentScene3";

const dialogLines = [
  { character: "zhaoxiaoqi" as const, text: "三天！我在師兄洞府外守了三天三夜！", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "師兄臨入定前說了——「隨便你，我先睡了」。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "這是何等境界！「先睡」——指的是先讓肉身沉寂，讓元神獨自運轉天道！「隨便你」——是說凡間之事已不值得他操心！", emotion: "gloating" as const, effect: "sparkle" as ComicEffect },
  { character: "xiaoelder" as const, text: "老夫親眼所見……三天，他就從鍛體期到了金丹期……", emotion: "sweat" as const },
  { character: "zhaoxiaoqi" as const, text: "我的觀察日記已經超過十萬字了。標題是《林逸師兄閉關悟道全紀錄——論天道與呼吸的關係》。", emotion: "gloating" as const, effect: "fire" as ComicEffect },
  { character: "xiaoelder" as const, text: "十……十萬字？！", emotion: "shock" as const },
  { character: "zhaoxiaoqi" as const, text: "蕭長老，你剛才也看到了吧？師兄親口說「掛機三天，效率還行」。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "「效率」——師兄用一個詞就概括了修煉的本質！天道運轉，本就是最高效的法則！", emotion: "gloating" as const },
  { character: "xiaoelder" as const, text: "不可能！老夫修行三百年才到元嬰期！他三天就……", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "narrator" as const, text: "蕭長老臉色鐵青，渾身顫抖。當晚，他回到自己的洞府，翻出了修行三十年的功法筆記。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "老夫這三十年的功法……在林逸面前，不過是廢紙。", emotion: "cry" as const, effect: "cry" as ComicEffect },
  { character: "narrator" as const, text: "然後，他把功法燒了。", emotion: "default" as const },
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
      <BackgroundLayer image="sect-plaza.png" />

      {/* Golden radiance */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
        width: 800, height: 800,
        background: "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Scene indicator */}
      <SceneIndicator text="宗門廣場" color="#F472B6" />

      {/* Zhao Xiaoqi — right */}
      <CharacterSprite
        character="zhaoxiaoqi"
        emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "zhaoxiaoqi"}
        side="right"
        background={currentLine.character !== "zhaoxiaoqi"}
        effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
      />

      {/* Xiaoelder — left */}
      <CharacterSprite
        character="xiaoelder"
        emotion={currentLine.character === "xiaoelder" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "xiaoelder"}
        side="left"
        background={currentLine.character !== "xiaoelder"}
        effects={currentLine.character === "xiaoelder" ? normalizeEffects(currentLine.effect) : []}
      />

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
