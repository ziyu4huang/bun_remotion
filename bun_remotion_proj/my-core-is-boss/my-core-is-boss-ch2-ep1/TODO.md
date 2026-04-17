# TODO — 我的核心是大佬 第二章第一集：掛機修仙

> Parent PLAN: [../PLAN.md](../PLAN.md) | Parent TODO: [../TODO.md](../TODO.md) | Episode PLAN: [./PLAN.md](./PLAN.md)

## Verification: Assets & Audio Migration (2026-04-17)

- [x] Verify images load in Remotion Studio (`setPublicDir("../assets")` → `characters/`, `backgrounds/`) — stills at frame 250/600 confirmed content
- [x] Verify `audio/durations.json` + `audio/segment-durations.json` load correctly — audio files present in audio/
- [x] Render MP4 and confirm no black frames or missing assets — 181 MB, 8624 frames

## Story

林逸回到修煉場打坐，意外觸發系統「自動修煉腳本」功能——直接掛機睡覺，一覺醒來連升五十級。趙小七聽到「不想動」誤解為「以不動應萬動」，守門三天寫下十萬字觀察日記。蕭長老目睹升級震驚腿軟，回頭偷偷燒了自己修行三十年的功法。

Characters: linyi, zhaoxiaoqi, xiaoelder, narrator
Language: zh-TW (Traditional Chinese)
Chapter: 第二章：修煉就是練功（第 1/3 集）

## Quality Gate (completed)

- [x] Create episode directory + narration.ts
- [x] Create episode PLAN.md (story contract)
- [x] Run graphify pipeline (episode → merge → check)
- [x] Subagent gate analysis → PLAN.md updated
- [x] User approved gate results (PROCEED)
- [x] Story revision: fix zhaoxiaoqi traits + linyi interactions (v2)
- [x] Re-run graphify pipeline on revised narration (15 PASS, 3 WARN, 0 FAIL)

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (5 scenes: Title, Content1-3, Outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/MyCoreIsBossCh2Ep1.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx (sect-training: discover auto-cultivation + Zhao Xiaoqi misinterpretation)
- [x] Write src/scenes/ContentScene2.tsx (sect-interior: wake up Lv.52 + Xiaoelder reaction)
- [x] Write src/scenes/ContentScene3.tsx (sect-plaza: diary + burn manual)
- [x] Write src/scenes/OutroScene.tsx (QuestBadge + UnlockingTeaser)
- [x] Update PLAN.md (episode guide)
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with scripts
- [x] Run sync-images.sh to copy asset images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:mcb-ch2-ep1` to generate audio (durations.json + segment-durations.json + voice-manifest.json)
- [x] Verify in Remotion Studio — Studio opened at localhost:3006, stills render correctly
- [x] Render final MP4 — 181 MB, 8624 frames, 4:47
