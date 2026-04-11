import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { TitleCard } from "../components/TitleCard";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade out at the end
  const fadeOut = interpolate(frame, [90, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <BackgroundLayer
        gradient="linear-gradient(135deg, #1a0a2e 0%, #2d1b69 40%, #16213e 100%)"
      />
      <TitleCard
        title="青春笑話劇場"
        subtitle="— 校園趣事集 —"
      />

      {/* Decorative floating particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = ((i * 31 + 7) % 100);
        const startY = 100 + ((i * 17) % 20);
        const size = 1.5 + (i % 4);
        const speed = 0.5 + (i % 3) * 0.3;
        const y = startY - (frame * speed) % 120;
        const opacity = interpolate(
          frame,
          [i * 3, i * 3 + 20, i * 3 + 80, i * 3 + 100],
          [0, 0.5, 0.5, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor:
                i % 3 === 0 ? "#C084FC" : i % 3 === 1 ? "#F472B6" : "#60A5FA",
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
