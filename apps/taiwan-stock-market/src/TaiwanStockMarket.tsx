import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { KLineScene } from "./scenes/KLineScene";
import { PriceVolumeScene } from "./scenes/PriceVolumeScene";
import { SupportResistanceScene } from "./scenes/SupportResistanceScene";
import { MovingAverageScene } from "./scenes/MovingAverageScene";
import { TradingHoursScene } from "./scenes/TradingHoursScene";
import { LimitScene } from "./scenes/LimitScene";

export const TaiwanStockMarket: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
      <Sequence from={0} durationInFrames={240}>
        <TitleScene />
        <Audio src={staticFile("audio/01-title.wav")} volume={1} />
      </Sequence>
      <Sequence from={240} durationInFrames={240}>
        <KLineScene />
        <Audio src={staticFile("audio/02-kline.wav")} volume={1} />
      </Sequence>
      <Sequence from={480} durationInFrames={240}>
        <PriceVolumeScene />
        <Audio src={staticFile("audio/03-price-volume.wav")} volume={1} />
      </Sequence>
      <Sequence from={720} durationInFrames={240}>
        <SupportResistanceScene />
        <Audio src={staticFile("audio/04-support-resistance.wav")} volume={1} />
      </Sequence>
      <Sequence from={960} durationInFrames={240}>
        <MovingAverageScene />
        <Audio src={staticFile("audio/05-moving-average.wav")} volume={1} />
      </Sequence>
      <Sequence from={1200} durationInFrames={240}>
        <TradingHoursScene />
        <Audio src={staticFile("audio/06-trading-hours.wav")} volume={1} />
      </Sequence>
      <Sequence from={1440} durationInFrames={240}>
        <LimitScene />
        <Audio src={staticFile("audio/07-limit.wav")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
