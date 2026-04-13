# TODO — 誰讓他煉器的！ 第二章 第一集：禍害成軍

## Story

周墨在煉器峰炸掉第三個鍋爐時，意外遇到了正在路邊練「投降劍法」的陸陽，以及自帶單身光環的孟景舟。三人一見如故，成立了「問道宗邏輯修正小組」。

Characters: 周墨, 陸陽（新角色）, 孟景舟（新角色）
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (4 scenes: Title, Content1, Content2, Outro)
- [x] Add 陸陽 and 孟景舟 to fixture/characters.ts
- [x] Generate character images (luyang.png, mengjingzhou.png)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/WeaponForgerCh2Ep1.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx (鍋爐爆炸 + 陸陽初遇)
- [x] Write src/scenes/ContentScene2.tsx (孟景舟登場 + 三人成軍)
- [x] Write src/scenes/OutroScene.tsx
- [x] Update PLAN.md (episode guide + story arcs + commands + 招牌梗追蹤)
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with wf-ch2-ep1 scripts
- [x] Run sync-images.sh to copy fixture images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:wf-ch2-ep1` to generate audio
- [x] Open in Remotion Studio and verify visuals
- [x] Render final MP4

## Notes

- Fixed symlink issue: Remotion's static server can't follow symlinks. Changed sync-images.sh to `cp` instead of `ln -sf`.
- Render: 8146 frames, ~4.5min, 149MB MP4
- Output: `out/weapon-forger-ch2-ep1.mp4`
