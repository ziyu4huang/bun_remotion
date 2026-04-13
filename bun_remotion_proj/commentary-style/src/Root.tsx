import React from "react";
import { Composition, CalculateMetadataFunction } from "remotion";
import { CommentaryStyle } from "./CommentaryStyle";

// Written by scripts/generate-tts.ts — falls back to 210f per scene
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sceneDurationsData: number[] = (() => {
  try {
    return require("../public/audio/durations.json");
  } catch {
    return Array(5).fill(210);
  }
})();

export type Props = { sceneDurations: number[] };

const calculateMetadata: CalculateMetadataFunction<Props> = async () => ({
  durationInFrames: sceneDurationsData.reduce((sum, d) => sum + d, 0),
  props: { sceneDurations: sceneDurationsData },
});

export const RemotionRoot: React.FC = () => (
  <Composition
    id="CommentaryStyle"
    component={CommentaryStyle}
    durationInFrames={sceneDurationsData.reduce((sum, d) => sum + d, 0)}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ sceneDurations: sceneDurationsData }}
    calculateMetadata={calculateMetadata}
  />
);
