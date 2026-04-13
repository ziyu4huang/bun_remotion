import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Circle, Star, Triangle } from "@remotion/shapes";

interface FloatingShapesProps {
  accentColor?: string;
}

/**
 * Lightweight floating shapes — reduced from 10 to 5 shapes.
 * Uses simple div circles instead of @remotion/shapes for most,
 * keeping only 2 star shapes for visual variety.
 */
export const FloatingShapes: React.FC<FloatingShapesProps> = ({
  accentColor = "rgba(0, 212, 255, 0.3)",
}) => {
  const frame = useCurrentFrame();

  // Simple circle divs — much cheaper than SVG shape components
  const circles = [
    { x: 150, y: 120, size: 25, speed: 0.4, opacity: 0.06 },
    { x: 1650, y: 900, size: 35, speed: 0.45, opacity: 0.04 },
    { x: 500, y: 800, size: 20, speed: 0.5, opacity: 0.04 },
    { x: 1100, y: 700, size: 22, speed: 0.42, opacity: 0.05 },
    { x: 900, y: 60, size: 18, speed: 0.55, opacity: 0.05 },
  ];

  // Only 2 SVG stars for visual variety
  const stars = [
    { x: 350, y: 80, size: 20, speed: 0.6, opacity: 0.05 },
    { x: 1400, y: 200, size: 15, speed: 0.65, opacity: 0.05 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* Cheap circle divs */}
      {circles.map((c, i) => {
        const yOffset = interpolate(
          Math.sin(frame * c.speed * 0.02 + i * 1.3),
          [-1, 1],
          [-20, 20],
        );
        const xOffset = interpolate(
          Math.cos(frame * c.speed * 0.015 + i * 0.9),
          [-1, 1],
          [-15, 15],
        );
        return (
          <div
            key={`c${i}`}
            style={{
              position: "absolute",
              left: c.x + xOffset,
              top: c.y + yOffset,
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              backgroundColor: accentColor,
              opacity: c.opacity,
            }}
          />
        );
      })}

      {/* Only 2 SVG stars */}
      {stars.map((s, i) => {
        const yOffset = interpolate(
          Math.sin(frame * s.speed * 0.02 + i * 2),
          [-1, 1],
          [-15, 15],
        );
        const rot = frame * 0.4 + i * 30;
        return (
          <Star
            key={`s${i}`}
            points={5}
            outerRadius={s.size}
            innerRadius={s.size * 0.4}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y + yOffset,
              opacity: s.opacity,
              transform: `rotate(${rot}deg)`,
            }}
            pathStyle={{ fill: accentColor }}
          />
        );
      })}
    </div>
  );
};
