import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { CharacterAvatar, type CharacterEmotion, type EmotionChange } from "../components/CharacterAvatar";
import { SlideOverlay } from "../components/SlideOverlay";
import { EmphasisText } from "../components/EmphasisText";
import { ScreenShake } from "../components/ScreenShake";
import { SubtitleBar } from "../components/SubtitleBar";

interface EmphasisMoment {
  text: string;
  /** When to show (0-1 fraction of scene duration) */
  at: number;
  color?: string;
}

interface PointSceneProps {
  number: number;
  title: string;
  overlayContent: React.ReactNode;
  subtitle: string;
  colorFrom: string;
  colorTo: string;
  accentColor: string;
  emotion?: CharacterEmotion;
  emotionTimeline?: EmotionChange[];
  emphasisMoments?: EmphasisMoment[];
  /** Frame offset to trigger screen shake */
  shakeAt?: number;
  shakeIntensity?: number;
  /** Words per second for subtitle reveal */
  wordsPerSecond?: number;
  /** Overlay slide direction */
  overlayDirection?: "right" | "left" | "bottom";
}

export const PointScene: React.FC<PointSceneProps> = ({
  number,
  title,
  overlayContent,
  subtitle,
  colorFrom,
  colorTo,
  accentColor,
  emotion = "neutral",
  emotionTimeline,
  emphasisMoments = [],
  shakeAt,
  shakeIntensity = 10,
  wordsPerSecond = 3.5,
  overlayDirection = "right",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene fade in/out
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const sceneOpacity = Math.min(fadeIn, fadeOut);

  // Big number entrance
  const numberProgress = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const numberScale = interpolate(numberProgress, [0, 1], [0.2, 1]);

  // Title entrance
  const titleProgress = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const titleX = interpolate(titleProgress, [0, 1], [-80, 0]);

  // Number glow pulse
  const numberGlow = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.08, 0.2]);

  // Overlay position based on direction
  const overlayStyle: React.CSSProperties =
    overlayDirection === "left"
      ? { position: "absolute" as const, top: 280, left: 430, width: 700 }
      : overlayDirection === "bottom"
        ? { position: "absolute" as const, bottom: 140, left: 430, right: 60 }
        : { position: "absolute" as const, top: 280, right: 60, width: 700 };

  const content = (
    <div style={{ position: "absolute", inset: 0, opacity: sceneOpacity }}>
      <AnimatedBackground colorFrom={colorFrom} colorTo={colorTo} accentColor={accentColor} />

      <CharacterAvatar emotion={emotion} emotionTimeline={emotionTimeline} />

      {/* Big number watermark */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 430,
          fontSize: 220,
          fontWeight: 900,
          color: accentColor,
          lineHeight: 1,
          transform: `scale(${numberScale})`,
          opacity: numberGlow,
          fontFamily: "sans-serif",
          userSelect: "none",
        }}
      >
        #{number}
      </div>

      {/* Point title */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 430,
          maxWidth: 750,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "white",
            transform: `translateX(${titleX}px)`,
            opacity: titleProgress,
            textShadow: "0 3px 15px rgba(0,0,0,0.5)",
            fontFamily: "sans-serif",
            lineHeight: 1.3,
          }}
        >
          {title.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Overlay card */}
      <div style={overlayStyle}>
        <SlideOverlay delay={20} direction={overlayDirection} accentColor={accentColor}>
          {overlayContent}
        </SlideOverlay>
      </div>

      {/* Emphasis text pop-ups */}
      {emphasisMoments.map((moment, i) => {
        const triggerFrame = Math.floor(moment.at * durationInFrames);
        return (
          <EmphasisText
            key={i}
            text={moment.text}
            delay={triggerFrame}
            color={moment.color || accentColor}
            fontSize={60}
          />
        );
      })}

      <SubtitleBar text={subtitle} wordsPerSecond={wordsPerSecond} />
    </div>
  );

  // Wrap with screen shake if configured
  if (shakeAt !== undefined) {
    return (
      <ScreenShake startFrame={shakeAt} duration={25} intensity={shakeIntensity}>
        {content}
      </ScreenShake>
    );
  }

  return content;
};
