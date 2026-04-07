import { interpolate, useCurrentFrame } from "remotion";

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  label?: string;
}

interface CandleProps {
  data: CandleData;
  x: number;
  width: number;
  minPrice: number;
  maxPrice: number;
  chartHeight: number;
  revealFrame: number;
}

export const Candle: React.FC<CandleProps> = ({
  data,
  x,
  width,
  minPrice,
  maxPrice,
  chartHeight,
  revealFrame,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - revealFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const priceRange = maxPrice - minPrice;
  const toY = (price: number) =>
    chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const isUp = data.close >= data.open;
  const color = isUp ? "#EF5350" : "#26A69A"; // TW convention: red = up, green = down

  const bodyTop = toY(Math.max(data.open, data.close));
  const bodyBottom = toY(Math.min(data.open, data.close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
  const animatedBodyHeight = bodyHeight * progress;

  const wickTop = toY(data.high);
  const wickBottom = toY(data.low);

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={wickTop}
        x2={x + width / 2}
        y2={wickBottom * progress + wickTop * (1 - progress)}
        stroke={color}
        strokeWidth={2}
        opacity={progress}
      />
      {/* Body */}
      <rect
        x={x}
        y={bodyTop}
        width={width}
        height={animatedBodyHeight}
        fill={isUp ? color : "transparent"}
        stroke={color}
        strokeWidth={1.5}
        rx={1}
      />
    </g>
  );
};
