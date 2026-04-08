import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const StrawHouseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const houseY = interpolate(frame, [0, 35], [400, 0], { extrapolateRight: "clamp" });
  const houseOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const pigX = spring({ frame: frame - 40, fps, config: { damping: 18 } });

  // Musical notes floating up
  const note1Y = interpolate(frame, [50, 120], [0, -80], { extrapolateRight: "clamp" });
  const note1X = Math.sin(frame * 0.08) * 15;
  const note1Opacity = interpolate(frame, [50, 80, 120], [0, 1, 0], { extrapolateRight: "clamp" });

  const note2Y = interpolate(frame, [65, 135], [0, -90], { extrapolateRight: "clamp" });
  const note2X = Math.sin(frame * 0.08 + 1.5) * 15;
  const note2Opacity = interpolate(frame, [65, 95, 135], [0, 1, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/pig1-straw.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: houseOpacity,
          transform: `translateY(${houseY}px)`,
        }}
      />
      {/* Musical notes */}
      <div style={{
        position: "absolute", top: "25%", left: "55%",
        opacity: note1Opacity, transform: `translate(${note1X}px, ${note1Y}px)`,
        fontSize: 36,
      }}>
        🎵
      </div>
      <div style={{
        position: "absolute", top: "22%", left: "62%",
        opacity: note2Opacity, transform: `translate(${note2X}px, ${note2Y}px)`,
        fontSize: 30,
      }}>
        🎶
      </div>
    </div>
  );
};
