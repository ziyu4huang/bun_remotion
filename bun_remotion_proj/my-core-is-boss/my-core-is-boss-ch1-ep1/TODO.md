# TODO — My Core Is Boss Ch1-EP1: 首次誤會

## Code Review (2026-04-14)

### Done
- [x] Add `normalizeEffects` to `assets/characters.ts` — was imported but not exported
- [x] Fix ScreenShake determinism — replaced `Math.random()` with frame-based noise
- [x] Extract `SceneIndicator` component — `assets/components/SceneIndicator.tsx`
- [x] Fix ComicEffects side mapping — use `CHARACTERS[].position` instead of ternary chains
- [x] Add `name` prop to `TransitionSeries.Sequence` for readable Studio timeline

### Deferred (future episodes)
- [ ] Migrate assets components to use `@bun-remotion/shared` as base (8 near-duplicate components)
- [ ] Consolidate type definitions (assets/characters.ts vs shared/types.ts)
- [ ] Different backgrounds per content scene (all 3 use `sect-plaza.png`)
- [ ] Character entrance animation when appearing mid-scene (currently abrupt)
- [ ] Narrator dialog styling — make visually distinct from character dialog

## Production
- [ ] Generate TTS audio
- [ ] Verify in Remotion Studio (all 5 scenes, timeline labels visible)
- [ ] Render MP4 — `bun run build:my-core-is-boss-ch1-ep1`
- [ ] Verify output: no black frames, brightness > 50 on mid-scene frames
