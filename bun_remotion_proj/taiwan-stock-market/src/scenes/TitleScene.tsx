import { interpolate, useCurrentFrame } from "remotion";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleOpacity = interpolate(frame, [15, 40], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [15, 40], [40, 0], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [35, 60], [0, 1], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [50, 80], [0, 480], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0d1117 0%, #0a1628 50%, #0d1117 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <svg
        style={{ position: "absolute", inset: 0, opacity: 0.04 }}
        width="100%"
        height="100%"
      >
        {Array.from({ length: 20 }, (_, i) => (
          <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={1080} stroke="white" strokeWidth={1} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 90} x2={1920} y2={i * 90} stroke="white" strokeWidth={1} />
        ))}
      </svg>

      {/* Bull/Bear icon */}
      <div style={{ opacity: logoOpacity, fontSize: 80, marginBottom: 24 }}>📈</div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: "0.05em",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        台灣股市傳統知識
      </div>

      {/* Divider line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: "linear-gradient(90deg, #EF5350, #FF8A65)",
          borderRadius: 2,
          margin: "24px auto",
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 32,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: "0.1em",
          textAlign: "center",
        }}
      >
        Taiwan Stock Market — Traditional Knowledge Explained
      </div>
    </div>
  );
};
