import { Composition, CalculateMetadataFunction } from "remotion";
import { TaiwanStockMarket, type Props } from "./TaiwanStockMarket";

// Durations (in frames) per scene — written by scripts/generate-tts.ts after audio generation.
// Falls back to 240 (8s) when audio hasn't been generated yet.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sceneDurationsData: number[] = (() => {
  try { return require("../public/audio/durations.json"); }
  catch { return Array(7).fill(240); }
})();

const calculateMetadata: CalculateMetadataFunction<Props> = async () => ({
  durationInFrames: sceneDurationsData.reduce((sum, d) => sum + d, 0),
  props: { sceneDurations: sceneDurationsData },
});

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TaiwanStockMarket"
    component={TaiwanStockMarket}
    durationInFrames={sceneDurationsData.reduce((sum, d) => sum + d, 0)}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ sceneDurations: sceneDurationsData }}
    calculateMetadata={calculateMetadata}
  />
);
