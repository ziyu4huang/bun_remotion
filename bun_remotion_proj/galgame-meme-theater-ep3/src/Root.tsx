import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import {
  GalgameMemeTheaterEp3,
  TRANSITION_FRAMES,
  type Props,
} from "./GalgameMemeTheaterEp3";

const NUM_SCENES = 6;
const NUM_TRANSITIONS = NUM_SCENES - 1;

// Durations (in frames) per scene — written by scripts/generate-tts.ts after audio generation.
// Falls back to 240 (8s) when audio hasn't been generated yet.
const sceneDurationsData: number[] = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("../public/audio/durations.json");
  } catch {
    return Array(NUM_SCENES).fill(240);
  }
})();

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  // Total = sum of scene durations - sum of transition overlaps
  const totalDuration =
    sceneDurationsData.reduce((sum, d) => sum + d, 0) -
    NUM_TRANSITIONS * TRANSITION_FRAMES;

  return {
    durationInFrames: totalDuration,
    props: { sceneDurations: sceneDurationsData },
  };
};

export const RemotionRoot: React.FC = () => {
  const totalDuration =
    sceneDurationsData.reduce((sum, d) => sum + d, 0) -
    NUM_TRANSITIONS * TRANSITION_FRAMES;

  return (
    <>
      <Composition
        id="GalgameMemeTheaterEp3"
        component={GalgameMemeTheaterEp3}
        durationInFrames={totalDuration}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ sceneDurations: sceneDurationsData }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
