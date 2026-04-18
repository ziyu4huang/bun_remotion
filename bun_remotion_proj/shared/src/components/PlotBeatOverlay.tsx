import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { notoSansTC } from "../fonts";

interface PlotBeatOverlayProps {
  beats: Array<{ beat_type: string; tension: number; label: string }>;
  currentBeatIndex: number;
  totalBeats: number;
}

const BEAT_COLORS: Record<string, string> = {
  inciting_incident: "#3B82F6",
  rising_action: "#6366F1",
  climax: "#EF4444",
  falling_action: "#10B981",
  resolution: "#6B7280",
};

const BEAT_LABELS: Record<string, string> = {
  inciting_incident: "起",
  rising_action: "升",
  climax: "高潮",
  falling_action: "降",
  resolution: "結",
};

export const PlotBeatOverlay: React.FC<PlotBeatOverlayProps> = ({
  beats,
  currentBeatIndex,
  totalBeats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (beats.length === 0) return null;

  const barWidth = 600;
  const barHeight = 6;
  const sectionWidth = barWidth / beats.length;

  const pulse = currentBeatIndex >= 0 && currentBeatIndex < beats.length
    ? spring({ frame, fps, config: { damping: 8, stiffness: 200, mass: 0.5 } })
    : 0;
  const pulseScale = interpolate(pulse, [0, 1], [1, 1.3]);

  const overallProgress = totalBeats > 0 ? (currentBeatIndex + 1) / totalBeats : 0;
  const progressWidth = interpolate(frame, [0, 30], [0, barWidth * overallProgress], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 30,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        fontFamily: notoSansTC,
      }}
    >
      <div style={{ display: "flex", position: "relative" }}>
        {beats.map((beat, i) => {
          const isCurrent = i === currentBeatIndex;
          const isPast = i < currentBeatIndex;
          const color = BEAT_COLORS[beat.beat_type] ?? "#6B7280";
          const opacity = isCurrent ? 1 : isPast ? 0.6 : 0.3;

          return (
            <div
              key={i}
              style={{
                width: sectionWidth,
                height: barHeight * (isCurrent ? pulseScale : 1),
                backgroundColor: color,
                opacity,
                borderRadius: 2,
                transition: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "white",
                  opacity: isCurrent ? 1 : 0.7,
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                {BEAT_LABELS[beat.beat_type] ?? "?"}
              </span>
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: progressWidth,
            height: barHeight,
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        />
      </div>

      {currentBeatIndex >= 0 && currentBeatIndex < beats.length && (
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.7)",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {beats[currentBeatIndex].label}
        </span>
      )}
    </div>
  );
};
