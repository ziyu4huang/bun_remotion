import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from "remotion";
import { maShanZheng, zcoolKuaiLe, zhiMangXing, type ComicEffect } from "../characters";

interface ComicEffectsProps {
  effects: ComicEffect[];
  side: "left" | "center" | "right";
}

export const ComicEffects: React.FC<ComicEffectsProps> = ({ effects, side }) => {
  const frame = useCurrentFrame();
  const horizontalPos = side === "left" ? "15%" : side === "right" ? "75%" : "50%";
  const translateX = side === "center" ? "-50%" : "-50%";

  return (
    <div
      style={{
        position: "absolute",
        top: "5%",
        left: horizontalPos,
        transform: `translateX(${translateX})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      {effects.map((effect, i) => (
        <SingleEffect key={i} effect={effect} frame={frame} delay={i * 4} />
      ))}
    </div>
  );
};

const SingleEffect: React.FC<{ effect: ComicEffect; frame: number; delay: number }> = ({ effect, frame, delay }) => {
  const f = Math.max(0, frame - delay);
  switch (effect) {
    case "surprise": return <SurpriseEffect frame={f} />;
    case "shock": return <ShockEffect frame={f} />;
    case "sweat": return <SweatEffect frame={f} />;
    case "sparkle": return <SparkleEffect frame={f} />;
    case "heart": return <HeartEffect frame={f} />;
    case "anger": return <AngerEffect frame={f} />;
    case "dots": return <DotsEffect frame={f} />;
    case "cry": return <CryEffect frame={f} />;
    case "laugh": return <LaughEffect frame={f} />;
    case "fire": return <FireEffect frame={f} />;
    case "gloating": return <GloatingEffect frame={f} />;
    case "shake": return null;
    default: return null;
  }
};

const SurpriseEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const scaleSpring = spring({ frame, fps, config: { damping: 10, stiffness: 200, mass: 0.3 } });
  const scale = interpolate(scaleSpring, [0, 1], [0, 1.3]);
  const wobble = Math.sin(frame * 0.35) * 5;
  return (
    <div style={{
      fontSize: 80, fontWeight: 900, color: "#FFD700",
      transform: `scale(${scale}) rotate(${wobble}deg)`,
      textShadow: "4px 4px 0 #B45309, 0 0 30px rgba(255, 215, 0, 0.7)",
      fontFamily: maShanZheng,
    }}>？！</div>
  );
};

const ShockEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const scaleSpring = spring({ frame, fps, config: { damping: 8, stiffness: 300, mass: 0.2 } });
  const scale = interpolate(scaleSpring, [0, 1], [3, 1]);
  const opacity = interpolate(frame, [0, 3, 50, 65], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = interpolate(Math.sin(frame * 0.2), [-1, 1], [0.9, 1.1]);
  return (
    <div style={{
      fontSize: 90, fontWeight: 900, color: "#EF4444",
      transform: `scale(${scale * pulse})`, opacity,
      textShadow: "4px 4px 0 #991B1B, 0 0 35px rgba(239, 68, 68, 0.7)",
      fontFamily: zhiMangXing,
    }}>！</div>
  );
};

const SweatEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const dropY = interpolate(frame, [0, 40], [-15, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 5, 35, 50], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wobble = Math.sin(frame * 0.18) * 8;
  const scale = interpolate(frame, [0, 8], [0, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(0.5)) });
  return (
    <div style={{ transform: `translateY(${dropY}px) translateX(${wobble}px) scale(${scale})`, opacity }}>
      <div style={{
        width: 36, height: 48,
        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
        background: "linear-gradient(135deg, #93C5FD, #3B82F6)",
        boxShadow: "0 2px 12px rgba(59, 130, 246, 0.5), inset 3px 3px 8px rgba(255,255,255,0.6)",
      }} />
    </div>
  );
};

const SparkleEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const sparkles = [
    { x: -40, y: -8, size: 24, delay: 0 },
    { x: 20, y: -28, size: 18, delay: 3 },
    { x: 48, y: 8, size: 26, delay: 6 },
    { x: -15, y: -40, size: 16, delay: 9 },
    { x: 60, y: -20, size: 14, delay: 12 },
  ];
  return (
    <>
      {sparkles.map((s, i) => {
        const sf = Math.max(0, frame - s.delay);
        const scale = interpolate(sf, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(0.8)) });
        const rotation = sf * 5;
        const opacity = interpolate(sf, [0, 3, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: s.x, top: s.y,
            width: s.size, height: s.size, opacity,
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}>
            <div style={{
              width: "100%", height: "100%", background: "#FFD700",
              clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
            }} />
          </div>
        );
      })}
    </>
  );
};

const HeartEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const scaleSpring = spring({ frame, fps, config: { damping: 8, stiffness: 150, mass: 0.4 } });
  const heartBeat = interpolate(Math.sin(frame * 0.18), [-1, 1], [1, 1.2]);
  const floatY = Math.sin(frame * 0.07) * 8;
  const opacity = interpolate(frame, [0, 5, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      fontSize: 56,
      transform: `scale(${scaleSpring * heartBeat}) translateY(${floatY}px)`,
      opacity, filter: "drop-shadow(0 2px 8px rgba(244, 63, 94, 0.6))",
    }}>❤️</div>
  );
};

const AngerEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [0, 4], [3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(0.3)) });
  const pulse = interpolate(Math.sin(frame * 0.25), [-1, 1], [0.85, 1.15]);
  const opacity = interpolate(frame, [0, 3, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      fontSize: 52,
      transform: `scale(${scale * pulse}) rotate(${Math.sin(frame * 0.12) * 8}deg)`,
      opacity,
      filter: "drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))",
    }}>💢</div>
  );
};

const DotsEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const dots = [0, 1, 2];
  const baseDelay = 5;
  return (
    <div style={{ display: "flex", gap: 14, marginTop: 5 }}>
      {dots.map((i) => {
        const dotOpacity = interpolate(frame, [baseDelay + i * 8, baseDelay + i * 8 + 6, baseDelay + i * 8 + 30, baseDelay + i * 8 + 40], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const dotBounce = interpolate(Math.sin((frame - baseDelay - i * 8) * 0.25), [-1, 1], [-5, 5]);
        return (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: "50%",
            backgroundColor: "#94A3B8", opacity: dotOpacity,
            transform: `translateY(${dotBounce}px)`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }} />
        );
      })}
    </div>
  );
};

const CryEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 5, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tearY = interpolate(frame, [5, 60], [0, 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ display: "flex", gap: 22, opacity }}>
      <div style={{ width: 10, height: 22, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "linear-gradient(180deg, #93C5FD, #60A5FA)", transform: `translateY(${tearY}px)`, opacity: interpolate(tearY, [0, 10, 35], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
      <div style={{ width: 10, height: 22, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "linear-gradient(180deg, #93C5FD, #60A5FA)", transform: `translateY(${tearY + 6}px)`, opacity: interpolate(tearY + 6, [0, 10, 35], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
      <div style={{ fontSize: 40, transform: `translateY(${Math.sin(frame * 0.1) * 4}px)` }}>😢</div>
    </div>
  );
};

const LaughEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const scaleSpring = spring({ frame, fps, config: { damping: 8, stiffness: 180, mass: 0.3 } });
  const bounce = Math.abs(Math.sin(frame * 0.2)) * 12;
  const opacity = interpolate(frame, [0, 4, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      fontSize: 52,
      transform: `scale(${scaleSpring}) translateY(-${bounce}px)`,
      opacity,
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
    }}>😆</div>
  );
};

const FireEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const scaleSpring = spring({ frame, fps, config: { damping: 6, stiffness: 250, mass: 0.2 } });
  const flicker = Math.sin(frame * 0.25) * 5;
  const opacity = interpolate(frame, [0, 3, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      fontSize: 52,
      transform: `scale(${scaleSpring}) rotate(${flicker}deg)`,
      opacity,
      filter: "drop-shadow(0 0 12px rgba(239, 68, 68, 0.5))",
    }}>🔥</div>
  );
};

const GloatingEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const scaleSpring = spring({ frame, fps, config: { damping: 15, stiffness: 100, mass: 0.5 } });
  const sway = Math.sin(frame * 0.04) * 4;
  const opacity = interpolate(frame, [0, 5, 50, 65], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      fontSize: 48,
      transform: `scale(${scaleSpring}) rotate(${sway}deg)`,
      opacity,
      fontFamily: zcoolKuaiLe,
      filter: "drop-shadow(0 2px 6px rgba(167, 139, 250, 0.5))",
    }}>😏</div>
  );
};
