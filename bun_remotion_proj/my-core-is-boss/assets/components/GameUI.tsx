import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { notoSansTC } from "../characters";

/**
 * Game-style HUD overlay for 系統文 (system novel) videos.
 * Shows HP bars, level tags, cooldowns, quest panels, etc.
 *
 * This is the visual representation of the "核心系統" UI
 * that 林逸 sees in the story.
 */

// ─── HP Bar ─────────────────────────────────────────────────────────────────────

interface HpBarProps {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  color: string;
  x: number;
  y: number;
  delay?: number;
}

export const HpBar: React.FC<HpBarProps> = ({
  name, level, hp, maxHp, color, x, y, delay = 0,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const slideIn = spring({ frame: f, fps: 30, config: { damping: 14, stiffness: 100, mass: 0.6 } });
  const slideX = interpolate(slideIn, [0, 1], [-200, 0]);
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);

  const hpPercent = hp / maxHp;
  const hpWidth = interpolate(f, [5, 30], [0, hpPercent * 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateX(${slideX}px)`,
        opacity,
        pointerEvents: "none",
        zIndex: 150,
        fontFamily: notoSansTC,
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(0, 0, 0, 0.75)",
        border: `1px solid ${color}88`,
        borderRadius: 8,
        padding: "8px 16px",
        minWidth: 220,
        backdropFilter: "blur(4px)",
      }}>
        <div style={{
          fontSize: 16,
          color: "#fff",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 14,
          color: color,
          fontWeight: 700,
          background: `${color}22`,
          padding: "2px 8px",
          borderRadius: 4,
        }}>
          Lv.{level}
        </div>
      </div>
      {/* HP bar */}
      <div style={{
        width: 220,
        height: 8,
        background: "rgba(255,255,255,0.15)",
        borderRadius: 4,
        marginTop: 4,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${hpWidth}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 4,
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
    </div>
  );
};

// ─── Level Tag (floating above character) ───────────────────────────────────────

interface LevelTagProps {
  level: string;
  color: string;
  x: number;
  y: number;
  delay?: number;
}

export const LevelTag: React.FC<LevelTagProps> = ({
  level, color, x, y, delay = 0,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const floatY = Math.sin(f * 0.08) * 5;
  const opacity = interpolate(f, [0, 10, 80, 100], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translateX(-50%) translateY(${floatY}px)`,
      opacity,
      pointerEvents: "none",
      zIndex: 160,
      fontFamily: notoSansTC,
    }}>
      <div style={{
        fontSize: 18,
        fontWeight: 700,
        color: color,
        background: "rgba(0, 0, 0, 0.7)",
        border: `1px solid ${color}66`,
        padding: "3px 14px",
        borderRadius: 12,
        whiteSpace: "nowrap",
        textShadow: `0 0 10px ${color}88`,
        backdropFilter: "blur(2px)",
      }}>
        {level}
      </div>
    </div>
  );
};

// ─── Quest Panel ────────────────────────────────────────────────────────────────

interface QuestPanelProps {
  title: string;
  description: string;
  status?: "active" | "completed" | "failed";
  delay?: number;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  title, description, status = "active", delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const slideIn = spring({ frame: f, fps, config: { damping: 12, stiffness: 100, mass: 0.7 } });
  const slideX = interpolate(slideIn, [0, 1], [300, 0]);
  const opacity = interpolate(f, [0, 10, 80, 100], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const statusColors = {
    active: { border: "#FBBF24", icon: "📋", text: "#FDE68A" },
    completed: { border: "#34D399", icon: "✅", text: "#A7F3D0" },
    failed: { border: "#EF4444", icon: "❌", text: "#FECACA" },
  };
  const sc = statusColors[status];

  return (
    <div style={{
      position: "absolute",
      right: 40,
      top: 120,
      transform: `translateX(${slideX}px)`,
      opacity,
      pointerEvents: "none",
      zIndex: 170,
      fontFamily: notoSansTC,
    }}>
      <div style={{
        background: "rgba(0, 0, 0, 0.8)",
        border: `1px solid ${sc.border}88`,
        borderRadius: 10,
        padding: "16px 24px",
        minWidth: 300,
        backdropFilter: "blur(4px)",
        boxShadow: `0 0 20px ${sc.border}33`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 20 }}>{sc.icon}</span>
          <span style={{
            fontSize: 14,
            color: sc.border,
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}>
            【任務】
          </span>
        </div>
        <div style={{
          fontSize: 22,
          color: "#fff",
          fontWeight: 700,
          marginBottom: 6,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 16,
          color: sc.text,
          lineHeight: 1.6,
        }}>
          {description}
        </div>
      </div>
    </div>
  );
};

// ─── System Loading Text ────────────────────────────────────────────────────────

interface LoadingTextProps {
  text: string;
  color?: string;
  delay?: number;
}

export const LoadingText: React.FC<LoadingTextProps> = ({
  text, color = "#34D399", delay = 0,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);

  const dots = ".".repeat(Math.floor(f / 15) % 4);
  const opacity = interpolate(f, [0, 10, 80, 100], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute",
      bottom: 200,
      left: "50%",
      transform: "translateX(-50%)",
      opacity,
      pointerEvents: "none",
      zIndex: 180,
      fontFamily: notoSansTC,
    }}>
      <div style={{
        fontSize: 28,
        color,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textShadow: `0 0 15px ${color}66`,
      }}>
        {text}{dots}
      </div>
    </div>
  );
};
