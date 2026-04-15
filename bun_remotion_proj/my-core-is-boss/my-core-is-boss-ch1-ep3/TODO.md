# TODO — 我的核心是大佬 第一章第三集：Bug 利用

## Story

宗門大比展開，林逸在比武中被對手追趕時意外穿牆，發現碰撞體判定 Bug。他利用地形縫隙把對手全部卡住，連勝所有比賽。趙小七腦補為「空間禁錮之術」，蕭長老偷偷把「卡模型」改寫成「空間節點」記進修煉筆記。章節結尾埋下第二章「自動修煉腳本」伏筆。

Characters: linyi, zhaoxiaoqi, xiaoelder, narrator
Language: zh-TW (Traditional Chinese)
Chapter: 第一章：系統覺醒（第 3/3 集）

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (5 scenes: Title, Content1-3, Outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/MyCoreIsBossCh1Ep3.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx (tournament-stage: discover collision bug)
- [x] Write src/scenes/ContentScene2.tsx (tournament-stage: exploit bug, win all matches)
- [x] Write src/scenes/ContentScene3.tsx (tournament-stage: over-interpretation + elder notes)
- [x] Write src/scenes/OutroScene.tsx
- [x] Update PLAN.md (episode guide + graphify gate)
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with scripts
- [x] Run sync-images.sh to copy asset images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:mcb-ch1-ep3` to generate audio (durations.json + segment-durations.json + voice-manifest.json)

## Remaining

- [x] Verify in Remotion Studio (built successfully at localhost:3006)
- [x] Render final MP4 — `out/my-core-is-boss-ch1-ep3.mp4` (180.4 MB, 7037 frames, 3:54)
- [ ] Episode-polish improvements
