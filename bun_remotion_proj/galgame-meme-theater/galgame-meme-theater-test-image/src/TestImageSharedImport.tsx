import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TitleScene } from "./scenes/TitleScene";
import { JokeScene1 } from "./scenes/JokeScene1";
import { OutroScene } from "./scenes/OutroScene";

export type Props = {
  sceneDurations: number[];
};

const DEFAULT_DURATION = 240; // 8s fallback

/**
 * Transition duration in frames (1s at 30fps).
 */
export const TRANSITION_FRAMES = 30;

export const TestImageSharedImport: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? DEFAULT_DURATION;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a051e" }}>
      <TransitionSeries>
        {/* Title Scene */}
        <TransitionSeries.Sequence durationInFrames={d(0)}>
          <TitleScene />
          <Audio src={staticFile("audio/01-title.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Title → Joke1: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Joke 1: Shared image import test */}
        <TransitionSeries.Sequence durationInFrames={d(1)}>
          <JokeScene1 />
          <Audio src={staticFile("audio/02-joke1.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Joke1 → Outro: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={d(2)}>
          <OutroScene />
          <Audio src={staticFile("audio/03-outro.wav")} volume={1} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
