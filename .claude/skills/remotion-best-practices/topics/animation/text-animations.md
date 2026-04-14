---
name: text-animations
description: Typography and text animation patterns for Remotion — typewriter, highlight, fade
metadata:
  tags: typography, text, typewriter, highlight, animation, string-slicing
---

# Text Animations

All text animations MUST be driven by `useCurrentFrame()`. CSS transitions, CSS animations, and Tailwind animation classes are FORBIDDEN — they will not render correctly in Remotion's canvas compositor.

---

## Typewriter Effect

The most common text animation. Display text character-by-character using **string slicing** (not per-character opacity).

```tsx
import { useCurrentFrame, interpolate } from "remotion";

const TypewriterText: React.FC<{ text: string; frame: number; charsPerFrame?: number; fontSize?: number }> = ({
  text,
  frame,
  charsPerFrame = 2.5,  // ~2.5 for Chinese, ~4 for English
  fontSize = 42,
}) => {
  const totalChars = text.length;
  const charsToShow = Math.min(Math.floor(frame * charsPerFrame), totalChars);
  const displayText = text.slice(0, charsToShow);
  const isComplete = charsToShow >= totalChars;

  // Blinking cursor when typing is complete
  const cursorVisible = isComplete
    ? Math.floor(frame / 15) % 2 === 0  // blink every 0.5s
    : true;  // always visible while typing

  return (
    <div style={{ fontSize, lineHeight: 1.8 }}>
      {displayText}
      {cursorVisible && (
        <span style={{
          display: "inline-block",
          width: 2,
          height: fontSize,
          backgroundColor: "currentColor",
          marginLeft: 2,
          verticalAlign: "middle",
        }} />
      )}
    </div>
  );
};
```

### Speed Guidelines

| Language | Chars per frame (30fps) | Characters per second |
|----------|------------------------|----------------------|
| Chinese (zh-TW) | 2.5 | ~75 chars/s |
| English | 4 | ~120 chars/s |

### With Pause After Sentence

Pause briefly at sentence endings (。！？. ! ?) before continuing:

```tsx
// Calculate display text with sentence pause
const getDisplayText = (text: string, frame: number, speed: number): string => {
  let charCount = 0;
  for (let i = 0; i < text.length; i++) {
    const framesNeeded = charCount / speed;
    // Add 10-frame pause after sentence-ending punctuation
    const pauseFrames = "。！？.!?".includes(text[i - 1]) ? 10 : 0;
    if (frame < framesNeeded + pauseFrames) break;
    charCount = i + 1;
  }
  return text.slice(0, charCount);
};
```

---

## Word Highlighting

See [Word Highlight](./text-animations-word-highlight.tsx) for an animated highlighter-pen effect on specific words.

---

## Fade In/Out Text

```tsx
const opacity = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

<div style={{ opacity }}>{text}</div>
```

---

## Scale-In Text (Title)

```tsx
import { spring, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

const titleScale = interpolate(frame, [10, 40], [2.5, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.back(0.3)),
});

const titleOpacity = interpolate(frame, [10, 20], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

<div style={{
  transform: `scale(${titleScale})`,
  opacity: titleOpacity,
  fontSize: 80,
  fontWeight: 900,
}}>
  {title}
</div>
```

---

## Slide-In Text (Subtitle)

```tsx
const subtitleY = interpolate(frame, [30, 50], [30, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});

<div style={{
  transform: `translateY(${subtitleY}px)`,
  opacity: interpolate(frame, [30, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
}}>
  {subtitle}
</div>
```

---

## Rules

- **Always use string slicing** for typewriter — never per-character `<span>` with individual opacity
- **Speed must match language** — Chinese is slower than English
- **Add cursor blinking** when typing completes — shows the animation is done
- **Sentence pause** makes the typewriter feel more natural
- **No CSS animations** — `animation`, `transition`, Tailwind `animate-*` all fail in canvas render
