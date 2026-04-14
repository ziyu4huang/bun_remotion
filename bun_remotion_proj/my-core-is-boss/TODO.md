# TODO — My Core Is Boss (我的核心是大佬)

## Phase 1: Foundation

- [x] PLAN.md — story, characters, emotions, project structure
- [x] Character JSON manifests (22 emotion configs)
- [x] Background JSON manifests (14 scene configs)
- [x] Character images (22 PNGs, 1:1, 2K, transparent BG via rembg)
- [x] Background images (14 PNGs, 16:9, 2K)
- [x] Fixture shared components (characters.ts, BackgroundLayer, CharacterSprite, DialogBox, ComicEffects, MangaSfx, SystemOverlay, GameUI, ScreenShake)
- [x] sync-images.sh script
- [x] generate-tts.ts script (shared, multi-voice)

## Phase 2: Ch1-EP1 — 首次誤會

- [x] Write narration.ts (dialog + voice map + emotion per line)
- [x] Scaffold my-core-is-boss-ch1-ep1/ (package.json, tsconfig, index.ts, Root.tsx)
- [x] TitleScene.tsx
- [x] ContentScene1.tsx (sect-plaza: linyi arrives, sees game UI)
- [x] ContentScene2.tsx (sect-plaza: zhaoxiaoqi witnesses, writes first quote)
- [x] ContentScene3.tsx (sect-plaza: xiaoelder confrontation)
- [x] OutroScene.tsx (credits + ch1-ep2 teaser)
- [x] MyCoreIsBossCh1Ep1.tsx (main + TransitionSeries)
- [x] Update scripts/dev.sh (ALL_APPS + get_comp_id)
- [x] Update root package.json (start/build/generate-tts scripts)
- [x] Run sync-images.sh to copy asset images
- [x] Run `bun install` to link workspace
- [x] Code review — normalizeEffects, ScreenShake, SceneIndicator, side mapping, name props
- [ ] Generate TTS (in progress)
- [ ] Verify in Remotion Studio
- [ ] Render MP4

## Phase 2.5: Ch1-EP2 — 任務跳過

- [x] Write narration.ts (5 scenes: Title, Content1-3, Outro, multi-voice linyi/zhaoxiaoqi/narrator)
- [x] Scaffold my-core-is-boss-ch1-ep2/ (package.json, tsconfig, index.ts, Root.tsx)
- [x] TitleScene.tsx
- [x] ContentScene1.tsx (sect-plaza: quest announcement, skip button discovery)
- [x] ContentScene2.tsx (spirit-beast-cave: bypass beasts, take reward)
- [x] ContentScene3.tsx (sect-plaza: Zhao Xiaoqi over-interpretation)
- [x] OutroScene.tsx (summary + ch1-ep3 teaser)
- [x] MyCoreIsBossCh1Ep2.tsx (main + TransitionSeries)
- [x] Update scripts/dev.sh (ALL_APPS + get_comp_id)
- [x] Update root package.json (start/build/generate-tts scripts)
- [x] Run sync-images.sh to copy asset images
- [x] Run `bun install` to link workspace
- [x] Generate TTS audio (durations.json + segment-durations.json + voice-manifest.json)
- [x] Shared dialogTiming.ts utility (proportional dialog-audio sync)
- [x] generate-tts.ts updated to output segment-durations.json
- [ ] Verify in Remotion Studio
- [ ] Render MP4

## Phase 3: Remaining Ch1 Episodes

- [ ] Ch1-EP3 — Bug 利用 (linyi, zhaoxiaoqi, xiaoelder)

## Phase 4: Ch2+ (Future)

- [ ] Ch2 (3 ep) — 修煉就是練功
- [ ] Ch3 (3 ep) — 秘境速通
- [ ] Ch4 (4 ep) — 副本開團
- [ ] Ch5–Ch10 (remaining 22 episodes)
