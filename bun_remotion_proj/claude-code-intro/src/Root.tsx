import { Composition, CalculateMetadataFunction } from "remotion";
import { ClaudeCodeIntro } from "./ClaudeCodeIntro";

// Written by scripts/generate-tts.ts after audio generation.
// Falls back to 210 frames (7s) per scene when audio hasn't been generated yet.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sceneDurationsData: number[] = (() => {
  try { return require("../public/audio/durations.json"); }
  catch { return Array(5).fill(210); }
})();

export type Props = { sceneDurations: number[] };

const calculateMetadata: CalculateMetadataFunction<Props> = async () => ({
  durationInFrames: sceneDurationsData.reduce((sum, d) => sum + d, 0),
  props: { sceneDurations: sceneDurationsData },
});

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ClaudeCodeIntro"
    component={ClaudeCodeIntro}
    durationInFrames={sceneDurationsData.reduce((sum, d) => sum + d, 0)}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ sceneDurations: sceneDurationsData }}
    calculateMetadata={calculateMetadata}
  />
);
