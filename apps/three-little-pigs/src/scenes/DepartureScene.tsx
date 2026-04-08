import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const DepartureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const imgX = spring({ frame, fps, config: { damping: 20 } });

  const bubbleOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const bubbleScale = spring({ frame: frame - 50, fps, config: { damping: 15 } });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/three-pigs-walk.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: imgOpacity,
          transform: `translateX(${(1 - imgX) * -80}px)`,
        }}
      />
      {/* Speech bubble for 豬大哥 */}
      <div style={{
        position: "absolute",
        bottom: "18%", right: "8%",
        opacity: bubbleOpacity,
        transform: `scale(${bubbleScale})`,
        background: "rgba(255,255,255,0.95)",
        borderRadius: 24,
        padding: "20px 28px",
        maxWidth: 420,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          fontSize: 26,
          color: "#4A3728",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          lineHeight: 1.6,
        }}>
          「我隨便蓋一蓋就好了！」
        </div>
      </div>
    </div>
  );
};
