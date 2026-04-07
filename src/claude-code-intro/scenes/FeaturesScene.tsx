import { interpolate, useCurrentFrame, Easing, spring } from "remotion";

const features = [
  {
    icon: ">_",
    title: "Terminal Native",
    desc: "Lives in your CLI, understands your project",
  },
  {
    icon: "{ }",
    title: "Code Understanding",
    desc: "Reads, writes, edits across your codebase",
  },
  {
    icon: "/ ?",
    title: "Ask Anything",
    desc: "Natural language to code, instantly",
  },
  {
    icon: "MR",
    title: "Full Stack",
    desc: "Frontend, backend, infra — it handles it all",
  },
];

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Section title
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [20, 0], {
    extrapolateRight: "clamp",
  });

  // Underline
  const underlineW = interpolate(frame, [15, 35], [0, 200], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "radial-gradient(ellipse at 50% 30%, #151210 0%, #0d0d0d 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 80,
        fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 48,
          fontWeight: 700,
          color: "#e8e8e8",
        }}
      >
        What Can It{" "}
        <span style={{ color: "#D97757" }}>Do</span>?
      </div>
      <div
        style={{
          width: underlineW,
          height: 2,
          background: "linear-gradient(90deg, transparent, #D97757, transparent)",
          marginTop: 12,
          marginBottom: 48,
        }}
      />

      {/* Feature cards */}
      <div
        style={{
          display: "flex",
          gap: 32,
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: 1600,
          padding: "0 60px",
        }}
      >
        {features.map((f, i) => {
          const cardDelay = 25 + i * 15;
          const cardSpring = spring({
            frame: frame - cardDelay,
            fps: 30,
            config: { damping: 18, stiffness: 120, mass: 0.8 },
          });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
          });
          const cardY = interpolate(cardSpring, [0, 1], [40, 0], {
            extrapolateLeft: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                width: 340,
                padding: "36px 28px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: "rgba(217, 119, 87, 0.12)",
                  border: "1px solid rgba(217, 119, 87, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#D97757",
                  marginBottom: 20,
                  fontFamily: "monospace",
                }}
              >
                {f.icon}
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#e8e8e8",
                  marginBottom: 8,
                }}
              >
                {f.title}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
