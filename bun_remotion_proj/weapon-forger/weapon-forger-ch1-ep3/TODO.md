# TODO — 誰讓他煉器的！ 第一章 第三集：丹爐修復

## Story

周墨正式加入煉器峰，長老交給他第一個任務：修復一座三百年歷史的會說話的丹爐。
丹爐因為被忽視了三百年而脾氣暴躁。周墨用工程師思維修復了它，裝了情緒管理系統。
結果丹爐不罵人了——開始半夜唱歌。

Characters: zhoumo, elder
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (4 scenes: Title, Content1, Content2, Outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/WeaponForgerCh1Ep3.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx
- [x] Write src/scenes/ContentScene2.tsx
- [x] Write src/scenes/OutroScene.tsx
- [x] Update PLAN.md with ch1-ep3 entry
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with wf-ch1-ep3 scripts
- [x] Run sync-images.sh to copy fixture images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:wf-ch1-ep3` to generate audio
- [x] Fix generate-tts path in package.json (../../fixture → ../fixture)
- [x] Fix SystemOverlay.tsx: add "info" type (was missing, caused render crash)
- [x] Regenerate elder.png via Nano Banana + rembg
- [x] Sync fixture images to all episodes
- [x] Open in Remotion Studio and verify visuals
- [x] Render final MP4 (re-running after bug fix)
