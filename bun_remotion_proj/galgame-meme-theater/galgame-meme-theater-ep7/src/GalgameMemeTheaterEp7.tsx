import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { flip } from "@remotion/transitions/flip";
import { TitleScene } from "./scenes/TitleScene";
import { JokeScene1 } from "./scenes/JokeScene1";
import { JokeScene2 } from "./scenes/JokeScene2";
import { JokeScene3 } from "./scenes/JokeScene3";
import { JokeScene4 } from "./scenes/JokeScene4";
import { OutroScene } from "./scenes/OutroScene";

export type Props = {
  sceneDurations: number[];
};

const DEFAULT_DURATION = 240; // 8s fallback

/**
 * Transition duration in frames (1s at 30fps).
 */
export const TRANSITION_FRAMES = 30;

export const GalgameMemeTheaterEp7: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? DEFAULT_DURATION;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a051e" }}>
      <TransitionSeries>
        {/* Title Scene */}
        <TransitionSeries.Sequence durationInFrames={d(0)}>
          <TitleScene />
          <Audio src={staticFile("audio/01-title.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Title -> Joke1: slide from right */}
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Joke 1: AI 代寫作業 */}
        <TransitionSeries.Sequence durationInFrames={d(1)}>
          <JokeScene1 />
          <Audio src={staticFile("audio/02-joke1.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Joke1 -> Joke2: flip */}
        <TransitionSeries.Transition
          presentation={flip({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Joke 2: AI 回訊息翻車 */}
        <TransitionSeries.Sequence durationInFrames={d(2)}>
          <JokeScene2 />
          <Audio src={staticFile("audio/03-joke2.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Joke2 -> Joke3: wipe */}
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Joke 3: 深度偽造危機 */}
        <TransitionSeries.Sequence durationInFrames={d(3)}>
          <JokeScene3 />
          <Audio src={staticFile("audio/04-joke3.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Joke3 -> Joke4: clockWipe */}
        <TransitionSeries.Transition
          presentation={clockWipe({ width: 1920, height: 1080 })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Joke 4: 人類存在的意義 */}
        <TransitionSeries.Sequence durationInFrames={d(4)}>
          <JokeScene4 />
          <Audio src={staticFile("audio/05-joke4.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Joke4 -> Outro: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={d(5)}>
          <OutroScene />
          <Audio src={staticFile("audio/06-outro.wav")} volume={1} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
