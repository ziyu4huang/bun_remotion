import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import type { DialogLine } from "../../../fixture/characters";

// 梗：捷運社交距離大師 (MRT social distance master)
const lines: DialogLine[] = [
  { character: "xiaoyue", text: "搭捷運最重要的技能是什麼？" },
  { character: "xiaoxue", text: "找位置！" },
  { character: "xiaoying", text: "假裝睡覺。", effect: "sparkle" },
  { character: "xiaoyue", text: "正確。假裝睡覺可以解決一切。" },
  { character: "xiaoxue", text: "有人在看我怎麼辦？", effect: "sweat" },
  { character: "xiaoyue", text: "拿出手機，假裝在回重要訊息。" },
  { character: "xiaoying", text: "但妳明明沒有訊息啊..." },
  { character: "xiaoxue", text: "所以我打開天氣預報..." },
  { character: "xiaoyue", text: "...看天氣預報能看十分鐘？", effect: "surprise" },
  { character: "xiaoxue", text: "我還順便看了明天的、後天的、一週後的。", effect: "sweat" },
  { character: "xiaoying", text: "捷運上最遠的距離，是站在你旁邊，你卻假裝看不到我讓座。", effect: "dots" },
  { character: "xiaoyue", text: "還有，上捷運前先查有沒有座位。有座位才上車。" },
  { character: "xiaoxue", text: "妳那不叫搭捷運，妳那叫蹲點。", effect: ["fire", "shake"] },
];

export const JokeScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // MRT indicator light pulse
  const mrtPulse = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.04, 0.1]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="school-corridor.png" />

      {/* MRT blue/white indicator lights */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "40%",
          width: 250,
          height: 8,
          borderRadius: 4,
          background: `rgba(6, 214, 160, ${mrtPulse})`,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          right: "10%",
          width: 150,
          height: 6,
          borderRadius: 3,
          background: `rgba(6, 182, 212, ${mrtPulse * 0.8})`,
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />

      <CharacterSprite
        character="xiaoxue"
        image="xiaoxue.png"
        speaking={currentLine.character === "xiaoxue"}
        side="left"
        background={currentLine.character !== "xiaoxue"}
        effects={currentLine.character === "xiaoxue" ? currentEffects : []}
      />
      <CharacterSprite
        character="xiaoyue"
        image="xiaoyue.png"
        speaking={currentLine.character === "xiaoyue"}
        side="right"
        background={currentLine.character !== "xiaoyue"}
        effects={currentLine.character === "xiaoyue" ? currentEffects : []}
      />
      <CharacterSprite
        character="xiaoying"
        image="xiaoying.png"
        speaking={currentLine.character === "xiaoying"}
        side="center"
        background={currentLine.character !== "xiaoying"}
        effects={currentLine.character === "xiaoying" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiaoxue" ? "left" : currentLine.character === "xiaoyue" ? "right" : "center"}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene title indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          opacity: indicatorOpacity,
          zIndex: 50,
        }}
      >
        <div
          style={{
            color: "#06B6D4",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗三：捷運社交距離大師
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 220], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #06B6D4, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: string | string[]): string[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}
