import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// normalizeEffects is already defined below — this is fine
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import { normalizeEffects, type ComicEffect, notoSansTC } from "../../../fixture/characters";

const dialogLines = [
  { character: "zhaoxiaoqi" as const, text: "我一定要記下來！《林逸師兄語錄》第一篇！", emotion: "gloating" as const, effect: "fire" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "「載入中」——師兄正在深度冥想，感悟天道運行之理。", emotion: "think" as const, effect: "sparkle" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "「跳過對話」——師兄認為言語道斷，大道不可言說。", emotion: "think" as const },
  { character: "zhaoxiaoqi" as const, text: "太深奧了……每一句話都蘊含著天地至理！", emotion: "cry" as const, effect: "cry" as ComicEffect },
  { character: "linyi" as const, text: "這也有 bug？我剛才明明點了跳過啊。", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "「這也有 bug」——師兄在質疑天道的運行！這是何等的氣魄！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "我趙小七，從今天起，就是林逸師兄的頭號追隨者！", emotion: "gloating" as const, effect: "gloating" as ComicEffect },
];

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}

export const ContentScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1,
  );
  const currentLine = dialogLines[currentLineIndex];

  // Scene indicator
  const indicatorOpacity = frame < 60
    ? interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-plaza.png" />

      {/* Scene indicator */}
      {indicatorOpacity > 0 && (
        <div style={{
          position: "absolute",
          top: 40,
          left: 60,
          opacity: indicatorOpacity,
          zIndex: 50,
          fontFamily: notoSansTC,
        }}>
          <div style={{ color: "#38BDF8", fontSize: 24, fontWeight: 700 }}>
            語錄誕生
          </div>
          <div style={{
            width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            height: 2,
            background: "linear-gradient(90deg, #38BDF8, transparent)",
            marginTop: 4,
          }} />
        </div>
      )}

      {/* Characters — zhaoxiaoqi is the main speaker here */}
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

      {/* Comic effects */}
      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={currentLine.character === "linyi" ? "left" : "right"}
      />

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
