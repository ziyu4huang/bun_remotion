import { Img, interpolate, useCurrentFrame, Easing, staticFile } from "remotion";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(frame, [0, 25], [0.8, 1], {
    ...Easing.out(Easing.back(1.2)),
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [15, 35], [15, 0], {
    extrapolateRight: "clamp",
  });

  const linkOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const globalFade = interpolate(frame, [95, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "radial-gradient(ellipse at 50% 50%, #1a1410 0%, #0d0d0d 60%, #080808 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
        color: "#fff",
        opacity: globalFade,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(217,119,87,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Claude Code logo */}
      <Img
        src={staticFile("claude-code-logo.png")}
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          width: 90,
          height: 90,
          borderRadius: "20%",
          marginBottom: 28,
          boxShadow: "0 0 40px rgba(217, 119, 87, 0.2)",
        }}
      />

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 44,
          fontWeight: 700,
          color: "#e8e8e8",
          marginBottom: 12,
        }}
      >
        Start Building with{" "}
        <span style={{ color: "#D97757" }}>Claude Code</span>
      </div>

      {/* Link */}
      <div
        style={{
          opacity: linkOpacity,
          fontSize: 20,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 32,
        }}
      >
        claude.ai/code
      </div>

      {/* CTA command */}
      <div
        style={{
          opacity: ctaOpacity,
          padding: "14px 32px",
          background: "rgba(217, 119, 87, 0.1)",
          border: "1px solid rgba(217, 119, 87, 0.3)",
          borderRadius: 12,
          fontSize: 22,
          color: "#D97757",
        }}
      >
        $ npm install -g @anthropic-ai/claude-code
      </div>
    </div>
  );
};
