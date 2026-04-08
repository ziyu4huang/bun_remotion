import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { KLineScene } from "./scenes/KLineScene";
import { PriceVolumeScene } from "./scenes/PriceVolumeScene";
import { SupportResistanceScene } from "./scenes/SupportResistanceScene";
import { MovingAverageScene } from "./scenes/MovingAverageScene";
import { TradingHoursScene } from "./scenes/TradingHoursScene";
import { LimitScene } from "./scenes/LimitScene";

export type Props = {
  /** Duration in frames for each scene, computed from audio length by calculateMetadata. */
  sceneDurations: number[];
};

const DEFAULT_DURATION = 240; // 8s fallback when audio not generated yet

export const TaiwanStockMarket: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? DEFAULT_DURATION;

  // Cumulative start offsets
  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  const scenes = [
    { Scene: TitleScene,             audio: "audio/01-title.wav" },
    { Scene: KLineScene,             audio: "audio/02-kline.wav" },
    { Scene: PriceVolumeScene,       audio: "audio/03-price-volume.wav" },
    { Scene: SupportResistanceScene, audio: "audio/04-support-resistance.wav" },
    { Scene: MovingAverageScene,     audio: "audio/05-moving-average.wav" },
    { Scene: TradingHoursScene,      audio: "audio/06-trading-hours.wav" },
    { Scene: LimitScene,             audio: "audio/07-limit.wav" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
      {scenes.map(({ Scene, audio }, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={d(i)}>
          <Scene />
          <Audio src={staticFile(audio)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
