import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import { GalgameMemeTheaterEp2, type Props } from "./GalgameMemeTheaterEp2";

const NUM_SCENES = 6;

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

const calculateMetadata: CalculateMetadataFunction<Props> = async () => ({
  durationInFrames: sceneDurationsData.reduce((sum, d) => sum + d, 0),
  props: { sceneDurations: sceneDurationsData },
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GalgameMemeTheaterEp2"
        component={GalgameMemeTheaterEp2}
        durationInFrames={sceneDurationsData.reduce((sum, d) => sum + d, 0)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ sceneDurations: sceneDurationsData }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
