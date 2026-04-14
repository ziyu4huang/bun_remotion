import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { notoSansTC, maShanZheng } from "../../../assets/characters";
import { MangaSfx } from "../../../assets/components/MangaSfx";

/**
 * OutroScene — Credits + next episode teaser
 */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 70 },
  });

  const creditSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const credit2Spring = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const teaserSpring = spring({
    frame: Math.max(0, frame - 55),
    fps,
    config: { damping: 8, stiffness: 120 },
  });

  const fadeOut = interpolate(frame, [durationInFrames - 60, durationInFrames - 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #0a0a1e 0%, #1a0a2e 50%, #0a0a1e 100%)",
      }} />

      {/* Floating sparkles */}
      <div style={{ position: "absolute", top: "15%", left: "20%", zIndex: 5 }}>
        <SparkleEffectContainer frame={frame} />
      </div>
      <div style={{ position: "absolute", top: "25%", right: "25%", zIndex: 5 }}>
        <SparkleEffectContainer frame={frame} delay={15} />
      </div>

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: notoSansTC,
        opacity: fadeOut,
        zIndex: 10,
        gap: 25,
      }}>
        <div style={{
          fontSize: 70,
          fontWeight: 900,
          color: "#fff",
          transform: `scale(${titleSpring})`,
          textShadow: "0 0 40px rgba(245, 158, 11, 0.5), 0 0 80px rgba(56, 189, 248, 0.3)",
          letterSpacing: "0.15em",
        }}>
          感謝觀看
        </div>

        <div style={{
          fontSize: 34,
          fontWeight: 700,
          color: "#F59E0B",
          opacity: creditSpring,
          transform: `translateY(${interpolate(creditSpring, [0, 1], [15, 0])}px)`,
          textShadow: "0 0 25px rgba(245, 158, 11, 0.4)",
        }}>
          誰讓他煉器的！ 第二章 第一集
        </div>

        <div style={{
          fontSize: 24,
          color: "#94A3B8",
          opacity: credit2Spring,
          transform: `translateY(${interpolate(credit2Spring, [0, 1], [10, 0])}px)`,
          lineHeight: 2,
          textAlign: "center",
        }}>
          <div>製作：Bun + Remotion</div>
          <div>配音：AI TTS</div>
        </div>

        {/* Teaser */}
        <div style={{
          marginTop: 20,
          padding: "12px 30px",
          border: "2px solid #F59E0B44",
          borderRadius: 8,
          opacity: teaserSpring,
          transform: `scale(${teaserSpring})`,
        }}>
          <div style={{
            fontSize: 20,
            color: "#F59E0B",
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}>
            下集預告
          </div>
          <div style={{
            fontSize: 28,
            color: "#fff",
            fontFamily: maShanZheng,
            textShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
          }}>
            低語洞窟裡的「離線終端」，即將開機。
          </div>
        </div>
      </div>

      {/* Manga SFX */}
      {frame >= 50 && (
        <MangaSfx events={[
          { text: "待續！", x: 1600, y: 900, color: "#F59E0B", rotation: -8, fontSize: 80, font: "brush", delay: 0 },
        ]} />
      )}
    </AbsoluteFill>
  );
};

// Sparkle effect container for outro
const SparkleEffectContainer: React.FC<{ frame: number; delay?: number }> = ({ frame, delay = 0 }) => {
  const f = Math.max(0, frame - delay);
  const sparkles = [
    { x: 0, y: 0, size: 16, d: 0 },
    { x: 30, y: -20, size: 12, d: 5 },
    { x: -25, y: 15, size: 18, d: 10 },
  ];
  return (
    <>
      {sparkles.map((s, i) => {
        const sf = Math.max(0, f - s.d);
        const scale = interpolate(sf, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const opacity = interpolate(sf, [0, 5, 40, 55], [0, 0.7, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: s.x, top: s.y,
            width: s.size, height: s.size, opacity,
            transform: `scale(${scale}) rotate(${sf * 3}deg)`,
          }}>
            <div style={{
              width: "100%", height: "100%", background: "#FFD700",
              clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            }} />
          </div>
        );
      })}
    </>
  );
};
