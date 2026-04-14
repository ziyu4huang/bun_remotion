---
name: dialog-audio-sync
description: Proportional dialog timing to sync on-screen text with TTS audio — segment-durations.json + getLineIndex() pattern
type: feedback
---

# Dialog-Audio Sync: Proportional Timing

## Rule

Multi-character dialog scenes MUST use proportional timing from `segment-durations.json`, NOT equal division (`durationInFrames / lines.length`). Single-voice narration scenes (TitleScene, OutroScene) can use equal division as a simplification.

## Why

Equal division gives every line the same display time regardless of audio length. TTS segments vary wildly — a 12-second line and a 4-second line both get 7 seconds. This causes:
- Long audio lines: text changes before audio finishes (viewer hears audio but sees wrong text)
- Short audio lines: audio finishes but text stays displayed (awkward silence with stale subtitle)

Concretely in my-core-is-boss ch1-ep2 ContentScene1: line 3 had 12s audio but only 7.1s display; line 2 had 4.3s audio but 7.1s display. The mismatch was obvious in Studio.

## How to apply

### 1. generate-tts.ts writes segment-durations.json

After generating each segment WAV but **before** `concatenateWavs()` deletes them, measure raw audio seconds:

```typescript
const segDurations: number[] = [];
for (let s = 0; s < segments.length; s++) {
  // ... generate segment to segPath ...
  segDurations.push(wavDurationSec(segPath)); // raw seconds, no padding
  segmentPaths.push(segPath);
}
sceneSegmentDurations[scene] = segDurations;

// After all scenes:
writeFileSync(join(AUDIO_DIR, "segment-durations.json"),
  JSON.stringify(sceneSegmentDurations, null, 2) + "\n");
```

Format: `{ "ContentScene1": [11.76, 6.16, 4.32, 12.0, ...], "ContentScene2": [...] }`

### 2. Shared utility: fixture/components/dialogTiming.ts

```typescript
export function getLineIndex(
  frame: number, durationInFrames: number, lineCount: number,
  segmentDurationsSec: number[] | undefined,
): number {
  if (!segmentDurationsSec || segmentDurationsSec.length !== lineCount) {
    return Math.min(Math.floor(frame / (durationInFrames / lineCount)), lineCount - 1);
  }
  const totalSec = segmentDurationsSec.reduce((a, b) => a + b, 0);
  let cumulativeSec = 0;
  for (let i = 0; i < segmentDurationsSec.length; i++) {
    const nextStart = Math.round(
      ((cumulativeSec + segmentDurationsSec[i]) / totalSec) * durationInFrames,
    );
    if (frame < nextStart) return i;
    cumulativeSec += segmentDurationsSec[i];
  }
  return lineCount - 1;
}
```

### 3. Each scene loads durations at module level

```typescript
import { getLineIndex } from "../../../fixture/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../public/audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene1";
// ...
const currentLineIndex = getLineIndex(
  frame, durationInFrames, dialogLines.length, segmentDurations[SCENE_NAME],
);
```

### 4. Frame offsets for effects also use proportional math

```typescript
// Instead of: (lineIndex / totalLines) * durationInFrames
const rawDurs = segmentDurations[SCENE_NAME];
const totalSec = rawDurs?.reduce((a, b) => a + b, 0) ?? 1;
const targetFrame = rawDurs
  ? Math.round(rawDurs.slice(0, lineIndex).reduce((a, b) => a + b, 0) / totalSec * durationInFrames)
  : (lineIndex / dialogLines.length) * durationInFrames;
```

## When NOT needed

- TitleScene / OutroScene: usually 1-2 narration segments of similar length, no dialog switching
- Single-voice videos with uniform line lengths (e.g., claude-code-intro)

## Files involved

- `fixture/scripts/generate-tts.ts` — writes `segment-durations.json` alongside `durations.json`
- `fixture/components/dialogTiming.ts` — shared `getLineIndex()` utility
- Each `src/scenes/ContentScene*.tsx` — loads durations, calls `getLineIndex()`
- Skill docs updated: `topics/narrative/_topic.md`, `topics/narrative/dialog-driven.md`, `topics/media/voiceover.md`
