import { AbsoluteFill, Sequence } from "remotion";
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
      </Sequence>
      <Sequence from={240} durationInFrames={240}>
        <KLineScene />
      </Sequence>
      <Sequence from={480} durationInFrames={240}>
        <PriceVolumeScene />
      </Sequence>
      <Sequence from={720} durationInFrames={240}>
        <SupportResistanceScene />
      </Sequence>
      <Sequence from={960} durationInFrames={240}>
        <MovingAverageScene />
      </Sequence>
      <Sequence from={1200} durationInFrames={240}>
        <TradingHoursScene />
      </Sequence>
      <Sequence from={1440} durationInFrames={240}>
        <LimitScene />
      </Sequence>
    </AbsoluteFill>
  );
};
