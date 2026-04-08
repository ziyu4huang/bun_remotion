import { interpolate, useCurrentFrame, Img, staticFile } from "remotion";

export const WolfAppearScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Sky darkens
  const overlayOpacity = interpolate(frame, [0, 60], [0, 0.4], { extrapolateRight: "clamp" });

  // Wolf slides in from right
  const wolfX = interpolate(frame, [10, 50], [300, 0], { extrapolateRight: "clamp" });
  const wolfOpacity = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });

  // Eyes glow pulse
  const eyeGlow = 0.5 + Math.sin(frame * 0.15) * 0.3;

  // Speech bubble
  const bubbleOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img
        src={staticFile("images/wolf-appear.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
      />
      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(26,32,44,${overlayOpacity})`,
      }} />
      {/* Wolf eyes glow */}
      <div style={{
        position: "absolute", top: "35%", left: "38%",
        width: 14, height: 14, borderRadius: "50%",
        background: `rgba(255,200,0,${eyeGlow})`,
        boxShadow: `0 0 20px rgba(255,200,0,${eyeGlow})`,
        opacity: wolfOpacity,
        transform: `translateX(${wolfX}px)`,
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "42%",
        width: 14, height: 14, borderRadius: "50%",
        background: `rgba(255,200,0,${eyeGlow})`,
        boxShadow: `0 0 20px rgba(255,200,0,${eyeGlow})`,
        opacity: wolfOpacity,
        transform: `translateX(${wolfX}px)`,
      }} />
      {/* Villain speech bubble */}
      <div style={{
        position: "absolute",
        bottom: "15%", left: "8%",
        opacity: bubbleOpacity,
        background: "rgba(80,60,100,0.9)",
        borderRadius: 24,
        padding: "18px 24px",
        maxWidth: 360,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          fontSize: 26,
          color: "#FFD700",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          lineHeight: 1.5,
        }}>
          「嘿嘿，今天有豬肉吃了！」
        </div>
      </div>
    </div>
  );
};
