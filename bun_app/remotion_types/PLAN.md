# remotion_types — Plan

> Full specs → GitHub issue #34 (PRD)

## Quick Reference

- **Version:** v0.1.0 — Stable. 60 tests (35 category + 25 scene-templates)
- **Purpose:** Shared type definitions + composition spec builders
- **Consumers:** episodeforge, remotion_studio, storygraph

## Architecture

- `category-types.ts` — 7-category taxonomy, detection, estimation
- `scene-templates.ts` — 7 builders + generic dispatcher
- `presets/tech-explainer-presets.ts` — storygraph-explainer preset

## 7-Category Taxonomy

| Category | zh_TW | Dialog | Animation |
|----------|-------|--------|-----------|
| narrative_drama | 敘事劇情 | dialogLines[] | spring_energy |
| galgame_vn | 美少女遊戲風 | dialogLines[] | spring_energy |
| tech_explainer | 技術講解 | narration_script | tween_clean |
| data_story | 數據故事 | narration_script | tween_sequential |
| listicle | 盤點清單 | item_list | spring_pop |
| tutorial | 教學指南 | step_guide | tween_sequential |
| shorts_meme | 短影音迷因 | none | fast_cuts |

## Key Exports

```ts
buildCompositionSpec(category, data, fps?): CompositionSpec
detectCategoryFromDirname(name): VideoCategoryId
estimateSceneCount(cat, seconds): Record<string, number>
```
