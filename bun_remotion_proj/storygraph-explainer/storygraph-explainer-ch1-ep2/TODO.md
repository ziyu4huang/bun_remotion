# TODO — storygraph-explainer Ch1-Ep2：五階段管線

> Parent: [../TODO.md](../TODO.md)

## Story

承接 ep1，拆解 storygraph 五階段管線：萃取 → 建構 → 聚類 → 聯邦合併 → 一致性檢查。每階段一個場景。

Characters: narrator
Language: zh-TW (Traditional Chinese)
Chapter: 第1章：storygraph 介紹（第 2/3 集）

## Quality Gate (completed)

- [x] Create episode directory + narration.ts (7 scenes: Title, Extract, Build, Cluster, Merge, Check, Outro)
- [x] Create episode PLAN.md (story contract)
- [x] Run storygraph pipeline (episode → merge → check) — hybrid mode: 47 nodes, 54 edges
- [x] User approved gate results

## Setup Tasks

- [x] Create TODO.md
- [x] Write scripts/narration.ts (7 scenes: Title, Extract, Build, Cluster, Merge, Check, Outro)
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create src/index.ts
- [ ] Create src/Root.tsx
- [ ] Create src/StorygraphExplainerCh1Ep2.tsx (main composition)
- [ ] Write src/scenes/TitleScene.tsx
- [ ] Write src/scenes/ExtractScene.tsx
- [ ] Write src/scenes/BuildScene.tsx
- [ ] Write src/scenes/ClusterScene.tsx
- [ ] Write src/scenes/MergeScene.tsx
- [ ] Write src/scenes/CheckScene.tsx
- [ ] Write src/scenes/OutroScene.tsx
- [ ] Update workspace PLAN.md (episode guide + commands)
- [ ] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [ ] Update root package.json with scripts
- [ ] Run `bun install` to link workspace
- [ ] Generate TTS (narrator: serena/edge-tts)

## Remaining

- [ ] Verify in Remotion Studio
- [ ] Render final MP4
