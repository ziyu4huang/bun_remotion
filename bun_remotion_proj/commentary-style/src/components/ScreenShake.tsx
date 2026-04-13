import React from "react";
import { useCurrentFrame } from "remotion";
import { interpolate } from "remotion";

interface ScreenShakeProps {
  children: React.ReactNode;
  /** Frame offset when the shake starts (relative to parent) */
  startFrame?: number;
  /** Duration of the shake in frames */
  duration?: number;
  /** Maximum pixel displacement */
  intensity?: number;
}

/**
 * Camera shake effect. Triggers at startFrame and decays exponentially.
 */
export const ScreenShake: React.FC<ScreenShakeProps> = ({
  children,
  startFrame = 0,
  duration = 30,
  intensity = 12,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  // Not active yet or already done
  if (localFrame < 0 || localFrame > duration) return <>{children}</>;

  // Exponential decay envelope
  const envelope = Math.exp(-localFrame * 0.15);

  const shakeX = Math.sin(localFrame * 1.5) * intensity * envelope;
  const shakeY = Math.cos(localFrame * 1.8) * intensity * envelope;
  const rotate = Math.sin(localFrame * 0.7) * 0.5 * envelope;

  return (
    <div
      style={{
        transform: `translate(${shakeX}px, ${shakeY}px) rotate(${rotate}deg)`,
      }}
    >
      {children}
    </div>
  );
};
