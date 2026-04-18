import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { Emotion } from "../types";

interface CharacterStateOverlayProps {
  characterName: string;
  emotion: Emotion;
  growthDirection: "positive" | "negative" | "flat" | "cyclical";
  traitLabel?: string;
}

const EMOTION_COLORS: Record<Emotion, string> = {
  default: "#9CA3AF",
  angry: "#EF4444",
  shocked: "#A78BFA",
  smirk: "#F97316",
  nervous: "#FBBF24",
  smile: "#10B981",
  laugh: "#34D399",
  sweat: "#60A5FA",
  think: "#6366F1",
  cry: "#3B82F6",
  gloating: "#8B5CF6",
  confused: "#F59E0B",
  chibi: "#EC4899",
};

const DIRECTION_ARROWS: Record<string, string> = {
  positive: "↑",
  negative: "↓",
  flat: "→",
  cyclical: "↻",
};

const DIRECTION_COLORS: Record<string, string> = {
  positive: "#10B981",
  negative: "#EF4444",
  flat: "#6B7280",
  cyclical: "#8B5CF6",
};

export const CharacterStateOverlay: React.FC<CharacterStateOverlayProps> = ({
  characterName,
  emotion,
  growthDirection,
  traitLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrySpring = spring({ frame, fps, config: { damping: 10, stiffness: 100, mass: 0.6 } });
  const scale = interpolate(entrySpring, [0, 1], [0.5, 1]);

  const pulseScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 6, stiffness: 200, mass: 0.4 },
  });
  const arrowScale = interpolate(pulseScale, [0, 1], [0.8, 1.1]);

  const emotionColor = EMOTION_COLORS[emotion] ?? "#9CA3AF";
  const arrowColor = DIRECTION_COLORS[growthDirection] ?? "#6B7280";
  const arrow = DIRECTION_ARROWS[growthDirection] ?? "→";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 12,
        border: `1px solid ${emotionColor}40`,
        transform: `scale(${scale})`,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.9)",
          fontWeight: 600,
        }}
      >
        {characterName}
      </span>

      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: emotionColor,
        }}
      />

      <span
        style={{
          fontSize: 14,
          color: arrowColor,
          transform: `scale(${arrowScale})`,
          fontWeight: 700,
        }}
      >
        {arrow}
      </span>

      {traitLabel && (
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 80,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {traitLabel}
        </span>
      )}
    </div>
  );
};
