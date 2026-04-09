import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const WoodHouseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const houseScale = spring({ frame, fps, config: { damping: 15, stiffness: 60 } });
  const houseOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Planks stacking animation (staggered)
  const planks = [0, 5, 10, 15, 20, 25];
  const plankElements = planks.map((delay, i) => {
    const plankY = interpolate(frame, [delay, delay + 20], [200, 0], { extrapolateRight: "clamp" });
    const plankOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
    return (
      <div key={i} style={{
        position: "absolute",
        left: "30%", top: `${35 + i * 7}%`,
        width: "35%", height: 12,
        background: "#8B6914",
        borderRadius: 3,
        opacity: plankOpacity,
        transform: `translateY(${plankY}px)`,
      }} />
    );
  });

  // Crack highlights
  const crackScale1 = spring({ frame: frame - 60, fps, config: { damping: 12 } });
  const crackScale2 = spring({ frame: frame - 70, fps, config: { damping: 12 } });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/pig2-wood.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: houseOpacity,
          transform: `scale(${0.8 + houseScale * 0.2})`,
        }}
      />
      {/* Crack highlights */}
      <div style={{
        position: "absolute", top: "45%", left: "42%",
        width: 30, height: 30, borderRadius: "50%",
        border: "3px solid #E53E3E",
        opacity: crackScale1,
        transform: `scale(${crackScale1})`,
      }} />
      <div style={{
        position: "absolute", top: "52%", left: "55%",
        width: 24, height: 24, borderRadius: "50%",
        border: "3px solid #E53E3E",
        opacity: crackScale2,
        transform: `scale(${crackScale2})`,
      }} />
    </div>
  );
};
