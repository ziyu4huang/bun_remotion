# TODO — storygraph-explainer (Storygraph-First Reset)

> **Status:** Phase 2C complete — full rebuild via CLI pipeline. 127 nodes, 7 communities, score 100/100. Awaiting Phase 3 scaffold.
> **Plan:** `PLAN.md`
> **Series ID:** storygraph-explainer
> **Category:** tech_explainer | **Language:** zh-TW

---

## Phase 1: 故事設計 — DONE

- [x] **1-1: 系列架構決策** — 目標觀眾、核心訊息、系列弧線、3 集規劃
- [x] **1-2: ep1 narration.ts** — 4 scenes, 310 chars (~52s), 15 tech concepts

## Phase 2: Storygraph 驗證 — DONE

- [x] **2-1: Series config** — Added tech patterns (跨集連結, 故事弧線, 萃取, 一致性檢查, 視覺化, 資訊碎片化, 角色關係, 伏筆)
- [x] **2-2: ep1 extraction** — regex mode: 22 nodes, 21 edges (fixing parser bugs)
- [x] **2-3: 驗證 ep1** — ✅ All thresholds passed (22 nodes, 4 types, 16 tech_terms, 21 edges)
- [x] **2-4: Parser bugs fixed** — segPattern trailing comma + narrator tech_term skip

## Phase 1B: ep2-ep3 Narration — DONE

- [x] **1B-1: ep2 narration.ts** — 五階段管線. 7 scenes, 22 tech_terms
- [x] **1B-2: ep3 narration.ts** — 實戰 Demo. 5 scenes, 23 tech_terms
- [x] **1B-3: ep2 extraction** — 31 nodes, 30 edges (regex mode)
- [x] **1B-4: ep3 extraction** — 30 nodes, 29 edges (regex mode)
- [x] **1B-5: Merge** — 83 nodes, 88 edges, 5 link edges, 3 cross-links

## Phase 2B: Consistency Checker Fixes — DONE

- [x] **2B-1: Jaccard similarity fix** — Compare actual node labels (not just types). False positive 1.000 → honest 0.523-0.610.
- [x] **2B-2: Scene properties fix** — graphify-episode.ts + graphify-merge.ts now preserve `dialog_line_count`, `character_count`, `effect_count` on scene nodes through to merged graph.
- [x] **2B-3: SKIP status** — Narrator-only series: Character Consistency, Trait Coverage, Interaction Density, Gag Evolution, Character Growth → SKIP (not scored). Score: 95/100 (was 75/100 with 3 false FAILs).
- [x] **2B-4: Tech term diversity** — Now enabled for generic genre (not just xianxia/novel).
- [x] **2B-5: Foreshadowing** — Changed from fake "PASS for comedy" to proper SKIP for non-applicable genres.

## Phase 2C: Hybrid/AI Re-run — DONE

- [x] **2C-1: Fix AI response parsing** — Greedy regex for nested backticks, truncation repair, maxTokens=4096
- [x] **2C-2: Re-run ep1-ep3 with `--mode hybrid`** — 131 nodes, 149 edges, 8 communities, score 100/100
- [x] **2C-3: Validate merged graph** — Communities=8, cross-links=5, score=100
- [x] **2C-4: Scene properties verified** — Survive through merge

## Episode PLAN.md + TODO.md Backfill — DONE

- [x] **ep1 PLAN.md** — Story contract: 4 scenes, 15 tech concepts, hybrid extraction stats
- [x] **ep1 TODO.md** — Quality gate [x], setup tasks [ ] (awaiting scaffold)
- [x] **ep2 PLAN.md** — Story contract: 7 scenes, 20 tech concepts, hybrid extraction stats
- [x] **ep2 TODO.md** — Quality gate [x], setup tasks [ ] (awaiting scaffold)
- [x] **ep3 PLAN.md** — Story contract: 5 scenes, 22 tech concepts, hybrid extraction stats
- [x] **ep3 TODO.md** — Quality gate [x], setup tasks [ ] (awaiting scaffold)

## Phase 3: Scaffold Remotion Code（待 Phase 2C 通過）

- [ ] **3-1: ep1 scaffold** — episodeforge + tech_explainer template
- [ ] **3-2: ep1 scenes** — TitleScene, ProblemScene, SolutionScene, OutroScene
- [ ] **3-3: ep2 scaffold** — episodeforge + tech_explainer template
- [ ] **3-4: ep2 scenes** — TitleScene, ExtractScene, BuildScene, ClusterScene, MergeScene, CheckScene, OutroScene
- [ ] **3-5: ep3 scaffold** — episodeforge + tech_explainer template
- [ ] **3-6: ep3 scenes** — TitleScene, DemoScene, ComparisonScene, CTAScene, OutroScene
- [ ] **3-7: Root configs** — package.json scripts + dev.sh entries

## Phase 4: TTS + Render（待 Phase 3 完成）

- [ ] **4-1: ep1 TTS** — generate-tts with chosen voice
- [ ] **4-2: ep1 render** — MP4 output
- [ ] **4-3: ep1 verify** — audio sync + visual check

---

## Done

- [x] 前版 6 集全部刪除（code + configs + dev.sh entries）
- [x] Storygraph-first PLAN.md 建立
- [x] ep1 narration.ts 撰寫（4 scenes, 15 tech concepts）
