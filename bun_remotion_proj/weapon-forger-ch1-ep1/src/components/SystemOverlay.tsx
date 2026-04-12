import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { notoSansTC } from "../characters";

/**
 * System UI overlay — mimics the game-like notification panels from 系統文小說.
 * Shows mission notifications, countdown timers, and system messages.
 *
 * Components:
 *   <SystemNotification>  — "叮！" mission alert
 *   <CountdownTimer>      — Big countdown with urgency
 *   <MissionPanel>        — Mission objective display
 *   <SystemMessage>       — Generic system text
 */

// ─── System Notification ("叮！") ──────────────────────────────────────────
interface SystemNotificationProps {
  /** Mission/task text */
  text: string;
  /** Type affects color: "mission" (green), "warning" (red), "success" (gold) */
  type?: "mission" | "warning" | "success";
  /** Frame delay before showing */
  delay?: number;
}

export const SystemNotification: React.FC<SystemNotificationProps> = ({
  text,
  type = "mission",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const typeColors = {
    mission: { bg: "#065F46", border: "#34D399", text: "#A7F3D0", accent: "#10B981" },
    warning: { bg: "#7F1D1D", border: "#F87171", text: "#FECACA", accent: "#EF4444" },
    success: { bg: "#78350F", border: "#FBBF24", text: "#FDE68A", accent: "#F59E0B" },
  };
  const colors = typeColors[type];

  // Slide in from top
  const slideIn = spring({
    frame: f,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });
  const translateY = interpolate(slideIn, [0, 1], [-100, 0]);

  // "叮！" flash
  const dingScale = interpolate(f, [0, 4, 8], [0, 1.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dingOpacity = interpolate(f, [0, 2, 30, 40], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Box opacity
  const boxOpacity = interpolate(f, [0, 5, 60, 80], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        fontFamily: notoSansTC,
        zIndex: 250,
        opacity: boxOpacity,
        pointerEvents: "none",
      }}
    >
      {/* "叮！" badge */}
      <div
        style={{
          position: "absolute",
          top: -20,
          left: -20,
          transform: `scale(${dingScale})`,
          fontSize: 36,
          fontWeight: 900,
          color: colors.accent,
          textShadow: `0 0 20px ${colors.accent}, 0 0 40px ${colors.accent}88`,
          opacity: dingOpacity,
        }}
      >
        叮！
      </div>

      {/* Notification box */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}dd)`,
          border: `2px solid ${colors.border}`,
          borderRadius: 12,
          padding: "18px 40px",
          minWidth: 500,
          boxShadow: `0 0 30px ${colors.accent}44, 0 4px 20px rgba(0,0,0,0.5)`,
          backdropFilter: "blur(10px)",
        }}
      >
        {/* System label */}
        <div
          style={{
            fontSize: 16,
            color: colors.border,
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          【系統通知】
        </div>
        {/* Mission text */}
        <div
          style={{
            fontSize: 32,
            color: colors.text,
            fontWeight: 700,
            lineHeight: 1.6,
            letterSpacing: "0.05em",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ─── Countdown Timer ────────────────────────────────────────────────────────
interface CountdownTimerProps {
  /** Total seconds to count down */
  totalSeconds: number;
  /** Frame within the scene */
  delay?: number;
  /** Color when urgent (last 3 seconds) */
  urgentColor?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  totalSeconds,
  delay = 0,
  urgentColor = "#EF4444",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  // Calculate remaining seconds based on frame progress
  const totalFrames = durationInFrames - delay;
  const framesPerSecond = totalFrames / totalSeconds;
  const remaining = Math.max(0, totalSeconds - Math.floor(f / framesPerSecond));
  const isUrgent = remaining <= 3;

  // Pulse when urgent
  const urgentPulse = isUrgent
    ? interpolate(Math.sin(f * 0.3), [-1, 1], [0.9, 1.1])
    : 1;

  // Scale bump each second tick
  const tickPhase = (f % framesPerSecond) / framesPerSecond;
  const tickScale = tickPhase < 0.1
    ? interpolate(tickPhase, [0, 0.1], [1.15, 1], { easing: Easing.out(Easing.cubic) })
    : 1;

  const color = isUrgent ? urgentColor : "#34D399";

  // Glow intensity increases as time runs out
  const glowIntensity = interpolate(remaining, [0, totalSeconds], [40, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Entrance
  const entrance = spring({
    frame: f,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        right: 80,
        fontFamily: notoSansTC,
        zIndex: 250,
        transform: `scale(${entrance})`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: `4px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 56,
          fontWeight: 900,
          color,
          textShadow: `0 0 ${glowIntensity}px ${color}, 0 0 ${glowIntensity * 2}px ${color}66`,
          transform: `scale(${urgentPulse * tickScale})`,
          boxShadow: `0 0 ${glowIntensity}px ${color}44, inset 0 0 ${glowIntensity * 0.5}px ${color}22`,
          background: "rgba(0, 0, 0, 0.6)",
        }}
      >
        {remaining}
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 16,
          color: `${color}aa`,
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        秒
      </div>
    </div>
  );
};

// ─── Mission Panel ──────────────────────────────────────────────────────────
interface MissionPanelProps {
  title: string;
  objective: string;
  punishment?: string;
  delay?: number;
  position?: "left" | "right";
}

export const MissionPanel: React.FC<MissionPanelProps> = ({
  title,
  objective,
  punishment,
  delay = 0,
  position = "right",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const slideIn = spring({
    frame: f,
    fps,
    config: { damping: 15, stiffness: 90 },
  });
  const slideX = interpolate(slideIn, [0, 1], [position === "right" ? 200 : -200, 0]);

  const boxOpacity = interpolate(f, [0, 8, 80, 100], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 180,
        [position === "right" ? "right" : "left"]: 60,
        transform: `translateX(${slideX}px)`,
        fontFamily: notoSansTC,
        zIndex: 240,
        opacity: boxOpacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(6, 95, 70, 0.9), rgba(6, 78, 59, 0.95))",
          border: "2px solid #34D399",
          borderRadius: 10,
          padding: "16px 24px",
          minWidth: 300,
          boxShadow: "0 0 25px rgba(52, 211, 153, 0.3), 0 4px 15px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: 14, color: "#34D399", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>
          【{title}】
        </div>
        <div style={{ fontSize: 22, color: "#A7F3D0", fontWeight: 600, lineHeight: 1.5 }}>
          {objective}
        </div>
        {punishment && (
          <div style={{ fontSize: 18, color: "#FCA5A5", fontWeight: 600, marginTop: 8, borderTop: "1px solid rgba(52, 211, 153, 0.3)", paddingTop: 8 }}>
            失敗懲罰：{punishment}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── System Message (generic) ───────────────────────────────────────────────
interface SystemMessageProps {
  text: string;
  delay?: number;
  position?: "top" | "center" | "bottom";
}

export const SystemMessage: React.FC<SystemMessageProps> = ({
  text,
  delay = 0,
  position = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const scaleIn = spring({
    frame: f,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(f, [0, 5, 50, 65], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const topPos = position === "top" ? "25%" : position === "bottom" ? "70%" : "50%";

  return (
    <div
      style={{
        position: "absolute",
        top: topPos,
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scaleIn})`,
        fontFamily: notoSansTC,
        zIndex: 260,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: 700,
          color: "#34D399",
          textShadow: "0 0 20px rgba(52, 211, 153, 0.5), 0 4px 15px rgba(0,0,0,0.6)",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};
