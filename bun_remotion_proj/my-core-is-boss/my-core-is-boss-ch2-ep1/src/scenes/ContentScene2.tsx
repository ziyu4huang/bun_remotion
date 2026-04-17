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
  { character: "narrator" as const, text: "三天後。", emotion: "default" as const },
  { character: "linyi" as const, text: "睡得真舒服……嗯？系統通知？", emotion: "default" as const },
  { character: "linyi" as const, text: "「恭喜升級！當前等級：Lv.52」……什麼？！我睡一覺升了五十級？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "xiaoelder" as const, text: "林逸！老夫來看看你的修煉進——", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "這……這股靈壓！你、你突破了金丹期？！", emotion: "shock" as const },
  { character: "linyi" as const, text: "哦，蕭長老。對啊，掛機三天就升了五十級。效率還行吧。", emotion: "smile" as const, effect: "laugh" as ComicEffect },
  { character: "xiaoelder" as const, text: "掛……掛機三天……升了……五十……級……？！", emotion: "sweat" as const },
  { character: "linyi" as const, text: "對啊，照這個速度，我睡個幾個月不就全服第一了嗎？", emotion: "smile" as const },
  { character: "xiaoelder" as const, text: "全……全服……？！", emotion: "sweat" as const },
  { character: "narrator" as const, text: "蕭長老雙腿發軟，扶著門框勉強站穩。林逸並不知道，這個「隱藏加成」的數值，已經超越了大陸所有修行者的總和。", emotion: "default" as const },
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
      <BackgroundLayer image="sect-interior.png" />

      {/* Night monitor glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 700, height: 500,
        background: "radial-gradient(ellipse, rgba(96,165,250,0.15) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Scene indicator */}
      <SceneIndicator text="洞府" color="#60A5FA" />

      {/* Lin Yi — left */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {/* Xiaoelder — right (appears from line 3) */}
      {currentLineIndex >= 3 && (
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

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
