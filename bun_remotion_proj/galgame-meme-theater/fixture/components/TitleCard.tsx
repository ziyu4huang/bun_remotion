import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { notoSansTC } from "../characters";

interface TitleCardProps {
  title: string;
  subtitle?: string;
}

export const TitleCard: React.FC<TitleCardProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();

  // Title entrance
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });
  const titleY = interpolate(frame, [20, 50], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });
  const titleScale = interpolate(frame, [20, 50], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });

  // Subtitle entrance
  const subOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [40, 70], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative line
  const lineWidth = interpolate(frame, [30, 60], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: notoSansTC,
      }}
    >
      {/* Decorative top line */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background: "linear-gradient(90deg, transparent, #F472B6, #818CF8, transparent)",
          marginBottom: 30,
          opacity: titleOpacity,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: "#F3E8FF",
          textShadow: "0 0 40px rgba(244, 114, 182, 0.5), 0 4px 12px rgba(0,0,0,0.6)",
          letterSpacing: "0.12em",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
        }}
      >
        {title}
      </div>

      {/* Decorative bottom line */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background: "linear-gradient(90deg, transparent, #818CF8, #F472B6, transparent)",
          marginTop: 24,
          marginBottom: 24,
          opacity: titleOpacity,
        }}
      />

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: 28,
            color: "rgba(228, 220, 240, 0.7)",
            letterSpacing: "0.08em",
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
