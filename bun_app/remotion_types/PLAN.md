# remotion_types -- Code Plan

## Current State (v0.1.0)

Shared type definitions and composition spec builders for the bun-remotion monorepo. Defines the 7-category video taxonomy used by episodeforge (project scaffolding), remotion_studio (rendering), and storygraph (KG pipeline).

**Working:**
- **7-category video taxonomy** (`VideoCategory`): narrative_drama, galgame_vn, tech_explainer, data_story, listicle, tutorial, shorts_meme
- **Category detection**: `detectCategoryFromDirname()` heuristic matching, `genreToCategory()` genre-to-category mapping
- **Scene templates**: Per-category `CompositionSpec` builders that define scene structure, frame ranges, and props
- **Generic dispatcher**: `buildCompositionSpec()` routes to the correct builder by category ID
- **Tech Explainer presets**: Series config presets with tech patterns and feature keywords (storygraph-explainer)
- **Scene count estimation**: `estimateSceneCount()` calculates repeatable scene counts from target duration

**Consumers:**
- `episodeforge` (workspace dependency) -- project scaffolding
- `remotion_studio` (workspace dependency) -- rendering + UI
- `storygraph` -- KG quality scoring uses category-aware checks

## Module Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | 63 | Barrel export -- re-exports from category-types, scene-templates, presets |
| `src/category-types.ts` | 344 | 7-category taxonomy, type definitions, detection helpers, scene count estimation |
| `src/scene-templates.ts` | 455 | Per-category CompositionSpec builders (7 builders + generic dispatcher) |
| `src/presets/tech-explainer-presets.ts` | 98 | Tech Explainer series presets (storygraph-explainer) |

## Category Taxonomy

| ID | zh_TW | Scenes | Dialog System | Animation | Audio |
|----|-------|--------|---------------|-----------|-------|
| `narrative_drama` | 敘事劇情 | Title/Content/Battle/Transition/Outro | dialogLines[] | spring_energy | character_voices |
| `galgame_vn` | 美少女遊戲風 | Title/Joke/Outro | dialogLines[] | spring_energy | character_voices |
| `tech_explainer` | 技術講解 | Title/Problem/Architecture/Feature/Demo/Comparison/Outro | narration_script | tween_clean | single_narrator |
| `data_story` | 數據故事 | DataIntro/Chart/Trend/Conclusion | narration_script | tween_sequential | narrator_plus_sfx |
| `listicle` | 盤點清單 | Hook/Item/Summary/Outro | item_list | spring_pop | narrator_plus_sfx |
| `tutorial` | 教學指南 | Intro/Step/Result/Recap/Outro | step_guide | tween_sequential | single_narrator |
| `shorts_meme` | 短影音迷因 | Hook/Punchline/LoopOutro | none | fast_cuts | music_plus_sfx |

## Key Types

### category-types.ts

```ts
VideoCategoryId         -- 7 union literal types
VideoCategory           -- Full category definition (scenes, components, animation, audio, etc.)
SceneTemplate           -- Scene name, factory, requiredProps, frameRange, repeatable
AnimationStyle          -- "spring_energy" | "tween_clean" | "spring_pop" | "tween_sequential" | "fast_cuts"
AudioMode               -- "character_voices" | "single_narrator" | "narrator_plus_sfx" | "sfx_only" | "music_plus_sfx"
AspectRatio             -- "16:9" | "9:16" | "1:1"
```

### scene-templates.ts

```ts
SceneSpec               -- name, startFrame, durationInFrames, props
CompositionSpec         -- id, category, totalFrames, fps, width, height, scenes[]
TechExplainerData       -- title, tagline, painPoint, pipeline, features, demoSteps, comparison, cta
NarrativeDramaData      -- title, episodeTitle, chapterNum, episodeNum, characters, scenes, outroQuest
GalgameVNData           -- title, episodeNum, characters, jokes[], nextTeaser
ListicleData            -- title, hookStatement, items[], verdict, cta
TutorialData            -- title, prerequisites, steps[], keyTakeaway, cta
DataStoryData           -- title, dataSource, charts[], trends[], summary, callToAction
ShortsMemeData          -- hook, visual, setup, punchline, reaction, loopText
```

## Helpers

```ts
getCategory(id): VideoCategory               -- Lookup by ID
listCategoryIds(): VideoCategoryId[]          -- All 7 IDs
detectCategoryFromDirname(name): VideoCategoryId  -- Heuristic from directory name
genreToCategory(genre): VideoCategoryId       -- Map genre preset to category
estimateSceneCount(cat, seconds): Record      -- Scene count estimates for target duration
buildCompositionSpec(cat, data, fps?): CompositionSpec  -- Generic builder dispatcher
```

## Sub-path Exports

| Import path | What it provides |
|------------|-----------------|
| `remotion_types` | Everything (barrel) |
| `remotion_types/category-types` | Category types + helpers only |
| `remotion_types/scene-templates` | Composition spec builders only |
| `remotion_types/presets/*` | Per-category preset data |
