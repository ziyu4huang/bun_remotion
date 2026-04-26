import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import { MyCoreIsBossCh3Ep1 } from "./MyCoreIsBossCh3Ep1";

// Written by scripts/generate-tts.ts — falls back to 210f per scene
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sceneDurationsData: number[] = (() => {
  try { return require("../audio/durations.json"); }
  catch { return Array(5).fill(210); }
})();

export type Props = { sceneDurations: number[] };

const TRANSITION_FRAMES = 15;
const NUM_TRANSITIONS = 4; // 5 scenes → 4 transitions

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const totalDuration =
    sceneDurationsData.reduce((sum: number, d: number) => sum + d, 0) -
    NUM_TRANSITIONS * TRANSITION_FRAMES;
  return {
    durationInFrames: totalDuration,
    props: { sceneDurations: sceneDurationsData },
  };
};

export const RemotionRoot: React.FC = () => {
  const totalDuration =
    sceneDurationsData.reduce((sum: number, d: number) => sum + d, 0) -
    NUM_TRANSITIONS * TRANSITION_FRAMES;

  return (
    <Composition
      id="MyCoreIsBossCh3Ep1"
      component={MyCoreIsBossCh3Ep1}
      durationInFrames={totalDuration}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ sceneDurations: sceneDurationsData }}
      calculateMetadata={calculateMetadata}
    />
  );
};
