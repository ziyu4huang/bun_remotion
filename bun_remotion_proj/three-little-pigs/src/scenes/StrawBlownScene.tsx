import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";

export const StrawBlownScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Wolf cheeks puff
  const cheekScale = spring({ frame: frame - 25, fps, config: { damping: 8, stiffness: 200 } });

  // Straw pieces scatter
  const strawPieces = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 + frame * 3) * (Math.PI / 180);
    const dist = interpolate(frame, [35, 70], [0, 300 + i * 40], { extrapolateRight: "clamp" });
    const opacity = interpolate(frame, [35, 50, 70], [0, 1, 0], { extrapolateRight: "clamp" });
    return (
      <div key={i} style={{
        position: "absolute",
        left: "35%", top: "40%",
        width: 20, height: 6,
        background: "#F0C75E",
        borderRadius: 3,
        opacity,
        transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${frame * 5 + i * 30}deg)`,
      }} />
    );
  });

  // Screen shake
  const shakeX = frame >= 40 && frame <= 55
    ? Math.sin(frame * 2.5) * 8
    : 0;
  const shakeY = frame >= 40 && frame <= 55
    ? Math.cos(frame * 3) * 5
    : 0;

  // Pig runs away
  const pigX = interpolate(frame, [45, 80], [0, 800], { extrapolateRight: "clamp" });
  const pigOpacity = interpolate(frame, [45, 75], [1, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      transform: `translate(${shakeX}px, ${shakeY}px)`,
    }}>
      <Img
        src={staticFile("images/straw-blow.png")}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0,
          opacity: imgOpacity,
        }}
      />
      {/* Straw scatter */}
      {strawPieces}
      {/* Pig running away */}
      <div style={{
        position: "absolute", bottom: "20%", right: "10%",
        opacity: pigOpacity,
        transform: `translateX(${pigX}px)`,
        fontSize: 50,
      }}>
        🐷💨
      </div>
    </div>
  );
};
