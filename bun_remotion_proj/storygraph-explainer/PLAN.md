# PLAN — storygraph-explainer (Storygraph-First Reset)

> Tech Explainer 系列：介紹 storygraph 知識圖譜建構系統
> Category: tech_explainer | Language: zh-TW
> Series ID: storygraph-explainer

## 問題回顧

前一版直接 scaffold 6 集 code（scenes + narration），結果：
- graph.html 只有 11 nodes（全 star topology），0 semantic depth
- 每集只是 Title → Feature → Outro 的空洞模板
- storygraph extraction 對 tech_explainer narration_script 幾乎無效（只能拿到 scene names + narrator）

**根本原因：先寫 code 再跑 storygraph = 本末倒置。**

## 核心方法：Storygraph-First Pipeline

```
Phase 1: 寫好 narration.ts（故事先行）
    ↓
Phase 2: 跑 storygraph extraction（驗證故事結構）
    ↓  如果 nodes < 20 或 communities < 3 → 回到 Phase 1 改內容
Phase 3: 從驗證過的 narration scaffold Remotion code
    ↓
Phase 4: TTS + Render
```

## Phase 1: 故事設計（Narration-First）— DONE

### 1-1 系列架構決策

- **目標觀眾**：開發者 + 內容創作者（有在經營系列內容的人）
- **核心訊息**：storygraph 自動從你的劇本萃取知識圖譜，讓系列內容不再失控
- **系列弧線**：痛點共鳴 → 解方概念 → 原理解密 → 實戰見證
- **每集時長**：40-60s（Shorts / Bilibili 短片適配）
- **語調**：輕快科普，像 Fireship 風格 — 快節奏、有梗、技術準確

### 1-2 集數規劃

| Ep | 標題 | 核心概念 | 場景結構 | 預計時長 |
|----|------|---------|---------|---------|
| ep1 | 知識圖譜是什麼？ | 碎片化痛點 → 知識圖譜解方 | Title → Problem → Solution → Outro | 50s |
| ep2 | 五階段管線 | Extract → Build → Cluster → Merge → Check | Title → Pipeline×5 → Outro | 60s |
| ep3 | 一行程式看見全貌 | CLI demo + Before/After | Title → Demo → Comparison → CTA → Outro | 55s |

每集 arc：
- **ep1**: 「你的系列內容越來越亂」→ 知識圖譜概念 → storygraph 預告
- **ep2**: 「它是怎麼做到的」→ 五階段拆解 → 每階段一個視覺化
- **ep3**: 「實際跑一次」→ CLI 操作 → graph.html 呈現 → CTA

### 1-3 品質標準

narration.ts 必須滿足：
- 每集 ≥ 5 個明確 tech concepts（可在 storygraph 中成為 tech_term nodes）
- 每集有 clear narrative arc（problem → exploration → takeaway）
- scene 間有邏輯遞進（不是獨立片段拼湊）
- 總字數 150-250 字（40-60s 口語節奏）

## Phase 2: Storygraph 驗證

### 2-1 建置 Series Config

在 `bun_app/storygraph/src/scripts/series-config.ts` 新增 `storygraph-explainer` config：
- `genre: "tech_explainer"`
- 無角色（narrator only）
- tech patterns: AST, tree-sitter, 知識圖譜, 聚類, 社群偵測, PageRank, 聯邦合併, 跨集連結, 品質評分
- 無 gag source（tech explainer 不需要）

### 2-2 跑 Extraction + 驗證

> **重要：必須使用 `--mode hybrid` 或 `--mode ai`。** `--mode regex` 只能用於結構性除錯——它產生扁平星狀圖，沒有語義深度。生產管線一律 hybrid/ai。

```bash
bun run storygraph episode <ep-dir> --mode hybrid
```

驗證條件（per episode）：
| 指標 | 最低標準 |
|------|---------|
| Total nodes | ≥ 15 |
| Node types | ≥ 4 |
| tech_term nodes | ≥ 3 |
| Communities | ≥ 2 |
| Edges | ≥ 12 |

不達標 → 回 Phase 1 改 narration 內容，不是改 extraction。

### 2-3 Merge + Cross-Link（多集時）

累積 ≥ 3 集後：
```bash
bun run storygraph pipeline <series-dir> --mode hybrid
```

驗證 merged graph：
- Cross-episode link edges > 0（same_concept, story_progression）
- 無 anti-pattern（story_anti_pattern cross-links）

## Phase 3: Scaffold Remotion Code

只有通過 Phase 2 驗證的集數才進入 scaffold。

使用 episodeforge + tech_explainer category template：
- 每集獨立 Remotion project（chapter-based）
- scenes 從 narration.ts 的 scene 列表對應
- 動畫風格：tween_clean（科技感漸層 + monospace code）

## Phase 4: TTS + Render

- Voice: serena (mlx_tts) 或 edge-tts
- 每集 generate-tts → sync audio → render MP4
- 確認 audio 時長與 scene frames 匹配

## 集數規劃

| Ep | 標題 | 核心概念 | 場景結構 | 預計時長 | 狀態 |
|----|------|---------|---------|---------|------|
| ep1 | 知識圖譜是什麼？ | 碎片化痛點 → 知識圖譜解方 | Title → Problem → Solution → Outro | 50s | Narration done |
| ep2 | 五階段管線 | Extract → Build → Cluster → Merge → Check | Title → Pipeline×5 → Outro | 60s | Narration done |
| ep3 | 一行程式看見全貌 | CLI demo + Before/After | Title → Demo → Comparison → CTA → Outro | 55s | Narration done |

## 系列設定

- **Category:** tech_explainer
- **Audio mode:** single_narrator (narration_script)
- **Voice:** TBD (mlx_tts serena or edge-tts)
- **Animation style:** tween_clean — 科技感漸層 + monospace code + slide/fade 轉場
- **Aspect ratio:** 16:9 (1920x1080, 30fps)
- **Series config:** chapterBased: true, abbreviation: sge

## 下一步

1. 先完成 Phase 1-1：決定目標觀眾、核心訊息、系列弧線
2. 寫 ep1 narration.ts 全文（zh-TW）
3. 跑 storygraph 驗證
4. 達標後才 scaffold code
