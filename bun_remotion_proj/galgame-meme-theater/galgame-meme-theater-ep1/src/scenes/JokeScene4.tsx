import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import type { DialogLine } from "../../../fixture/characters";

// 梗：社死名場面 (Social death moments)
const lines: DialogLine[] = [
  { character: "xiaoying", text: "老師好！" },
  { character: "xiaoxue", text: "小樱...那不是老師，是隔壁班的帥哥。" },
  { character: "xiaoying", text: "啊啊啊啊！對不起！！！" },
  { character: "xiaoyue", text: "順便一提，整棟樓都聽到了。" },
  { character: "xiaoying", text: "我想轉學...我想消失...把我埋了吧..." },
  { character: "xiaoxue", text: "別這樣嘛，至少他笑了，說妳很可愛。" },
  { character: "xiaoying", text: "什麼？！真的嗎？！" },
  { character: "xiaoyue", text: "我騙妳的。" },
  { character: "xiaoying", text: "小月！！！妳給我站住！！！" },
];

export const JokeScene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];

  // Scene fade in/out
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <BackgroundLayer
        image="school-gate.png"
        gradient="linear-gradient(135deg, #1a0a2e 0%, #2d1b3e 50%, #0f1b3e 100%)"
      />

      {/* 小雪 on the left */}
      <CharacterSprite
        character="xiaoxue"
        image="xiaoxue.png"
        speaking={currentLine.character === "xiaoxue"}
        side="left"
        background={currentLine.character !== "xiaoxue"}
      />

      {/* 小月 on the right */}
      <CharacterSprite
        character="xiaoyue"
        image="xiaoyue.png"
        speaking={currentLine.character === "xiaoyue"}
        side="right"
        background={currentLine.character !== "xiaoyue"}
      />

      {/* 小樱 in center */}
      <CharacterSprite
        character="xiaoying"
        image="xiaoying.png"
        speaking={currentLine.character === "xiaoying"}
        side="center"
        background={currentLine.character !== "xiaoying"}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Joke title */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          color: "rgba(244, 114, 182, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        梗四：社死名場面
      </div>
    </AbsoluteFill>
  );
};
