import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const BrickStandScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Phase 1: Wolf blows (0-60)
  const wolfCheek1 = interpolate(frame, [10, 30], [1, 1.3], { extrapolateRight: "clamp" });
  const blowEffect1 = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });

  // Phase 2: Wolf blows harder (60-120)
  const wolfCheek2 = interpolate(frame, [65, 85], [1, 1.5], { extrapolateRight: "clamp" });
  const blowEffect2 = interpolate(frame, [85, 100], [0, 1], { extrapolateRight: "clamp" });

  // Phase 3: Wolf climbs (120-180)
  const wolfClimbY = interpolate(frame, [120, 170], [100, -50], { extrapolateRight: "clamp" });
  const wolfClimbOpacity = interpolate(frame, [120, 140], [1, 1], { extrapolateRight: "clamp" });

  // Phase 4: Wolf falls (180-240)
  const wolfFallY = spring({ frame: frame - 180, fps, config: { damping: 6, stiffness: 100 } });
  const fallOpacity = frame >= 180 ? 1 : 0;

  // Phase 5: Wolf flees (240+)
  const wolfFleeX = interpolate(frame, [240, 300], [0, 1200], { extrapolateRight: "clamp" });
  const fleeOpacity = frame >= 240 ? interpolate(frame, [240, 290], [1, 0], { extrapolateRight: "clamp" }) : 0;

  // "Sweat drops" on wolf
  const sweatOpacity = interpolate(frame, [45, 55], [0, 1], { extrapolateRight: "clamp" });

  // Happy pig bounce at end
  const pigBounce = frame >= 270 ? spring({ frame: frame - 270, fps, config: { damping: 8 } }) : 0;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/brick-safe.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: imgOpacity,
        }}
      />

      {/* Phase indicators via overlay effects */}
      {/* Blow attempt 1 - wind lines */}
      {frame >= 25 && frame <= 50 && (
        <div style={{ position: "absolute", left: "25%", top: "40%", opacity: blowEffect1 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 40, height: 3,
              background: "rgba(255,255,255,0.6)",
              marginBottom: 8,
              transform: `translateX(${interpolate(frame, [25, 50], [0, 60], { extrapolateRight: "clamp" })}px)`,
            }} />
          ))}
        </div>
      )}

      {/* Blow attempt 2 - stronger wind */}
      {frame >= 80 && frame <= 105 && (
        <div style={{ position: "absolute", left: "20%", top: "38%", opacity: blowEffect2 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 50, height: 4,
              background: "rgba(255,255,255,0.7)",
              marginBottom: 10,
              transform: `translateX(${interpolate(frame, [80, 105], [0, 80], { extrapolateRight: "clamp" })}px)`,
            }} />
          ))}
        </div>
      )}

      {/* Wolf sweat drops (after failed blows) */}
      {frame >= 100 && (
        <div style={{
          position: "absolute", top: "30%", left: "45%",
          opacity: sweatOpacity,
          fontSize: 28,
        }}>
          💦
        </div>
      )}

      {/* Impact text */}
      {frame >= 200 && frame <= 240 && (
        <div style={{
          position: "absolute", top: "25%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 48,
          color: "#E53E3E",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          fontWeight: 900,
          opacity: interpolate(frame, [200, 210, 230, 240], [0, 1, 1, 0], { extrapolateRight: "clamp" }),
          textShadow: "2px 2px 0 rgba(0,0,0,0.2)",
        }}>
          穩如泰山！
        </div>
      )}

      {/* Victory bounce at end */}
      {frame >= 270 && (
        <div style={{
          position: "absolute", bottom: "15%", left: "50%",
          transform: `translate(-50%, 0) translateY(${(1 - pigBounce) * -20}px)`,
          fontSize: 50,
        }}>
          🐷🎉
        </div>
      )}
    </div>
  );
};
