import { interpolate, useCurrentFrame } from "remotion";

interface FadeTextProps {
  text: string;
  startFrame: number;
  style?: React.CSSProperties;
}

export const FadeText: React.FC<FadeTextProps> = ({ text, startFrame, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - startFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame - startFrame, [0, 20], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, ...style }}>
      {text}
    </div>
  );
};
