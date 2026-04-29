# remotion_types -- Code TODO

## Status: Stable

Core type system for the bun-remotion monorepo. Used by episodeforge, remotion_studio, and storygraph. 7-category taxonomy + 7 composition spec builders.

## Known Issues

- **Category detection is heuristic-based**: `detectCategoryFromDirname()` uses keyword matching. Ambiguous directory names may detect incorrectly (e.g., "chart-demo" matches "demo" -> tech_explainer instead of "chart" -> data_story, because tech_explainer checks run first).
- **Only Tech Explainer has presets**: Other categories (narrative_drama, data_story, etc.) have no series presets. Adding presets for existing series (weapon-forger, taiwan-stock-market) would improve scaffolding.
- **Scene templates are fixed**: Frame durations in builders are hardcoded (e.g., TitleScene always 120 frames in tech_explainer). No per-series override mechanism.
- **Shorts/meme uses 9:16 but others use 16:9**: No runtime validation that aspect ratio matches category expectations.

## Scripts Reference

| Script | Lines | Status |
|--------|-------|--------|
| `src/category-types.ts` | 344 | Stable -- 7 categories, detection, estimation |
| `src/scene-templates.ts` | 455 | Stable -- 7 builders + generic dispatcher |
| `src/presets/tech-explainer-presets.ts` | 98 | Stable -- storygraph-explainer preset + data |

## Tests

| Test file | Tests | Status |
|-----------|-------|--------|
| `src/__tests__/category-types.test.ts` | ~35 | Passing -- detection, labels, scene counts, genre mapping |
| `src/__tests__/scene-templates.test.ts` | ~25 | Passing -- all 7 builders, contiguous frames, contiguity, dispatcher |

## P0 -- Required for correctness

(none -- core types are stable and well-tested)

## P1 -- Nice-to-have improvements

- [ ] **More series presets**: Add presets for existing series (weapon-forger, my-core-is-boss, galgame-meme-theater, taiwan-stock-market, claude-code-intro)
- [ ] **Priority-based category detection**: Weight detection rules by specificity (longest match first) instead of sequential if/else
- [ ] **Configurable frame durations**: Allow per-series or per-episode frame duration overrides in CompositionSpec
- [ ] **Aspect ratio validation**: Runtime check in `buildCompositionSpec()` that width/height matches category defaults
- [ ] **NarrativeDramaData battle scene support**: Current builder only scaffolds ContentScene, no BattleScene/TransitionScene scaffolding from data
- [ ] **DataStoryData type refinement**: `data: Record<string, unknown>` is too loose -- define chart data shapes per chartType
