import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { DialogBox } from "../../../assets/components/DialogBox";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import type { DialogLine } from "../../../assets/characters";

// 梗：開會廢話大全 (Meeting nonsense collection)
const lines: DialogLine[] = [
  { character: "xiaoyue", text: "今天的會議主題是討論下次開會的時間。" },
  { character: "xiaoxue", text: "這種會議為什麼不能在通訊軟體上說？", effect: "anger" },
  { character: "xiaoyue", text: "因為那樣就沒有會議費可以報了。", effect: "laugh" },
  { character: "xiaoying", text: "我最怕會議上有人說，我再補充一點。" },
  { character: "xiaoxue", text: "然後他補充了三十分鐘。", effect: "sweat" },
  { character: "xiaoyue", text: "還有那種會議結束前說，最後我說一句。" },
  { character: "xiaoxue", text: "最後一句說了五句。", effect: "shock" },
  { character: "xiaoying", text: "我建議會議室裝計時器，超時直接斷電。", effect: "sparkle" },
  { character: "xiaoyue", text: "妳會被開除的。" },
  { character: "xiaoying", text: "那就不用開會了，雙贏。", effect: ["laugh", "shake"] },
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

  // Meeting room clock tick
  const clockPulse = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.04, 0.08]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="school-corridor.png" />

      {/* Meeting room fluorescent light */}
      <div
        style={{
          position: "absolute",
          top: "3%",
          left: "30%",
          width: 300,
          height: 6,
          borderRadius: 3,
          background: `rgba(148, 163, 184, ${clockPulse})`,
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />

      {/* Timer countdown indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 60,
          opacity: indicatorOpacity,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#EF4444",
            boxShadow: `0 0 10px rgba(239, 68, 68, ${clockPulse * 3})`,
          }}
        />
        <div
          style={{
            color: "#94A3B8",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          REC 00:{String(Math.floor(frame / 30)).padStart(2, "0")}
        </div>
      </div>

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
            color: "#818CF8",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗三：開會廢話大全
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 220], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #818CF8, transparent)",
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
