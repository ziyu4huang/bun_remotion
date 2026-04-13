import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import {
  TestImageSharedImport,
  TRANSITION_FRAMES,
  type Props,
} from "./TestImageSharedImport";

const NUM_SCENES = 3;
const NUM_TRANSITIONS = NUM_SCENES - 1;

const sceneDurationsData: number[] = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("../public/audio/durations.json");
  } catch {
    return Array(NUM_SCENES).fill(240);
  }
})();

const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
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
        id="TestImageSharedImport"
        component={TestImageSharedImport}
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
