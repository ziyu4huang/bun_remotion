import { interpolate, useCurrentFrame, Img, staticFile } from "remotion";

export const WoodBlownScene: React.FC = () => {
  const frame = useCurrentFrame();

  const imgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Planks fly
  const planks = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 50 + frame * 4 + 20) * (Math.PI / 180);
    const dist = interpolate(frame, [30, 65], [0, 350 + i * 30], { extrapolateRight: "clamp" });
    const opacity = interpolate(frame, [30, 50, 65], [0, 1, 0], { extrapolateRight: "clamp" });
    return (
      <div key={i} style={{
        position: "absolute",
        left: "35%", top: "38%",
        width: 50, height: 10,
        background: i % 2 === 0 ? "#8B6914" : "#A0782C",
        borderRadius: 2,
        opacity,
        transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${frame * 6 + i * 45}deg)`,
      }} />
    );
  });

  // Two pigs run
  const pigRunX = interpolate(frame, [40, 80], [0, 900], { extrapolateRight: "clamp" });
  const pigBounce = Math.sin(frame * 0.3) * 10;
  const pigOpacity = interpolate(frame, [40, 70], [1, 0], { extrapolateRight: "clamp" });

  // Screen shake
  const shakeX = frame >= 35 && frame <= 50
    ? Math.sin(frame * 2.8) * 10
    : 0;
  const shakeY = frame >= 35 && frame <= 50
    ? Math.cos(frame * 3.2) * 6
    : 0;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      transform: `translate(${shakeX}px, ${shakeY}px)`,
    }}>
      <Img
        src={staticFile("images/wood-blow.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: imgOpacity,
        }}
      />
      {/* Planks fly */}
      {planks}
      {/* Two pigs running */}
      <div style={{
        position: "absolute", bottom: "18%", right: "8%",
        opacity: pigOpacity,
        transform: `translateX(${pigRunX}px) translateY(${pigBounce}px)`,
        fontSize: 44,
        display: "flex", gap: 8,
      }}>
        🐷🐷💨
      </div>
    </div>
  );
};
