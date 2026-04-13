import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { notoSansTC } from "../fonts";

interface SystemNotificationProps {
  text: string;
  type?: "mission" | "warning" | "success" | "info";
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
    info: { bg: "#1E3A5F", border: "#60A5FA", text: "#BFDBFE", accent: "#3B82F6" },
  };
  const colors = typeColors[type];

  const slideIn = spring({ frame: f, fps, config: { damping: 12, stiffness: 100, mass: 0.8 } });
  const translateY = interpolate(slideIn, [0, 1], [-100, 0]);

  const dingScale = interpolate(f, [0, 3, 7], [0, 1.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dingOpacity = interpolate(f, [0, 2, 25, 35], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const boxOpacity = interpolate(f, [0, 5, 55, 75], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
      <div
        style={{
          position: "absolute",
          top: -22,
          left: -22,
          transform: `scale(${dingScale})`,
          fontSize: 40,
          fontWeight: 900,
          color: colors.accent,
          textShadow: `0 0 25px ${colors.accent}, 0 0 50px ${colors.accent}88`,
          opacity: dingOpacity,
        }}
      >
        叮！
      </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}dd)`,
          border: `2px solid ${colors.border}`,
          borderRadius: 12,
          padding: "18px 40px",
          minWidth: 500,
          boxShadow: `0 0 30px ${colors.accent}44, 0 4px 20px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: colors.border,
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          【系統通知】
        </div>
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

interface SystemMessageProps {
  text: string;
  delay?: number;
  position?: "top" | "center" | "bottom";
  color?: string;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({
  text,
  delay = 0,
  position = "center",
  color = "#34D399",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const scaleIn = spring({ frame: f, fps, config: { damping: 10, stiffness: 120 } });

  const opacity = interpolate(f, [0, 4, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
          color,
          textShadow: `0 0 20px ${color}88, 0 4px 15px rgba(0,0,0,0.6)`,
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};
