import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import { WeaponForgerCh3Ep2 } from "./WeaponForgerCh3Ep2";

// Written by scripts/generate-tts.ts — falls back to 210f per scene
const sceneDurationsData: number[] = (() => {
  try { return require("../public/audio/durations.json"); }
  catch { return Array(4).fill(210); }
})();

export type Props = { sceneDurations: number[] };

const TRANSITION_FRAMES = 15;
const NUM_TRANSITIONS = 3; // 4 scenes → 3 transitions

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
      id="WeaponForgerCh3Ep2"
      component={WeaponForgerCh3Ep2}
      durationInFrames={totalDuration}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ sceneDurations: sceneDurationsData }}
      calculateMetadata={calculateMetadata}
    />
  );
};
