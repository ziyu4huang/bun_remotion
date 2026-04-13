import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import type { DialogLine } from "../../../fixture/characters";

// 梗：催婚大作戰 (Marriage pressure battle)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "過年回家，親戚第一句話就是「有沒有男朋友」。", effect: "sweat" },
  { character: "xiaoyue", text: "我媽更直接，「妳是不是喜歡女生」。", effect: "shock" },
  { character: "xiaoying", text: "我阿嬤說再不嫁人就要幫我去算命。" },
  { character: "xiaoxue", text: "算命師說我姻緣遲，要到二十八歲才會遇到。" },
  { character: "xiaoyue", text: "那是算命還是拖延症。", effect: "laugh" },
  { character: "xiaoxue", text: "親戚介紹一個男生給我，說條件很好。" },
  { character: "xiaoyue", text: "什麼條件？" },
  { character: "xiaoxue", text: "有房有車，月薪十萬。" },
  { character: "xiaoying", text: "那很好啊。", effect: "sparkle" },
  { character: "xiaoxue", text: "今年六十二歲。", effect: "shock" },
  { character: "xiaoyue", text: "妳親戚的定義跟一般人不太一樣。", effect: "laugh" },
  { character: "xiaoying", text: "我爸說只要妳帶回來是人類就好。" },
  { character: "xiaoxue", text: "這標準也太低了吧。", effect: "sweat" },
  { character: "xiaoyue", text: "不，這已經是很多家長的最高標準了。", effect: ["dots", "cry"] },
];

export const JokeScene4: React.FC = () => {
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

  // Dawn light effect
  const dawnGlow = interpolate(
    Math.sin(frame * 0.02),
    [-1, 1],
    [0.08, 0.18]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer image="bedroom-dawn.png" />

      {/* Warm dawn light from window */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          right: "15%",
          width: 450,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(251, 146, 60, ${dawnGlow}), transparent)`,
          filter: "blur(50px)",
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
            color: "#FB923C",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗四：催婚大作戰
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 180], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #FB923C, transparent)",
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
