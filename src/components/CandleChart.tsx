import { Candle, CandleData } from "./Candle";

interface CandleChartProps {
  candles: CandleData[];
  startRevealFrame: number;
  width?: number;
  height?: number;
  intervalFrames?: number;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  startRevealFrame,
  width = 700,
  height = 320,
  intervalFrames = 4,
}) => {
  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const minPrice = Math.min(...allPrices) * 0.998;
  const maxPrice = Math.max(...allPrices) * 1.002;

  const padding = 8;
  const candleWidth = Math.floor((width - padding * 2) / candles.length) - 4;
  const gap = Math.floor((width - padding * 2) / candles.length);

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={padding}
          y1={height * t}
          x2={width - padding}
          y2={height * t}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}
      {candles.map((c, i) => (
        <Candle
          key={i}
          data={c}
          x={padding + i * gap}
          width={candleWidth}
          minPrice={minPrice}
          maxPrice={maxPrice}
          chartHeight={height}
          revealFrame={startRevealFrame + i * intervalFrames}
        />
      ))}
    </svg>
  );
};
