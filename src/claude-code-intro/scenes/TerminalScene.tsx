import { interpolate, useCurrentFrame, Easing } from "remotion";

const terminalLines = [
  { text: "$ claude", prompt: true },
  { text: "", prompt: false },
  { text: "  Welcome to Claude Code!", prompt: false, color: "#D97757" },
  { text: "  Connected to project: my-awesome-app", prompt: false, color: "rgba(255,255,255,0.5)" },
  { text: "", prompt: false },
  { text: "  > Refactor the auth middleware to use JWT", prompt: false, color: "#e8e8e8", isUser: true },
  { text: "", prompt: false },
  { text: "  Analyzing auth middleware...", prompt: false, color: "#D97757" },
  { text: "  Reading src/middleware/auth.ts", prompt: false, color: "rgba(255,255,255,0.4)" },
  { text: "  Found 3 files to update", prompt: false, color: "rgba(255,255,255,0.4)" },
  { text: "", prompt: false },
  { text: "  Updated auth.ts — added JWT validation", prompt: false, color: "#7ec699" },
  { text: "  Updated routes.ts — integrated new middleware", prompt: false, color: "#7ec699" },
  { text: "  Updated tests/auth.test.ts — 12 tests passing", prompt: false, color: "#7ec699" },
  { text: "", prompt: false },
  { text: "  Done. 3 files changed, all tests passing.", prompt: false, color: "#D97757" },
];

export const TerminalScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Terminal window entrance
  const termOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const termScale = interpolate(frame, [0, 30], [0.92, 1], {
    extrapolateRight: "clamp",
  });

  // Each line appears sequentially
  const lineDelay = 12; // frames between lines

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "radial-gradient(ellipse at 50% 50%, #141210 0%, #0a0a0a 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Label above terminal */}
      <div
        style={{
          position: "absolute",
          top: 60,
          fontSize: 36,
          fontWeight: 700,
          color: "#e8e8e8",
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        See It In{" "}
        <span style={{ color: "#D97757" }}>Action</span>
      </div>

      {/* Terminal window */}
      <div
        style={{
          opacity: termOpacity,
          transform: `scale(${termScale})`,
          width: 1100,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          marginTop: 30,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: "#1a1a1a",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          <span
            style={{
              marginLeft: 16,
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            claude — ~/my-awesome-app
          </span>
        </div>

        {/* Terminal body */}
        <div
          style={{
            background: "#0d0d0d",
            padding: "24px 28px",
            minHeight: 420,
          }}
        >
          {terminalLines.map((line, i) => {
            const lineStart = 20 + i * lineDelay;
            const lineOpacity = interpolate(frame - lineStart, [0, 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            if (line.text === "") {
              return <div key={i} style={{ height: 10 }} />;
            }

            const isUserLine = "isUser" in line && line.isUser;
            const prefix = line.prompt ? (
              <span style={{ color: "#D97757", fontWeight: 600 }}>$ </span>
            ) : isUserLine ? (
              <span style={{ color: "rgba(255,255,255,0.25)" }}>  </span>
            ) : null;

            return (
              <div
                key={i}
                style={{
                  opacity: lineOpacity,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: line.color || "#e8e8e8",
                  whiteSpace: "pre",
                }}
              >
                {prefix}
                {line.text}
                {i === 0 && frame >= lineStart && frame < lineStart + 15 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 9,
                      height: 20,
                      background: "#D97757",
                      marginLeft: 2,
                      verticalAlign: "middle",
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Blinking cursor at end */}
          {frame > 20 + terminalLines.length * lineDelay && (
            <div
              style={{
                display: "inline-block",
                width: 9,
                height: 20,
                background: "#D97757",
                marginTop: 4,
                opacity: Math.sin(frame * 0.15) > 0 ? 1 : 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
