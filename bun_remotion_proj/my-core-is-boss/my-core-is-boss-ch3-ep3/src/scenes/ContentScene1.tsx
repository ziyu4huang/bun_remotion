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

// TODO: Fill in dialog lines for ContentScene1 (content scene 1)
// TODO: Choose background from assets/backgrounds/
const dialogLines = [
  { character: "narrator" as const, text: "TODO: 場景 1 的旁白或對話", emotion: "default" as const },
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

  // Derive side from CHARACTERS config
  const side = CHARACTERS[currentLine.character]?.position === "right" ? "right" : "left";

  return (
    <AbsoluteFill>
      {/* TODO: Change background image */}
      <BackgroundLayer image="sect-plaza.png" />

      {/* Scene indicator */}
      <SceneIndicator text="場景 1" color="#EF4444" />

      {/* Characters — adjust based on who appears in this scene */}
      <CharacterSprite
        character={currentLine.character}
        emotion={currentLine.emotion ?? "default"}
        speaking={true}
        side={side}
        background={false}
        effects={normalizeEffects(currentLine.effect)}
      />

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Comic effects — add effect field to dialogLines for reactions */}
      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />
    </AbsoluteFill>
  );
};
