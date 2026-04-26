# TODO — My Core Is Boss (我的核心是大大佬)

> Series PLAN: [./PLAN.md](./PLAN.md)

## Phase 1: Foundation ✅

- [x] PLAN.md — story, characters, emotions, project structure
- [x] Character JSON manifests (22 emotion configs)
- [x] Background JSON manifests (14 scene configs)
- [x] Character images (22 PNGs, 1:1, 2K, transparent BG via rembg)
- [x] Background images (14 PNGs, 16:9, 2K)
- [x] Assets shared components (characters.ts, BackgroundLayer, CharacterSprite, DialogBox, ComicEffects, MangaSfx, SystemOverlay, GameUI, ScreenShake)
- [x] sync-images.sh script (no-op — images served via setPublicDir)
- [x] generate-tts.ts script (shared, multi-voice)
- [x] voice-config.json (centralized per-engine voice mapping)
- [x] Migration: public/ → assets/ + audio/ (setPublicDir pattern)

## Phase 2: Ch1 — 系統覺醒 ✅

### Ch1-EP1 — 首次誤會 (Rendered: 163M, 3:55)

> Episode PLAN: [./my-core-is-boss-ch1-ep1/PLAN.md](./my-core-is-boss-ch1-ep1/PLAN.md) | Episode TODO: [./my-core-is-boss-ch1-ep1/TODO.md](./my-core-is-boss-ch1-ep1/TODO.md)

- [x] Scaffold + all scenes + main component + TransitionSeries
- [x] Code review — normalizeEffects, ScreenShake, SceneIndicator, side mapping, name props
- [x] Episode-polish pass — effect pacing ≤50%, background variety, TitleScene stinger, OutroScene QuestBadge
- [x] TTS audio generated + migrated to per-episode audio/ dir
- [x] Rendered MP4 — out/my-core-is-boss-ch1-ep1.mp4 (163M, 7078 frames, 3:55)

### Ch1-EP2 — 任務跳過 (Rendered: 149M, 3:43)

> Episode PLAN: [./my-core-is-boss-ch1-ep2/PLAN.md](./my-core-is-boss-ch1-ep2/PLAN.md) | Episode TODO: [./my-core-is-boss-ch1-ep2/TODO.md](./my-core-is-boss-ch1-ep2/TODO.md)

- [x] Scaffold + all scenes + main component + TransitionSeries
- [x] Shared dialogTiming.ts utility (proportional dialog-audio sync)
- [x] Episode-polish pass
- [x] TTS audio generated + migrated to per-episode audio/ dir
- [x] Rendered MP4 — out/my-core-is-boss-ch1-ep2.mp4 (149M, 6715 frames, 3:43)

### Ch1-EP3 — Bug 利用 (Rendered: 161M, 3:57)

> Episode PLAN: [./my-core-is-boss-ch1-ep3/PLAN.md](./my-core-is-boss-ch1-ep3/PLAN.md) | Episode TODO: [./my-core-is-boss-ch1-ep3/TODO.md](./my-core-is-boss-ch1-ep3/TODO.md)

- [x] Scaffold + all scenes + main component + TransitionSeries
- [x] Episode-polish improvements (ContentScene3: effects 87.5%→50%, background→sect-interior)
- [x] TTS audio generated
- [x] Rendered MP4 — out/my-core-is-boss-ch1-ep3.mp4 (161M, 7167 frames, 3:57)

## Phase 3: Ch2-EP1 — 掛機修仙 ✅

> Episode PLAN: [./my-core-is-boss-ch2-ep1/PLAN.md](./my-core-is-boss-ch2-ep1/PLAN.md) | Episode TODO: [./my-core-is-boss-ch2-ep1/TODO.md](./my-core-is-boss-ch2-ep1/TODO.md)

- [x] Write narration.ts + episode PLAN.md (graphify gate passed, v2 revised)
- [x] Scaffold + all scenes + main component + TransitionSeries
- [x] TTS audio generated
- [x] Verified in Remotion Studio
- [x] Rendered MP4 — out/my-core-is-boss-ch2-ep1.mp4 (181M, 8624 frames, 4:47)

## Phase 3b: Ch2-EP2 — 經驗值農場

> Episode PLAN: [./my-core-is-boss-ch2-ep2/PLAN.md](./my-core-is-boss-ch2-ep2/PLAN.md) | Episode TODO: [./my-core-is-boss-ch2-ep2/TODO.md](./my-core-is-boss-ch2-ep2/TODO.md)

- [x] Write narration.ts + episode PLAN.md (graphify gate passed: PROCEED)
- [x] Scaffold + all scenes + main component + TransitionSeries
- [x] TTS audio generated
- [x] Verified in Remotion Studio
- [x] Rendered MP4 — out/my-core-is-boss-ch2-ep2.mp4 (199M, 9572 frames, 5:19)

## Phase 4: Remaining Ch2 Episodes

- [ ] Ch2-EP3 — 技能點分配 (linyi, zhaoxiaoqi, xiaoelder)

## Phase 5: Ch3 — 秘境速通

### Ch3-EP1 — 速通記錄

> Episode PLAN: [./my-core-is-boss-ch3-ep1/PLAN.md](./my-core-is-boss-ch3-ep1/PLAN.md) | Episode TODO: [./my-core-is-boss-ch3-ep1/TODO.md](./my-core-is-boss-ch3-ep1/TODO.md)

- [x] Write narration.ts + episode PLAN.md (graphify gate passed: PROCEED)
- [x] Scaffold + all scenes + main component + TransitionSeries
- [x] TTS audio generated
- [x] Rendered MP4 — out/my-core-is-boss-ch3-ep1.mp4 (152M, 10841 frames, 6:01)

## Phase 6: Remaining Ch3 Episodes

- [ ] Ch3-EP2 — 隱藏關卡 (linyi, zhaoxiaoqi, xiaoelder)
- [ ] Ch3-EP3 — 秘境 BOSS (linyi, zhaoxiaoqi, xiaoelder)
- [ ] Ch4 (4 ep) — 副本開團
- [ ] Ch5–Ch10 (remaining 22 episodes)

## Deferred (cross-episode improvements)

- [ ] Migrate assets components to use `@bun-remotion/shared` as base (8 near-duplicate components)
- [ ] Consolidate type definitions (assets/characters.ts vs shared/types.ts)
- [ ] Character entrance animation when appearing mid-scene (currently abrupt)
- [ ] Narrator dialog styling — make visually distinct from character dialog
