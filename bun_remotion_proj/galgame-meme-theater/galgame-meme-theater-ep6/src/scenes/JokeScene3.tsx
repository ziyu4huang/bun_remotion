import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import type { DialogLine } from "../../../fixture/characters";

// 梗：LINE聊天求生 (LINE chat survival)
const lines: DialogLine[] = [
  { character: "xiaoyue", text: "最煩那種已讀不回的人。", effect: "anger" },
  { character: "xiaoxue", text: "我更煩那種一直打「在嗎」的人。" },
  { character: "xiaoying", text: "在嗎。在嗎。在嗎。在嗎。" },
  { character: "xiaoyue", text: "妳再打一次在嗎我就 block 妳。", effect: "anger" },
  { character: "xiaoxue", text: "最可怕的是看到對方正在輸入..." },
  { character: "xiaoyue", text: "然後輸入了十分鐘。", effect: "dots" },
  { character: "xiaoxue", text: "最後只傳一個「哈」。", effect: "shock" },
  { character: "xiaoyue", text: "我建議LINE加一個功能，已讀不回超過二十四小時自動發出死亡通知。", effect: ["anger", "fire"] },
  { character: "xiaoying", text: "太殘忍了吧。", effect: "sweat" },
  { character: "xiaoyue", text: "不殘忍，這叫社會進步。", effect: "laugh" },
  { character: "xiaoxue", text: "還有那種聊天永遠用 sticker 回覆的人。" },
  { character: "xiaoyue", text: "對，你永遠不知道他到底是同意還是在敷衍你。" },
  { character: "xiaoying", text: "我全部都用貼圖回，因為打字好累。", effect: ["sweat", "dots"] },
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

  // Floating message bubble decorations
  const messageBubbles = [
    { text: "在嗎？", x: 8, y: 12, delay: 10 },
    { text: "哈", x: 75, y: 25, delay: 30 },
    { text: "已讀", x: 82, y: 15, delay: 50 },
    { text: "💬", x: 15, y: 35, delay: 70 },
  ];

  return (
    <AbsoluteFill>
      <BackgroundLayer image="gaming-setup.png" />

      {/* Neon indigo glow */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          right: "25%",
          width: 380,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(129, 140, 248, 0.12), transparent)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Floating message bubbles */}
      {messageBubbles.map((bubble, i) => {
        const localFrame = Math.max(0, frame - bubble.delay);
        const bubbleOpacity = interpolate(localFrame, [0, 15, 120, 135], [0, 0.3, 0.3, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const floatY = Math.sin(frame * 0.025 + i * 2) * 8;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              opacity: bubbleOpacity,
              transform: `translateY(${floatY}px)`,
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(129, 140, 248, 0.15)",
                border: "1px solid rgba(129, 140, 248, 0.3)",
                borderRadius: 16,
                padding: "6px 16px",
                color: "rgba(199, 210, 254, 0.7)",
                fontSize: 18,
                fontFamily: "sans-serif",
              }}
            >
              {bubble.text}
            </div>
          </div>
        );
      })}

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
          梗三：LINE聊天求生
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 180], {
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
