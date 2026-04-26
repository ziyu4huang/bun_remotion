# TODO — 我的核心是大佬 第3章：秘境速通（第 1 集）

> Parent: [../PLAN.md](../PLAN.md)

## Story

上古秘境「虛空遺跡」三百年開啟一次。林逸的系統解鎖 noclip 穿牆模式，三分零七秒速通三千年秘境。趙小七創作《速通記錄簿》，蕭長老崩潰進度升至 45%。

Characters: linyi, zhaoxiaoqi, xiaoelder, narrator
Language: zh-TW

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (5 scenes: Title, Content1, Content2, Content3, Outro)
- [x] Create PLAN.md + storygraph gate (PASS 100/100)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/MyCoreIsBossCh3Ep1.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx (noclip discovery + wall-phasing)
- [x] Write src/scenes/ContentScene2.tsx (speedrun + Zhao Xiaoqi timer)
- [x] Write src/scenes/ContentScene3.tsx (Xiao Elder breakdown + wall test)
- [x] Write src/scenes/OutroScene.tsx
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with mcb-ch3-ep1 scripts
- [ ] Update workspace PLAN.md Episode Guide
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:mcb-ch3-ep1` to generate audio
- [ ] Verify in Remotion Studio
- [x] Render final MP4 (158M, 10841 frames, 6:01) — fixed type="achievement"→"success" bug in ContentScene2
