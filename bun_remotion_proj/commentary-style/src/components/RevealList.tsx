import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface RevealItem {
  content: React.ReactNode;
  /** Stagger delay in frames from previous item */
  delayFrames?: number;
}

interface RevealListProps {
  items: RevealItem[];
  /** Initial delay before first item appears (frames) */
  startDelay?: number;
  /** Slide direction for each item */
  direction?: "up" | "left" | "right";
}

/**
 * Staggered reveal list — each item fades and slides in one after another.
 * Used for overlay card content that should appear line-by-line.
 */
export const RevealList: React.FC<RevealListProps> = ({
  items,
  startDelay = 0,
  direction = "up",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate cumulative delay for each item
  let cumDelay = startDelay;
  const delays = items.map((item) => {
    const d = cumDelay;
    cumDelay += item.delayFrames ?? 12;
    return d;
  });

  return (
    <div>
      {items.map((item, i) => {
        const progress = spring({
          frame: frame - delays[i],
          fps,
          config: { damping: 20, stiffness: 180 },
        });

        const offsets: Record<string, [number, number]> = {
          up: [30, 0],
          left: [0, 40],
          right: [0, -40],
        };
        const [yOff, xOff] = offsets[direction];

        return (
          <div
            key={i}
            style={{
              opacity: interpolate(progress, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(progress, [0, 1], [yOff, 0])}px) translateX(${interpolate(progress, [0, 1], [xOff, 0])}px)`,
            }}
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
};
