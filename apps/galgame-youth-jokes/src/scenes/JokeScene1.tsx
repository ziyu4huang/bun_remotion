import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import type { DialogLine } from "../characters";

const lines: DialogLine[] = [
  { character: "teacher", text: "小明，用『果然』造句。" },
  { character: "xiaoming", text: "我先吃水果，然後喝果汁。" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );

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

      {/* Teacher sprite - visible when speaking */}
      {currentLineIndex === 0 && (
        <Sequence from={0} durationInFrames={durationInFrames / 2}>
          <CharacterSprite
            character="teacher"
            image="teacher.png"
            speaking
            side="right"
          />
        </Sequence>
      )}

      {/* Xiao Ming sprite - visible when speaking */}
      {currentLineIndex === 1 && (
        <Sequence from={0} durationInFrames={durationInFrames}>
          <CharacterSprite
            character="xiaoming"
            image="xiaoming.png"
            speaking
            side="left"
          />
        </Sequence>
      )}

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
        }}
      >
        笑話一
      </div>
    </AbsoluteFill>
  );
};
