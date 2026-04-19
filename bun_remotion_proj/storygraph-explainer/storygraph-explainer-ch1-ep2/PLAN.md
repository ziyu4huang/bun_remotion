# PLAN — storygraph-explainer Ch1-Ep2：五階段管線

> Parent: [../PLAN.md](../PLAN.md)
> Category: tech_explainer | Language: zh-TW

## Story

承接 ep1 的預告，拆解 storygraph 的五階段管線：萃取（AST 語法樹剖析）→ 建構（graphology 圖結構）→ 聚類（社群偵測分群）→ 聯邦合併（跨集連結）→ 一致性檢查（品質閘門）。每個階段一個場景，視覺化呈現。

Characters: narrator
Language: zh-TW (Traditional Chinese)
Chapter: 第1章：storygraph 介紹（第 2/3 集）

## Scene Breakdown

| # | Scene | Duration | Narration | Visual |
|---|-------|----------|-----------|--------|
| 1 | TitleScene | ~7s | 承接上集，預告管線拆解 | 標題動畫 |
| 2 | ExtractScene | ~10s | 第一階段：AST 萃取（2 segments） | 語法樹剖析動畫 |
| 3 | BuildScene | ~8s | 第二階段：graphology 建構 | 圖資料結構視覺 |
| 4 | ClusterScene | ~8s | 第三階段：社群偵測聚類 | 分群動畫 |
| 5 | MergeScene | ~9s | 第四階段：聯邦合併 | 跨集連結視覺 |
| 6 | CheckScene | ~8s | 第五階段：一致性檢查 | 品質閘門儀表板 |
| 7 | OutroScene | ~10s | 預告下集：實際 Demo | 下集標題卡 |

Total: ~60s (1800 frames at 30fps)

## Tech Concepts

萃取, AST, 語法樹, graphology, 圖資料結構, 社群偵測, 聯邦合併, 跨集連結, 品質閘門, 一致性檢查, 管線, TypeScript, Markdown, tree-sitter, PageRank, 角色成長, 故事弧線, 伏筆, 聚類, 子圖

## Status

Narration done. Storygraph extraction done (hybrid mode: 47 nodes, 54 edges). Awaiting scaffold.
