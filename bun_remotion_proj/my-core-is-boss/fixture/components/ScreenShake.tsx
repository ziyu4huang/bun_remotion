import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * ScreenShake — wraps children and applies noise-based screen shake.
 * CRITICAL: When delay is undefined, must return children unwrapped
 * (not with NaN offset) to avoid permanent black frames in render.
 */

interface ScreenShakeProps {
  children: React.ReactNode;
  delay?: number;
  intensity?: number;
  duration?: number;
}

export const ScreenShake: React.FC<ScreenShakeProps> = ({
  children,
  delay,
  intensity = 15,
  duration = 20,
}) => {
  const frame = useCurrentFrame();

  // Handle undefined delay explicitly — no shake
  if (delay === undefined) {
    return <>{children}</>;
  }

  const elapsed = frame - delay;
  if (elapsed < 0 || elapsed > duration) {
    return <>{children}</>;
  }

  // Decay shake over duration
  const decay = 1 - elapsed / duration;
  const shakeX = (Math.random() - 0.5) * 2 * intensity * decay;
  const shakeY = (Math.random() - 0.5) * 2 * intensity * decay;

  return (
    <div
      style={{
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {children}
    </div>
  );
};
