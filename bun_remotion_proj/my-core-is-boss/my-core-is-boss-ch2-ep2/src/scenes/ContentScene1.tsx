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
  { character: "narrator" as const, text: "林逸接到了系統新任務——清剿靈獸洞窟妖獸。他第一次走進洞窟，立刻注意到一件事。", emotion: "default" as const },
  { character: "linyi" as const, text: "這個洞穴的怪物……刷新點是固定的？", emotion: "default" as const },
  { character: "linyi" as const, text: "入口左邊第三個岔路，一隻藍色妖狼，打死之後三十秒重生。這不就是經典的定點刷怪嗎？", emotion: "smile" as const },
  { character: "linyi" as const, text: "太好了，找個定點站好，掛機刷經驗。效率比洞府裡打坐快多了。", emotion: "default" as const },
  { character: "linyi" as const, text: "誒，系統還有個「經驗值倍率」顯示？「連續擊殺加成 ×1.5」——這遊戲居然有連殺獎勵！", emotion: "shock" as const, effect: "sparkle" as ComicEffect },
  { character: "narrator" as const, text: "林逸找了一個怪物密集的十字路口，站定不動。妖獸們一隻接一隻撲過來，被系統基礎面板的隱藏加成一擊秒殺。經驗值開始以驚人的速度累積。", emotion: "default" as const },
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

  // System notification: kill streak multiplier
  const showMultiplier = frame >= durationInFrames * 0.6 && frame <= durationInFrames * 0.85;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="spirit-beast-cave.png" />

      {/* Green cavern glow — CS1 accent */}
      <div style={{
        position: "absolute", top: -50, left: "30%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scene indicator */}
      <SceneIndicator text="靈獸洞窟" color="#34D399" />

      {/* System: kill streak notification */}
      {showMultiplier && (
        <SystemNotification
          text="連續擊殺加成 ×1.5"
          type="success"
          delay={0}
        />
      )}

      {/* Lin Yi — left */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
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
