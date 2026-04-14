/**
 * Dialog timing utility — syncs on-screen dialog text with TTS audio.
 *
 * Uses per-segment audio durations (from segment-durations.json) to allocate
 * screen time proportionally. Falls back to equal division when data is missing.
 */

/**
 * Calculate which dialog line should be displayed at the current frame,
 * based on per-segment audio durations.
 *
 * @param frame - current frame in the scene
 * @param durationInFrames - total scene duration in frames
 * @param lineCount - number of dialog lines
 * @param segmentDurationsSec - raw audio durations per segment (seconds),
 *   loaded from segment-durations.json. Undefined = fallback to equal division.
 */
export function getLineIndex(
  frame: number,
  durationInFrames: number,
  lineCount: number,
  segmentDurationsSec: number[] | undefined,
): number {
  if (
    !segmentDurationsSec ||
    segmentDurationsSec.length !== lineCount
  ) {
    // Fallback: equal division
    const lineDuration = durationInFrames / lineCount;
    return Math.min(Math.floor(frame / lineDuration), lineCount - 1);
  }

  // Proportional allocation: each line gets frames proportional to its audio duration
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
