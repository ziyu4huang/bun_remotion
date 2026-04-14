import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import type { Props } from "./Root";
import { TitleScene } from "./scenes/TitleScene";
import { ContentScene1 } from "./scenes/ContentScene1";
import { ContentScene2 } from "./scenes/ContentScene2";
import { ContentScene3 } from "./scenes/ContentScene3";
import { OutroScene } from "./scenes/OutroScene";

const TRANSITION_FRAMES = 15;

const sceneNames = ["Title", "Content 1", "Content 2", "Content 3", "Outro"] as const;

const scenes = [
  { Scene: TitleScene, audio: "audio/01-title.wav" },
  { Scene: ContentScene1, audio: "audio/02-content1.wav" },
  { Scene: ContentScene2, audio: "audio/03-content2.wav" },
  { Scene: ContentScene3, audio: "audio/04-content3.wav" },
  { Scene: OutroScene, audio: "audio/05-outro.wav" },
];

const transitions = [
  fade(),
  slide({ direction: "from-right" }),
  wipe({ direction: "from-right" }),
  clockWipe({ width: 1920, height: 1080 }),
];

export const MyCoreIsBossCh1Ep1: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 210;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a2e" }}>
      <TransitionSeries>
        {scenes.map(({ Scene, audio }, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={d(i)} name={sceneNames[i]}>
              <Scene />
              <Audio src={staticFile(audio)} volume={1} />
            </TransitionSeries.Sequence>

            {i < transitions.length && (
              <TransitionSeries.Transition
                presentation={transitions[i]}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
