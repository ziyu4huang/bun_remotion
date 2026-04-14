import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { DialogBox } from "../../../assets/components/DialogBox";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import type { DialogLine } from "../../../assets/characters";

// 梗：LINE群組已讀不回 (LINE group — read but no reply)
const lines: DialogLine[] = [
  { character: "xiaoxue", text: "群組裡發了訊息，為什麼都沒人回？" },
  { character: "xiaoyue", text: "因為大家都在，只是選擇不回。" },
  { character: "xiaoying", text: "我不是不回，我是在想怎麼回..." },
  { character: "xiaoxue", text: "『在想怎麼回』等於不回。" },
  { character: "xiaoyue", text: "已讀不回是現代人最基本的社交技能。" },
  { character: "xiaoying", text: "可是...已讀不回會不會不太好？" },
  { character: "xiaoxue", text: "更可怕的是：對方傳貼圖，妳回貼圖，然後對話就結束了。" },
  { character: "xiaoyue", text: "這就是所謂的『貼圖對話』，一來一回就結束。" },
  { character: "xiaoying", text: "啊...我剛才已讀了群組，忘記回了..." },
  { character: "xiaoxue", text: "沒關係，反正沒有人在等。" },
  { character: "xiaoyue", text: "...妳們兩個不也沒回我昨天的訊息？" },
];

export const JokeScene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phone screen glow effect
  const phoneGlow = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [0.06, 0.12]
  );

  return (
    <AbsoluteFill>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #0a0a1e 0%, #1a0a2e 35%, #0f1a20 65%, #050a0f 100%)"
      />

      {/* LINE green accent glow — phone screen effect */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "45%",
          width: 120,
          height: 200,
          borderRadius: 16,
          background: `rgba(6, 214, 160, ${phoneGlow})`,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle LINE notification dots */}
      {Array.from({ length: 5 }).map((_, i) => {
        const dotOpacity = interpolate(
          frame,
          [i * 20 + 10, i * 20 + 15, i * 20 + 25, i * 20 + 30],
          [0, 0.6, 0.6, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${25 + i * 8}%`,
              right: `${20 + i * 3}%`,
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#06D6A0",
              opacity: dotOpacity,
              pointerEvents: "none",
            }}
          />
        );
      })}

      <CharacterSprite
        character="xiaoxue"
        image="xiaoxue.png"
        speaking={currentLine.character === "xiaoxue"}
        side="left"
        background={currentLine.character !== "xiaoxue"}
      />
      <CharacterSprite
        character="xiaoyue"
        image="xiaoyue.png"
        speaking={currentLine.character === "xiaoyue"}
        side="right"
        background={currentLine.character !== "xiaoyue"}
      />
      <CharacterSprite
        character="xiaoying"
        image="xiaoying.png"
        speaking={currentLine.character === "xiaoying"}
        side="center"
        background={currentLine.character !== "xiaoying"}
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
            color: "#06D6A0",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗四：LINE群組已讀不回
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #06D6A0, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
