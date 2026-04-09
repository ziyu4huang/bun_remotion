import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  cancelRender,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// 30 particle seeds (angle in radians, speed factor)
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  angle: (i / 30) * Math.PI * 2 + (i % 3) * 0.3,
  speed: 120 + (i % 7) * 30,
  size: 3 + (i % 4) * 2,
  color: i % 3 === 0 ? "#D97757" : i % 3 === 1 ? "#ffffff" : "#ffcc88",
}));

const ORANGE = "#D97757";
const FONT = "'SF Mono', 'Cascadia Code', 'Fira Code', monospace";

export const FusionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // --- Lottie loader ---
  const [handle] = useState(() => delayRender("Loading Lottie"));
  const [animData, setAnimData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch(staticFile("cosmic-bg.json"))
      .then((r) => r.json())
      .then((json) => {
        setAnimData(json);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);

  // ── ACT 1: image reveal (f0–f80) ──────────────────────────────────────────
  const progressWidth = interpolate(frame, [0, 30], [0, width], {
    extrapolateRight: "clamp",
  });
  const progressOpacity = interpolate(frame, [27, 38], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bgScale = interpolate(frame, [30, 75], [1.35, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgBlur = interpolate(frame, [30, 70], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [30, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── ACT 2: logo fusion (f80–f220) ────────────────────────────────────────
  const logoScale = interpolate(frame, [85, 115], [0, 1.15], {
    easing: Easing.out(Easing.back(1.8)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoSettleScale = interpolate(frame, [115, 128], [1.15, 1.0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoOpacity = interpolate(frame, [83, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const finalLogoScale = frame < 115 ? logoScale : logoSettleScale;

  // Shockwave ring
  const ringScale = interpolate(frame, [85, 130], [0.1, 3.5], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(frame, [85, 130], [0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glass card (CLAUDE CODE × AI ART = ∞)
  const cardOpacity = interpolate(frame, [150, 175], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardY = interpolate(frame, [150, 175], [30, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── ACT 3: shock stamp (f220–f295) ────────────────────────────────────────
  const stampY = interpolate(frame, [220, 240], [-80, 0], {
    easing: Easing.out(Easing.back(1.4)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stampOpacity = interpolate(frame, [218, 228], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // RGB glitch (f220–f243): offset on R and B channels
  const glitchActive = frame >= 220 && frame <= 243;
  const glitchCycle = (frame - 220) % 5; // 0-4
  const glitchX = glitchActive && glitchCycle < 2 ? (glitchCycle === 0 ? 5 : -5) : 0;

  // Flash
  const flashOpacity = interpolate(frame, [265, 269, 273], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Global fade out
  const globalFade = interpolate(frame, [280, 333], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        fontFamily: FONT,
        color: "#fff",
        overflow: "hidden",
        opacity: globalFade,
      }}
    >
      {/* ── Background Lottie ── */}
      {animData && (
        <AbsoluteFill
          style={{
            opacity: bgOpacity,
            transform: `scale(${bgScale})`,
            filter: bgBlur > 0 ? `blur(${bgBlur}px)` : "none",
          }}
        >
          <Lottie
            animationData={animData}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loop
          />
        </AbsoluteFill>
      )}

      {/* Dark vignette overlay */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── ACT 1: Progress bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 4,
          width: progressWidth,
          background: `linear-gradient(90deg, ${ORANGE}, #ffcc88)`,
          opacity: progressOpacity,
          boxShadow: `0 0 12px ${ORANGE}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 20,
          fontSize: 13,
          color: ORANGE,
          opacity: progressOpacity,
          letterSpacing: "0.15em",
          fontFamily: FONT,
        }}
      >
        DOWNLOADING...
      </div>

      {/* ── ACT 2: Shockwave ring ── */}
      {frame >= 85 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 160,
            height: 160,
            marginTop: -80,
            marginLeft: -80,
            borderRadius: "50%",
            border: `3px solid ${ORANGE}`,
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
            boxShadow: `0 0 20px ${ORANGE}`,
          }}
        />
      )}

      {/* ── ACT 2: Particles ── */}
      {frame >= 85 &&
        frame <= 160 &&
        PARTICLES.map((p, i) => {
          const t = interpolate(frame, [85, 155], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const dist = t * p.speed;
          const x = width / 2 + Math.cos(p.angle) * dist;
          const y = height / 2 + Math.sin(p.angle) * dist;
          const pOpacity = interpolate(frame, [85, 100, 155], [0, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - p.size / 2,
                top: y - p.size / 2,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: p.color,
                opacity: pOpacity,
                boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          );
        })}

      {/* ── ACT 2: Claude Code Logo ── */}
      {frame >= 83 && (
        <Img
          src={staticFile("claude-code-logo.png")}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginTop: -90,
            marginLeft: -90,
            opacity: logoOpacity,
            transform: `scale(${finalLogoScale})`,
            width: 180,
            height: 180,
            borderRadius: "20%",
            boxShadow: `0 0 60px rgba(217,119,87,0.6), 0 0 120px rgba(217,119,87,0.25)`,
          }}
        />
      )}

      {/* ── ACT 2: Glass card ── */}
      {frame >= 148 && (
        <div
          style={{
            position: "absolute",
            bottom: 200,
            left: "50%",
            transform: `translateX(-50%) translateY(${cardY}px)`,
            opacity: cardOpacity,
            padding: "20px 48px",
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(217,119,87,0.4)",
            borderRadius: 16,
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "0.12em" }}>
            CLAUDE CODE
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: ORANGE,
              marginTop: 4,
              letterSpacing: "0.08em",
            }}
          >
            × AI ART = ∞
          </div>
        </div>
      )}

      {/* ── ACT 3: SHOCKING THE WORLD stamp ── */}
      {frame >= 218 && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 0,
            right: 0,
            opacity: stampOpacity,
            transform: `translateY(${stampY}px)`,
          }}
        >
          {/* Shadow/glitch layer B (blue offset) */}
          {glitchActive && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 52,
                fontWeight: 900,
                letterSpacing: "0.25em",
                color: "rgba(100,180,255,0.6)",
                transform: `translateX(${-glitchX}px)`,
                mixBlendMode: "screen",
              }}
            >
              SHOCKING THE WORLD
            </div>
          )}
          {/* Main stamp bar */}
          <div
            style={{
              backgroundColor: ORANGE,
              padding: "18px 0",
              textAlign: "center",
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: "0.25em",
              color: "#fff",
              transform: `translateX(${glitchX}px)`,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            SHOCKING THE WORLD
          </div>
          {/* Glitch layer R (red offset) */}
          {glitchActive && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 52,
                fontWeight: 900,
                letterSpacing: "0.25em",
                color: "rgba(255,60,60,0.5)",
                transform: `translateX(${glitchX * 2}px)`,
                mixBlendMode: "screen",
              }}
            >
              SHOCKING THE WORLD
            </div>
          )}
        </div>
      )}

      {/* ── White flash ── */}
      {frame >= 263 && (
        <AbsoluteFill
          style={{
            background: "#fff",
            opacity: flashOpacity,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
