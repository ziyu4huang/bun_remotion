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

      {/* Xiao Mei on the right */}
      <CharacterSprite
        character="xiaomei"
        image="xiaomei.png"
        speaking={currentLine.character === "xiaomei"}
        side="right"
        background={currentLine.character !== "xiaomei"}
      />

      {/* Xiao Ming on the left */}
      <CharacterSprite
        character="xiaoming"
        image="xiaoming.png"
        speaking={currentLine.character === "xiaoming"}
        side="left"
        background={currentLine.character !== "xiaoming"}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Joke number */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          color: "rgba(192, 132, 252, 0.5)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "sans-serif",
          zIndex: 50,
        }}
      >
        笑話四
      </div>
    </AbsoluteFill>
  );
};
