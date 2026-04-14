import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { notoSansTC, maShanZheng } from "../characters";

/**
 * Quest-complete badge for OutroScene — mimics game achievement popup.
 * Slides in, shows a trophy label + episode summary, then fades out.
 */

interface QuestBadgeProps {
  title: string;
  subtitle?: string;
  color?: string;
  /** Frame within the scene when badge should start appearing */
  delay?: number;
}

export const QuestBadge: React.FC<QuestBadgeProps> = ({
  title,
  subtitle,
  color = "#F59E0B",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  // Slide in from top with spring
  const slideIn = spring({ frame: f, fps, config: { damping: 14, stiffness: 100, mass: 0.6 } });
  const translateY = interpolate(slideIn, [0, 1], [-80, 0]);

  // Scale bounce for the trophy icon
  const trophyScale = interpolate(f, [0, 5, 10], [0, 1.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const trophyOpacity = interpolate(f, [0, 3, 40, 55], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Badge box fade in/out
  const boxOpacity = interpolate(f, [0, 8, 50, 70], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress bar fill
  const progressWidth = interpolate(f, [5, 35], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "15%",
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        fontFamily: notoSansTC,
        zIndex: 200,
        opacity: boxOpacity,
        pointerEvents: "none",
      }}
    >
      {/* Trophy icon */}
      <div
        style={{
          position: "absolute",
          top: -18,
          left: "50%",
          transform: `translateX(-50%) scale(${trophyScale})`,
          fontSize: 50,
          opacity: trophyOpacity,
          filter: `drop-shadow(0 0 15px ${color}88)`,
        }}
      >
        🏆
      </div>

      {/* Badge box */}
      <div
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,10,40,0.9))`,
          border: `2px solid ${color}`,
          borderRadius: 16,
          padding: "28px 60px 24px",
          minWidth: 500,
          textAlign: "center",
          boxShadow: `0 0 40px ${color}33, 0 8px 30px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: 18,
            color: color,
            fontWeight: 700,
            letterSpacing: "0.2em",
            marginBottom: 10,
          }}
        >
          【任務完成】
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: maShanZheng,
            fontSize: 36,
            color: "#fff",
            fontWeight: 700,
            textShadow: `0 0 20px ${color}66`,
            letterSpacing: "0.08em",
            marginBottom: subtitle ? 8 : 0,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: 20,
              color: "#94A3B8",
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Progress bar */}
        <div
          style={{
            marginTop: 16,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${color}, ${color}88)`,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Small "system unlocking" teaser for the next episode.
 */
interface UnlockingTeaserProps {
  text: string;
  color?: string;
  delay?: number;
}

export const UnlockingTeaser: React.FC<UnlockingTeaserProps> = ({
  text,
  color = "#38BDF8",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const scaleIn = spring({ frame: f, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(f, [0, 5, 40, 55], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Blinking dots
  const dotOpacity = interpolate(f, [0, 10, 20, 30, 40], [0, 1, 0.3, 1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "12%",
        left: "50%",
        transform: `translateX(-50%) scale(${scaleIn})`,
        fontFamily: notoSansTC,
        zIndex: 200,
        opacity,
        pointerEvents: "none",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 18,
          color,
          fontWeight: 600,
          letterSpacing: "0.15em",
          marginBottom: 8,
        }}
      >
        系統提示：下一集解鎖中
        <span style={{ opacity: dotOpacity }}>…</span>
      </div>
      <div
        style={{
          fontSize: 16,
          color: "#64748B",
          letterSpacing: "0.05em",
        }}
      >
        {text}
      </div>
    </div>
  );
};
