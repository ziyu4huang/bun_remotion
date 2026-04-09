# TODO — ClaudeCodeIntro Improvements

Reflection after first voice-enabled render (31.9s, 957 frames, edge-tts en-US-AriaNeural).

---

## Bugs / Regressions

- [ ] **OutroScene fadeout is hardcoded at f95–120** — with dynamic duration (195 frames) the
  scene fades at f95 and plays black for 75+ dead frames. Fix: make fadeout relative to scene end:
  ```tsx
  const { durationInFrames } = useVideoConfig();
  const globalFade = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  ```

- [ ] **TerminalScene idle time** — 15 lines × 12f + 20 offset = 200f of content, but scene is
  340 frames. The blinking cursor holds the rest fine, but consider adding a subtle "pulse"
  glow or progress bar to fill the visual gap.

---

## Visual / Animation

- [ ] **Subtitles / captions overlay** — narration text exists in `scripts/narration.ts` but
  isn't shown visually. Add a lower-third subtitle bar synced to audio start:
  ```tsx
  <Audio src={staticFile(audio)} volume={1} startFrom={0} />
  <SubtitleBar text={narration.text} durationInFrames={d(i)} />
  ```
  Use `interpolate` to fade in at f5 and out at `durationInFrames - 10`.

- [ ] **Scene transitions** — scenes currently hard-cut. Add 15-frame crossfade between scenes
  using `<TransitionSeries>` + `linearTiming` + `fade()`. Subtract overlap from total duration
  in `durations.json` accumulation.

- [ ] **Font loading** — SF Mono / Cascadia Code fall back to generic monospace on machines
  without those fonts installed, causing frame-to-frame inconsistency in render. Load a web
  font explicitly:
  ```tsx
  import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
  const { fontFamily } = loadFont();
  ```
  Requires `bun add @remotion/google-fonts`.

- [ ] **FeaturesScene visual balance** — 4 cards sit in upper 60% of screen; lower portion is
  empty. Options: larger cards, a subtle grid/dot pattern background, or a fifth "why it
  matters" card.

- [ ] **Particle variety in TitleScene** — all particles are the same orange dot. Could use 2–3
  sizes and 2 colors (#D97757, #e8a07a) for more depth without complexity.

---

## Audio

- [ ] **Background music** — add a subtle lo-fi/ambient bed at 15–20% volume underneath
  narration. Place as a top-level `<Audio>` in `ClaudeCodeIntro.tsx` spanning the full
  composition. Remotion mixes audio tracks automatically.

- [ ] **Narration timing** — current narrations don't leave a 1–2s lead-in before audio starts.
  Scenes begin at frame 0, audio begins at frame 0. Add `startFrom` offset or shift the
  `<Audio>` to start at frame 10 to let visuals appear first.

---

## Content

- [ ] **OutroScene install command** — `npm install -g @anthropic-ai/claude-code` may be
  outdated. Verify against current Claude Code docs and update if needed.

- [ ] **TerminalScene prompt** — `> Refactor the auth middleware to use JWT` is generic. Could
  use a more concrete, relatable use-case (e.g., `> Add dark mode to the dashboard`).

- [ ] **FeaturesScene descriptions** — current card text is short. Could animate in a second
  line of supporting detail after each title settles.

---

## Infrastructure

- [ ] **`durations.json` in gitignore?** — currently committed (not gitignored). Committing it
  means the repo builds without regenerating audio, which is convenient. But it becomes stale
  if narration text changes. Decision: keep committed, document in README that regenerating
  audio requires re-running `bun run generate-tts:claude`.

- [ ] **`--skip-existing` vs full regen** — add a `--force` flag to `generate-tts.ts` as an
  alias for a full regeneration (vs `--skip-existing` which is the safe default).

- [ ] **Root `package.json` shortcut** — `bun run generate-tts:claude` cd-changes into the
  subdir. This violates the no-cd rule if run from a shell where CWD matters. Consider using
  `pwsh scripts/dev.ps1` pattern instead for consistency.

---

## Nice to Have

- [ ] **Remotion Studio scrubber labels** — add `<Still>` compositions for each scene so the
  Studio shows a frame thumbnail per scene in the sidebar.

- [ ] **Progressive rendering** — for long videos, pre-render each scene to a `.webm` and
  `<OffthreadVideo>` them in the final composition to speed up re-renders when only one scene
  changes.

- [ ] **`calculateMetadata` type safety** — `Props` is currently defined in `Root.tsx` and
  imported into `ClaudeCodeIntro.tsx`. Move to a shared `types.ts` to decouple them.
