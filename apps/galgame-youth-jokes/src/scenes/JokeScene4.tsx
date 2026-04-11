import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

const lines: DialogLine[] = [
  { character: "xiaomei", text: "期末考你準備好了嗎？" },
  { character: "xiaoming", text: "準備好了啊！" },
  { character: "xiaomei", text: "真的？" },
  { character: "xiaoming", text: "對，我準備好要補考了。" },
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
      <BackgroundLayer image="classroom.png" />

      <CharacterSprite
        character={currentLine.character}
        image={`${currentLine.character}.png`}
        speaking
        side={currentLine.character === "xiaoming" ? "left" : "right"}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          color: "rgba(192, 132, 252, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        笑話四
      </div>
    </AbsoluteFill>
  );
};
