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
import { TitleScene } from "./scenes/TitleScene";
import { ContentScene1 } from "./scenes/ContentScene1";
import { ContentScene2 } from "./scenes/ContentScene2";
import { OutroScene } from "./scenes/OutroScene";

export type Props = {
  sceneDurations: number[];
};

export const TRANSITION_FRAMES = 30;

export const WeaponForgerCh2Ep3: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 240;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a051e" }}>
      <TransitionSeries>
        {/* Title */}
        <TransitionSeries.Sequence durationInFrames={d(0)}>
          <TitleScene />
          <Audio src={staticFile("audio/01-title.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Title → Content1: clock wipe */}
        <TransitionSeries.Transition
          presentation={clockWipe({ width: 1920, height: 1080 })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Content 1: 藏經閣的怨念 — 長老派任務 */}
        <TransitionSeries.Sequence durationInFrames={d(1)}>
          <ContentScene1 />
          <Audio src={staticFile("audio/02-content1.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Content1 → Content2: slide */}
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Content 2: 點讚戰爭 — 書的攻擊與自動評價 */}
        <TransitionSeries.Sequence durationInFrames={d(2)}>
          <ContentScene2 />
          <Audio src={staticFile("audio/03-content2.wav")} volume={1} />
        </TransitionSeries.Sequence>

        {/* Content2 → Outro: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={d(3)}>
          <OutroScene />
          <Audio src={staticFile("audio/04-outro.wav")} volume={1} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
