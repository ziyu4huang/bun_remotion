# TODO — 我的核心是大佬 第一章第二集：任務跳過

> Parent PLAN: [../PLAN.md](../PLAN.md) | Parent TODO: [../TODO.md](../TODO.md) | Episode PLAN: [./PLAN.md](./PLAN.md)

## Verification: Assets & Audio Migration (2026-04-17)

- [ ] Verify images load in Remotion Studio (`setPublicDir("../assets")` → `characters/`, `backgrounds/`)
- [ ] Regenerate TTS audio → .wav in `assets/audio/ch1-ep2/`, JSON in `audio/`
- [ ] Verify `audio/durations.json` + `audio/segment-durations.json` load correctly
- [ ] Render MP4 and confirm no black frames or missing assets

## Story

宗門發布「清剿妖獸」例行任務，所有弟子嚴陣以待。林逸發現系統的任務面板有「跳過」按鈕，直接繞過妖獸洞穴領取獎勵。趙小七目睹全程，將此解讀為「以大乘期修為直取天道本源」，並更新《林逸師兄語錄》。

Characters: linyi, zhaoxiaoqi
Language: zh-TW (Traditional Chinese)
Chapter: 第一章：系統覺醒（第 2/3 集）

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (5 scenes: Title, Content1-3, Outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/MyCoreIsBossCh1Ep2.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx (sect-plaza: quest announcement, skip button)
- [x] Write src/scenes/ContentScene2.tsx (spirit-beast-cave: bypass beasts)
- [x] Write src/scenes/ContentScene3.tsx (sect-plaza: Zhao Xiaoqi over-interpretation)
- [x] Write src/scenes/OutroScene.tsx
- [x] Update PLAN.md (episode guide)
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with scripts
- [x] Run sync-images.sh to copy asset images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:mcb-ch1-ep2` to generate audio (durations.json + segment-durations.json + voice-manifest.json)

## Remaining

- [x] Verify in Remotion Studio
- [x] Render final MP4 — `out/my-core-is-boss-ch1-ep2.mp4` (155.9 MB, 6715 frames, 3:43)
- [x] Episode-polish improvements applied: effect pacing ≤50%, background variety, TitleScene system stinger, OutroScene QuestBadge
