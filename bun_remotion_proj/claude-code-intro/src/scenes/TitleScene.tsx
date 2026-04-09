import { interpolate, useCurrentFrame, Easing } from "remotion";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Claude logo circle animation
  const logoScale = interpolate(frame, [0, 25], [0.6, 1], {
    ...Easing.out(Easing.back(1.5)),
    extrapolateRight: "clamp",
  });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Title text
  const titleOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [20, 45], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Divider line
  const lineW = interpolate(frame, [55, 80], [0, 320], {
    extrapolateRight: "clamp",
  });

  // Tagline
  const tagOpacity = interpolate(frame, [75, 95], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Floating particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const x = 100 + (i * 160) % 1720;
    const baseY = 80 + (i * 97) % 920;
    const yOff = interpolate(frame, [0, 150], [0, -30 + (i % 3) * 20], {
      extrapolateRight: "clamp",
    });
    const opacity = interpolate(frame, [0, 40], [0, 0.15 + (i % 4) * 0.05], {
      extrapolateRight: "clamp",
    });
    return { x, y: baseY + yOff, opacity, size: 3 + (i % 3) * 2 };
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "radial-gradient(ellipse at 50% 40%, #1a1410 0%, #0d0d0d 60%, #080808 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#D97757",
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Claude logo mark — stylized "C" in circle */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "3px solid #D97757",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
          boxShadow: "0 0 60px rgba(217, 119, 87, 0.25), 0 0 120px rgba(217, 119, 87, 0.1)",
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#D97757",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
          }}
        >
          C
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        <span style={{ color: "#D97757" }}>Claude</span>{" "}
        <span style={{ color: "#e8e8e8" }}>Code</span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: lineW,
          height: 2,
          background: "linear-gradient(90deg, transparent, #D97757, transparent)",
          margin: "20px 0",
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subOpacity,
          fontSize: 28,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Your AI Coding Companion
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: tagOpacity,
          fontSize: 20,
          color: "rgba(255,255,255,0.35)",
          marginTop: 12,
        }}
      >
        An agentic coding tool that lives in your terminal
      </div>
    </div>
  );
};
