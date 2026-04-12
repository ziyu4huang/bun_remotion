import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

// 梗：氣象局不可信 (Weather Bureau can't be trusted)
const lines: DialogLine[] = [
  { character: "xiaoyue", text: "氣象局說今天降雨機率百分之十。" },
  { character: "xiaoxue", text: "那不會下雨，出門吧！" },
  { character: "xiaoying", text: "我還是帶把傘好了..." },
  { character: "xiaoxue", text: "不用不用！妳太擔心了！" },
  { character: "xiaoyue", text: "...果然。" },
  { character: "xiaoying", text: "幸虧我帶了傘...啊，我的傘被風吹壞了。" },
  { character: "xiaoxue", text: "怎麼辦，我們三個都沒帶傘..." },
  { character: "xiaoyue", text: "是『妳』說不會下雨的。" },
  { character: "xiaoxue", text: "好吧...便利商店有賣傘！" },
  { character: "xiaoying", text: "一個一百二...也太貴了吧？" },
  { character: "xiaoxue", text: "三個人都濕了，回家會被罵..." },
  { character: "xiaoyue", text: "永遠不要相信氣象局。" },
];

export const JokeScene3: React.FC = () => {
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

  // Rain effect — diagonal lines
  const raindrops = Array.from({ length: 30 }).map((_, i) => {
    const x = ((i * 67 + 23) % 100);
    const speed = 3 + (i % 4) * 1.5;
    const y = ((frame * speed + i * 43) % 120) - 10;
    const length = 15 + (i % 3) * 8;
    const opacity = 0.1 + (i % 3) * 0.05;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: 1,
          height: length,
          background: `linear-gradient(to bottom, transparent, rgba(150, 200, 255, ${opacity}))`,
          transform: "rotate(15deg)",
          pointerEvents: "none",
        }}
      />
    );
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #0a1a2e 0%, #1a2a3e 35%, #0f1a2e 65%, #050a15 100%)"
      />

      {/* Rain effect overlay */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {raindrops}
      </div>

      {/* Lightning flash (occasional) */}
      {Math.sin(frame * 0.02) > 0.98 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(200, 220, 255, 0.05)",
            pointerEvents: "none",
          }}
        />
      )}

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
            color: "#60A5FA",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          梗三：氣象局不可信
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #60A5FA, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
