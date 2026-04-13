import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export type CharacterEmotion = "neutral" | "angry" | "shocked" | "happy" | "smug";

export interface EmotionChange {
  emotion: CharacterEmotion;
  /** When to switch to this emotion (0-1 fraction of scene duration) */
  at: number;
}

interface CharacterAvatarProps {
  emotion?: CharacterEmotion;
  /** Timeline of emotion changes. If provided, overrides static `emotion`. */
  emotionTimeline?: EmotionChange[];
}

/**
 * Animated programmer character avatar with breathing, head bob, and emotion states.
 * Supports both static emotion and emotion timeline for mid-scene changes.
 */
export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  emotion = "neutral",
  emotionTimeline,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Determine current emotion (from timeline or static)
  let currentEmotion = emotion;
  if (emotionTimeline && emotionTimeline.length > 0) {
    const progress = frame / durationInFrames;
    // Find the last emotion change that has occurred
    for (let i = emotionTimeline.length - 1; i >= 0; i--) {
      if (progress >= emotionTimeline[i].at) {
        currentEmotion = emotionTimeline[i].emotion;
        break;
      }
    }
  }

  // Breathing scale
  const breathe = interpolate(Math.sin(frame / 10), [-1, 1], [1, 1.015]);

  // Head bob while "talking"
  const headBob = interpolate(Math.sin(frame / 6), [-1, 1], [-2, 2]);

  // Emotion transition spring
  const emotionSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  // Eyebrow angles per emotion
  const eyebrowAngles: Record<CharacterEmotion, { left: number; right: number }> = {
    neutral: { left: -3, right: 3 },
    angry: { left: 12, right: -12 },
    shocked: { left: -10, right: 10 },
    happy: { left: -6, right: 6 },
    smug: { left: -4, right: 8 },
  };

  const brows = eyebrowAngles[currentEmotion];

  // Mouth paths per emotion
  const mouths: Record<CharacterEmotion, string> = {
    neutral: "M135 220 Q160 242 185 220",
    angry: "M138 225 Q160 215 182 225",
    shocked: "M148 218 Q160 240 172 218",
    happy: "M130 218 Q160 252 190 218",
    smug: "M140 220 Q165 235 188 218",
  };

  // Eye sizes per emotion
  const eyeScale: Record<CharacterEmotion, number> = {
    neutral: 1,
    angry: 0.85,
    shocked: 1.3,
    happy: 0.9,
    smug: 0.95,
  };

  const eyeR = 7 * eyeScale[currentEmotion];

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 60,
        transform: `scale(${breathe})`,
        transformOrigin: "bottom center",
        filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))",
      }}
    >
      <svg width={320} height={440} viewBox="0 0 320 440" fill="none">
        {/* Shadow base */}
        <ellipse cx={160} cy={430} rx={110} ry={12} fill="rgba(0,0,0,0.25)" />

        {/* Body */}
        <path
          d="M60 440 L60 340 Q60 270 160 270 Q260 270 260 340 L260 440 Z"
          fill="#2d3748"
        />
        <path d="M120 275 L160 310 L200 275" stroke="#4a5568" strokeWidth={3} strokeLinecap="round" fill="none" />

        {/* Neck */}
        <rect x={135} y={230} width={50} height={50} rx={8} fill="#e8c4a0" />

        {/* Head group — head bob */}
        <g transform={`translate(0, ${headBob})`}>
          <circle cx={160} cy={160} r={100} fill="#e8c4a0" />

          {/* Hair */}
          <path
            d="M60 160 Q60 60 160 60 Q260 60 260 160 Q260 120 220 105 Q180 90 160 95 Q140 90 100 105 Q60 120 60 160 Z"
            fill="#1a1a2e"
          />
          <path d="M62 160 Q55 180 62 210" stroke="#1a1a2e" strokeWidth={12} strokeLinecap="round" fill="none" />
          <path d="M258 160 Q265 180 258 210" stroke="#1a1a2e" strokeWidth={12} strokeLinecap="round" fill="none" />

          {/* Ears */}
          <ellipse cx={60} cy={170} rx={12} ry={18} fill="#d4a882" />
          <ellipse cx={260} cy={170} rx={12} ry={18} fill="#d4a882" />

          {/* Glasses */}
          <rect x={90} y={148} width={58} height={38} rx={6} fill="none" stroke="#718096" strokeWidth={3.5} />
          <rect x={172} y={148} width={58} height={38} rx={6} fill="none" stroke="#718096" strokeWidth={3.5} />
          <line x1={148} y1={167} x2={172} y2={167} stroke="#718096" strokeWidth={3.5} />
          <line x1={90} y1={162} x2={62} y2={158} stroke="#718096" strokeWidth={3} />
          <line x1={230} y1={162} x2={258} y2={158} stroke="#718096" strokeWidth={3} />

          {/* Eyes (scale by emotion) */}
          <circle cx={119} cy={168} r={eyeR} fill="#1a1a2e" />
          <circle cx={201} cy={168} r={eyeR} fill="#1a1a2e" />
          <circle cx={119 + 3} cy={168 - 3} r={2.5 * eyeScale[currentEmotion]} fill="white" />
          <circle cx={201 + 3} cy={168 - 3} r={2.5 * eyeScale[currentEmotion]} fill="white" />

          {/* Shocked: sweat drop */}
          {currentEmotion === "shocked" && (
            <ellipse cx={245} cy={145} rx={5} ry={8} fill="#7dd3fc" opacity={0.7} />
          )}

          {/* Eyebrows (rotate by emotion) */}
          <line
            x1={98} y1={140}
            x2={140} y2={140}
            stroke="#1a1a2e"
            strokeWidth={3.5}
            strokeLinecap="round"
            transform={`rotate(${brows.left}, 119, 140)`}
          />
          <line
            x1={180} y1={140}
            x2={222} y2={140}
            stroke="#1a1a2e"
            strokeWidth={3.5}
            strokeLinecap="round"
            transform={`rotate(${brows.right}, 201, 140)`}
          />

          {/* Nose */}
          <path d="M155 180 Q152 200 148 205 Q155 210 162 205 Q158 200 160 180" fill="#d4a882" />

          {/* Mouth (per emotion) */}
          <path
            d={mouths[emotion]}
            fill="none"
            stroke="#c4956a"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Angry: forehead vein */}
          {currentEmotion === "angry" && (
            <>
              <path d="M140 100 L145 90 L150 100" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" fill="none" />
              <path d="M147 95 L152 85 L157 95" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" fill="none" />
            </>
          )}

          {/* Happy: blush */}
          {currentEmotion === "happy" && (
            <>
              <ellipse cx={85} cy={195} rx={18} ry={8} fill="#f87171" opacity={0.25} />
              <ellipse cx={235} cy={195} rx={18} ry={8} fill="#f87171" opacity={0.25} />
            </>
          )}

          {/* Stubble hint */}
          {currentEmotion === "neutral" || currentEmotion === "smug" ? (
            <>
              <circle cx={140} cy={228} r={0.8} fill="#1a1a2e" opacity={0.15} />
              <circle cx={150} cy={232} r={0.8} fill="#1a1a2e" opacity={0.15} />
              <circle cx={160} cy={233} r={0.8} fill="#1a1a2e" opacity={0.15} />
              <circle cx={170} cy={232} r={0.8} fill="#1a1a2e" opacity={0.15} />
              <circle cx={180} cy={228} r={0.8} fill="#1a1a2e" opacity={0.15} />
            </>
          ) : null}
        </g>
      </svg>
    </div>
  );
};
