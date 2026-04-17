# TODO — My Core Is Boss Ch1-EP1: 首次誤會

> Parent PLAN: [../PLAN.md](../PLAN.md) | Parent TODO: [../TODO.md](../TODO.md) | Episode PLAN: [./PLAN.md](./PLAN.md)

## Verification: Assets & Audio Migration (2026-04-17)

- [ ] Verify images load in Remotion Studio (`setPublicDir("../assets")` → `characters/`, `backgrounds/`)
- [ ] Regenerate TTS audio → .wav in `assets/audio/ch1-ep1/`, JSON in `audio/`
- [ ] Verify `audio/durations.json` loads correctly in Root.tsx
- [ ] Render MP4 and confirm no black frames or missing assets

## Code Review (2026-04-14)

### Done
- [x] Add `normalizeEffects` to `assets/characters.ts` — was imported but not exported
- [x] Fix ScreenShake determinism — replaced `Math.random()` with frame-based noise
- [x] Extract `SceneIndicator` component — `assets/components/SceneIndicator.tsx`
- [x] Fix ComicEffects side mapping — use `CHARACTERS[].position` instead of ternary chains
- [x] Add `name` prop to `TransitionSeries.Sequence` for readable Studio timeline

### Done (2026-04-15 polish pass)
- [x] Different backgrounds per content scene (ContentScene2→sect-interior, ContentScene3→sect-training)
- [x] Effect pacing reduced to ≤50% per scene
- [x] TitleScene system stinger + ambient glow pulse
- [x] OutroScene QuestBadge + UnlockingTeaser system UI

### Deferred (future episodes)
- [ ] Migrate assets components to use `@bun-remotion/shared` as base (8 near-duplicate components)
- [ ] Consolidate type definitions (assets/characters.ts vs shared/types.ts)
- [ ] Character entrance animation when appearing mid-scene (currently abrupt)
- [ ] Narrator dialog styling — make visually distinct from character dialog
- [ ] Add segment-durations.json for proportional dialog timing (currently uses equal division)

## Production
- [ ] Generate TTS audio
- [x] Verify in Remotion Studio (all 5 scenes, timeline labels visible)
- [x] Render MP4 — `out/my-core-is-boss-ch1-ep1.mp4` (171.3 MB, 7078 frames, 3:55)
- [ ] Verify output: no black frames, brightness > 50 on mid-scene frames
