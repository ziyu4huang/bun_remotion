import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "../../../assets/characters";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../public/audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene1";

const dialogLines = [
  { character: "narrator" as const, text: "宗門廣場上，任務榜高懸。數十名弟子摩拳擦掌，法器丹藥準備齊全。", emotion: "default" as const },
  { character: "linyi" as const, text: "清剿妖獸……難度普通……獎勵靈石一百……", emotion: "default" as const, effect: "dots" as ComicEffect },
  { character: "linyi" as const, text: "等等，這個「跳過」按鈕是什麼？", emotion: "confused" as const, effect: "surprise" as ComicEffect },
  { character: "linyi" as const, text: "「跳過過場動畫，直接領取獎勵」？還有這種好事？點一下試試。", emotion: "smile" as const, effect: "sparkle" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "師兄！你不去準備裝備嗎？大家都帶好了法器和丹藥！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "linyi" as const, text: "不用不用，我找到了一條捷徑。", emotion: "smile" as const, effect: "gloating" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "捷徑？！師兄是說……修行也有捷徑可走？", emotion: "think" as const, effect: "sparkle" as ComicEffect },
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

  // System notification when linyi finds skip button (line 2-3)
  const skipButtonFrame = Math.round(
    ((segmentDurations[SCENE_NAME]?.slice(0, 2).reduce((a, b) => a + b, 0) ?? 0) /
      (segmentDurations[SCENE_NAME]?.reduce((a, b) => a + b, 0) ?? 1)) *
      durationInFrames,
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-plaza.png" />

      {/* Scene indicator */}
      <SceneIndicator text="任務發布" color="#F59E0B" />

      {/* Characters */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {currentLineIndex >= 4 && (
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

      {/* Quest panel notification */}
      {currentLineIndex >= 2 && currentLineIndex <= 4 && (
        <SystemNotification
          text="任務：清剿妖獸（普通）— [跳過] 按鈕已解鎖"
          type="mission"
          delay={Math.floor(skipButtonFrame)}
        />
      )}

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
