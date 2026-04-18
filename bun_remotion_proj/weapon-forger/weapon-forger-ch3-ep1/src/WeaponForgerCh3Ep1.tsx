import React from "react";
import {
  AbsoluteFill,
  Audio,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { TitleScene } from "./scenes/TitleScene";
import { ContentScene1 } from "./scenes/ContentScene1";
import { ContentScene2 } from "./scenes/ContentScene2";
import { OutroScene } from "./scenes/OutroScene";

export type Props = {
  sceneDurations: number[];
};

export const TRANSITION_FRAMES = 30;

export const WeaponForgerCh3Ep1: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 240;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a051e" }}>
      <TransitionSeries>
        {/* Title */}
        <TransitionSeries.Sequence durationInFrames={d(0)}>
          <TitleScene />
          <Audio src={require("../audio/01-title.wav") as string} volume={1} />
        </TransitionSeries.Sequence>

        {/* Title → Content1: clock wipe */}
        <TransitionSeries.Transition
          presentation={clockWipe({ width: 1920, height: 1080 })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Content 1: 秘境入口 — 各宗門準備 */}
        <TransitionSeries.Sequence durationInFrames={d(1)}>
          <ContentScene1 />
          <Audio src={require("../audio/02-content1.wav") as string} volume={1} />
        </TransitionSeries.Sequence>

        {/* Content1 → Content2: wipe */}
        <TransitionSeries.Transition
          presentation={wipe({ width: 1920, height: 1080 })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Content 2: 雷射切割 vs 上古禁制 */}
        <TransitionSeries.Sequence durationInFrames={d(2)}>
          <ContentScene2 />
          <Audio src={require("../audio/03-content2.wav") as string} volume={1} />
        </TransitionSeries.Sequence>

        {/* Content2 → Outro: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={d(3)}>
          <OutroScene />
          <Audio src={require("../audio/04-outro.wav") as string} volume={1} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
