import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { notoSansTC } from "../characters";

interface SceneIndicatorProps {
  text: string;
  color: string;
}

/**
 * Scene indicator that fades in/out at the start of a scene
 * with an animated underline expanding from left to right.
 */
export const SceneIndicator: React.FC<SceneIndicatorProps> = ({ text, color }) => {
  const frame = useCurrentFrame();

  const opacity = frame < 60
    ? interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  if (opacity <= 0) return null;

  return (
    <div style={{
      position: "absolute",
      top: 40,
      left: 60,
      opacity,
      zIndex: 50,
      fontFamily: notoSansTC,
    }}>
      <div style={{ color, fontSize: 24, fontWeight: 700 }}>
        {text}
      </div>
      <div style={{
        width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        marginTop: 4,
      }} />
    </div>
  );
};
