# TODO — My Core Is Boss (我的核心是大佬)

> Series PLAN: [./PLAN.md](./PLAN.md)

## Phase 1: Foundation

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

## Phase 2: Ch1-EP1 — 首次誤會

> Episode PLAN: [./my-core-is-boss-ch1-ep1/PLAN.md](./my-core-is-boss-ch1-ep1/PLAN.md) | Episode TODO: [./my-core-is-boss-ch1-ep1/TODO.md](./my-core-is-boss-ch1-ep1/TODO.md)

- [x] Write narration.ts (dialog + voice map + emotion per line)
- [x] Scaffold my-core-is-boss-ch1-ep1/ (package.json, tsconfig, index.ts, Root.tsx)
- [x] TitleScene.tsx
- [x] ContentScene1.tsx (sect-plaza: linyi arrives, sees game UI)
- [x] ContentScene2.tsx (sect-interior: zhaoxiaoqi writes first quote)
- [x] ContentScene3.tsx (sect-training: xiaoelder confrontation)
- [x] OutroScene.tsx (credits + ch1-ep2 teaser)
- [x] MyCoreIsBossCh1Ep1.tsx (main + TransitionSeries)
- [x] Update scripts/dev.sh (ALL_APPS + get_comp_id)
- [x] Update root package.json (start/build/generate-tts scripts)
- [x] Run `bun install` to link workspace
- [x] Code review — normalizeEffects, ScreenShake, SceneIndicator, side mapping, name props
- [x] Episode-polish pass — effect pacing ≤50%, background variety, TitleScene system stinger, OutroScene QuestBadge
- [x] Render MP4 — `out/my-core-is-boss-ch1-ep1.mp4` (171.3 MB, 7078 frames, 3:55)
- [ ] Verify migration: images load via setPublicDir("../assets")
- [ ] Regenerate TTS audio → per-episode audio/ dir
- [ ] Re-render MP4 post-migration

## Phase 2.5: Ch1-EP2 — 任務跳過

> Episode PLAN: [./my-core-is-boss-ch1-ep2/PLAN.md](./my-core-is-boss-ch1-ep2/PLAN.md) | Episode TODO: [./my-core-is-boss-ch1-ep2/TODO.md](./my-core-is-boss-ch1-ep2/TODO.md)

- [x] Write narration.ts (5 scenes: Title, Content1-3, Outro)
- [x] Scaffold my-core-is-boss-ch1-ep2/
- [x] All scenes + main component + TransitionSeries
- [x] Update scripts/dev.sh + root package.json
- [x] Run `bun install` to link workspace
- [x] Generate TTS audio (durations.json + segment-durations.json + voice-manifest.json)
- [x] Shared dialogTiming.ts utility (proportional dialog-audio sync)
- [x] Episode-polish pass
- [x] Render MP4 — `out/my-core-is-boss-ch1-ep2.mp4` (155.9 MB, 6715 frames, 3:43)
- [ ] Verify migration: images load via setPublicDir("../assets")
- [ ] Regenerate TTS audio → per-episode audio/ dir
- [ ] Re-render MP4 post-migration

## Phase 2.75: Ch1-EP3 — Bug 利用

> Episode PLAN: [./my-core-is-boss-ch1-ep3/PLAN.md](./my-core-is-boss-ch1-ep3/PLAN.md) | Episode TODO: [./my-core-is-boss-ch1-ep3/TODO.md](./my-core-is-boss-ch1-ep3/TODO.md)

- [x] Write narration.ts + episode PLAN.md (graphify gate passed)
- [x] Scaffold my-core-is-boss-ch1-ep3/
- [x] All scenes + main component + TransitionSeries
- [x] Update scripts/dev.sh + root package.json
- [x] Run `bun install` to link workspace
- [x] Generate TTS audio
- [x] Render MP4 — `out/my-core-is-boss-ch1-ep3.mp4` (180.4 MB, 7037 frames, 3:54)
- [ ] Verify migration: images load via setPublicDir("../assets")
- [ ] Episode-polish improvements
- [ ] Re-render MP4 post-migration

## Phase 3: Ch2-EP1 — 掛機修仙

> Episode PLAN: [./my-core-is-boss-ch2-ep1/PLAN.md](./my-core-is-boss-ch2-ep1/PLAN.md) | Episode TODO: [./my-core-is-boss-ch2-ep1/TODO.md](./my-core-is-boss-ch2-ep1/TODO.md)

- [x] Write narration.ts + episode PLAN.md (graphify gate passed, v2 revised)
- [x] Scaffold my-core-is-boss-ch2-ep1/
- [x] All scenes + main component + TransitionSeries
- [x] Update scripts/dev.sh + root package.json
- [x] Run `bun install` to link workspace
- [x] Generate TTS audio
- [x] Verify migration: images load via setPublicDir("../assets")
- [x] Verify in Remotion Studio
- [x] Render MP4 — out/my-core-is-boss-ch2-ep1.mp4 (181 MB, 8624 frames, 4:47)

## Phase 4: Remaining Ch2 Episodes

- [ ] Ch2-EP2 — 經驗值農場 (linyi, zhaoxiaoqi, xiaoelder)
- [ ] Ch2-EP3 — 技能點分配 (linyi, zhaoxiaoqi, xiaoelder)

## Phase 5: Ch3+ (Future)

- [ ] Ch3 (3 ep) — 秘境速通
- [ ] Ch4 (4 ep) — 副本開團
- [ ] Ch5–Ch10 (remaining 22 episodes)
