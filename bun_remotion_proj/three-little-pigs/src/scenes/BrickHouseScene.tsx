import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const BrickHouseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Bricks stacking one by one
  const bricks = Array.from({ length: 8 }, (_, i) => {
    const delay = i * 6;
    const brickY = interpolate(frame, [delay, delay + 15], [300, 0], { extrapolateRight: "clamp" });
    const brickOpacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp" });
    return (
      <div key={i} style={{
        position: "absolute",
        left: i % 2 === 0 ? "32%" : "35%",
        top: `${60 - i * 5}%`,
        width: "30%", height: 16,
        background: "#C45C3C",
        borderRadius: 2,
        opacity: brickOpacity,
        transform: `translateY(${brickY}px)`,
        boxShadow: "1px 1px 0 #A04830",
      }} />
    );
  });

  // Speech bubble
  const bubbleOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });
  const bubbleScale = spring({ frame: frame - 70, fps, config: { damping: 15 } });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/pig3-brick.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: imgOpacity,
        }}
      />
      {/* Speech bubble */}
      <div style={{
        position: "absolute",
        top: "15%", right: "8%",
        opacity: bubbleOpacity,
        transform: `scale(${bubbleScale})`,
        background: "rgba(255,255,255,0.95)",
        borderRadius: 24,
        padding: "18px 24px",
        maxWidth: 380,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          fontSize: 24,
          color: "#4A3728",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          lineHeight: 1.5,
        }}>
          「房子要結實才安全！」
        </div>
      </div>
    </div>
  );
};
