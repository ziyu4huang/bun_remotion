import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Sunshine rays
  const rayScale = interpolate(frame, [10, 50], [0, 1], { extrapolateRight: "clamp" });
  const rayOpacity = interpolate(frame, [10, 40], [0, 0.3], { extrapolateRight: "clamp" });

  // Rainbow arc
  const rainbowWidth = interpolate(frame, [20, 60], [0, 600], { extrapolateRight: "clamp" });
  const rainbowOpacity = interpolate(frame, [20, 50], [0, 0.6], { extrapolateRight: "clamp" });

  // Pigs bounce happily
  const bounce1 = spring({ frame: frame - 30, fps, config: { damping: 6 } });
  const bounce2 = spring({ frame: frame - 38, fps, config: { damping: 6 } });
  const bounce3 = spring({ frame: frame - 46, fps, config: { damping: 6 } });

  // "劇終" text
  const endScale = spring({ frame: frame - 60, fps, config: { damping: 10, stiffness: 80 } });
  const endOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  // Sparkles
  const sparkles = Array.from({ length: 8 }, (_, i) => {
    const delay = 40 + i * 8;
    const sparkleOpacity = interpolate(frame, [delay, delay + 15, delay + 30], [0, 1, 0], { extrapolateRight: "clamp" });
    const sparkleY = interpolate(frame, [delay, delay + 30], [0, -40], { extrapolateRight: "clamp" });
    return (
      <div key={i} style={{
        position: "absolute",
        left: `${15 + i * 10}%`,
        top: `${20 + (i % 3) * 15}%`,
        opacity: sparkleOpacity,
        transform: `translateY(${sparkleY}px)`,
        fontSize: 20,
      }}>
        ✨
      </div>
    );
  });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/wolf-flee.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: imgOpacity,
        }}
      />
      {/* Sunshine rays from top-right */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)",
        opacity: rayOpacity,
        transform: `scale(${rayScale})`,
        borderRadius: "50%",
      }} />
      {/* Rainbow */}
      <div style={{
        position: "absolute", top: "8%", left: "50%",
        transform: "translateX(-50%)",
        width: rainbowWidth, height: 80,
        opacity: rainbowOpacity,
        background: "linear-gradient(180deg, #FF6B6B 0%, #FFD93D 20%, #6BCB77 40%, #4D96FF 60%, #9B59B6 80%, transparent 100%)",
        borderRadius: "300px 300px 0 0",
        borderTop: "8px solid #FF6B6B",
      }} />
      {/* Sparkles */}
      {sparkles}
      {/* 劇終 text */}
      <div style={{
        position: "absolute", top: "40%", left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: endOpacity,
        transform: `scale(${endScale})`,
      }}>
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: "#E53E3E",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          textShadow: "3px 3px 0 rgba(0,0,0,0.1)",
          background: "rgba(255,255,255,0.8)",
          padding: "10px 50px",
          borderRadius: 20,
        }}>
          劇終
        </div>
      </div>
      {/* Bouncing pigs at bottom */}
      <div style={{
        position: "absolute", bottom: "10%", left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 40,
      }}>
        <div style={{ fontSize: 50, transform: `translateY(${(1 - bounce1) * -30}px)` }}>🐷</div>
        <div style={{ fontSize: 50, transform: `translateY(${(1 - bounce2) * -30}px)` }}>🐷</div>
        <div style={{ fontSize: 50, transform: `translateY(${(1 - bounce3) * -30}px)` }}>🐷</div>
      </div>
    </div>
  );
};
