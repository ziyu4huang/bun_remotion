import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [25, 45], [30, 0], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [40, 70], [0, 400], { extrapolateRight: "clamp" });

  const pig1X = spring({ frame: frame - 30, fps, config: { damping: 12 } });
  const pig2X = spring({ frame: frame - 42, fps, config: { damping: 12 } });
  const pig3X = spring({ frame: frame - 54, fps, config: { damping: 12 } });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/title-bg.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
      />
      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(255,248,240,0.3) 0%, rgba(255,248,240,0.7) 100%)",
      }} />
      {/* Title */}
      <div style={{
        position: "absolute", top: "30%", left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontSize: 96,
          fontWeight: 900,
          color: "#E53E3E",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          textShadow: "3px 3px 0 rgba(0,0,0,0.1)",
        }}>
          三隻小豬
        </div>
        <div style={{ width: lineWidth, height: 4, background: "#FFD700", borderRadius: 2, marginTop: 20 }} />
        <div style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: 36,
          color: "#4A3728",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          marginTop: 16,
        }}>
          經典童話故事
        </div>
      </div>
      {/* Three pig icons at bottom */}
      <div style={{ position: "absolute", bottom: "12%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60 }}>
        <div style={{ fontSize: 60, transform: `translateX(${(1 - pig1X) * -200}px)`, opacity: pig1X }}>🐷</div>
        <div style={{ fontSize: 60, transform: `translateX(${(1 - pig2X) * -200}px)`, opacity: pig2X }}>🐷</div>
        <div style={{ fontSize: 60, transform: `translateX(${(1 - pig3X) * -200}px)`, opacity: pig3X }}>🐷</div>
      </div>
    </div>
  );
};
