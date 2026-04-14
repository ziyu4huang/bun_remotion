# Narrative Scenes

Core patterns for dialog-driven, galgame, and narrative video scenes.
Read this when building any scene with characters and dialog.

---

## dialog-driven — Core scene architecture

- `dialogLines[]` is the single source of truth — speaking state, effects, SFX all derive from `currentLineIndex`
- **Use proportional timing from `segment-durations.json`** — equal division (`durationInFrames / lines.length`) causes text-audio mismatch when TTS segments have unequal lengths
- `getLineIndex(frame, durationInFrames, lineCount, segDurations)` — shared utility that falls back to equal division when data is missing
- **Never hardcode frames** — derive from line index or proportional offsets
- Define moments by index ranges (e.g., `currentLineIndex >= 12`); ScreenShake wraps bg+chars+dialog, effects are siblings

For full code examples, read `dialog-driven.md`.

## comic-effects — Character reactions

- 10 types: `surprise`, `shock`, `sweat`, `sparkle`, `heart`, `anger`, `dots`, `cry`, `laugh`, `fire`
- One per line via `effect?: ComicEffect` — reserve for punchlines, not every line
- Render: `<ComicEffects effect={currentLine.effect ?? null} side={...} />` — side matches speaker position
- `shake` is handled by CharacterSprite internally, not ComicEffects

For all effect types and component code, read `comic-effects.md`.

## environmental-effects — Scene theming

- Each scene: unique background + one accent color + ambient glow (radial-gradient, opacity 0.1-0.15)
- `SceneIndicator`: name + animated underline (0-200px), fades in 0-15f, holds 15-45f, fades out 45-60f
- Accent color used for indicator, glow, tinting — no two adjacent scenes share background or accent

For atmospheric effect patterns, read `environmental-effects.md`.

## galgame — Visual novel style

- **ALL character images face LEFT**; Remotion flips via `scaleX(-1)` when `side="left"`
- Generate with magenta `#FF00FF` bg, remove with `rembg` — half-body only, `<name>.png` / `<name>-chibi.png`
- `CharacterSprite` props: `character`, `speaking`, `side`, `background` (dims non-speaker to 0.3)
- DialogBox name plate `top = -(fontSize * 0.75 + padding)` — wrong offset = overlap bug
- TTS voice must match gender; `TransitionSeries` from `@remotion/transitions` for scene cuts
- Title minimum: spring scale-in + hook (flash/shake/bloom) + stinger, no dead air

For complete patterns (sprites, dialog boxes, battle effects), read `galgame.md`.

---

## Cross-References

- Related: `../episode-setup/code-quality.md` — extract repeated patterns to assets components
- Related: `../animation/transitions.md` — TransitionSeries for scene-to-scene cuts
- Related: `../media/voiceover.md` — TTS per scene with dynamic duration
