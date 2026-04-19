---
name: category-guide
description: Per-category video format guide — scene templates, components, animation style, audio mode, dialog system, decision tree
metadata:
  tags: category, tech_explainer, narrative_drama, galgame_vn, data_story, listicle, tutorial, shorts_meme, video format
---

# Video Category Guide

**Category = video format/structure.** Genre = story content style (xianxia_comedy). A series has BOTH.
Category determines scene templates, component choices, animation style, and audio mode.
Genre determines story tone, character archetypes, and narrative conventions.

**Source of truth:** `bun_app/remotion_types/src/category-types.ts` — `VIDEO_CATEGORIES` registry.

---

## Decision Tree

```
Does the video tell a story with characters?
├── Yes → Does it have a single narrator (no character dialog)?
│         └── No, multiple characters speak → Does it use galgame-style sprites?
│                   ├── Yes → galgame_vn
│                   └── No  → narrative_drama
│         └── Yes, narration-driven → Is it explaining a tool/concept?
│                   ├── Yes → tech_explainer
│                   └── No  → Does it show data/charts?
│                             ├── Yes → data_story
│                             └── No  → tutorial
├── No → Is it a ranked list?
│         ├── Yes → listicle
│         └── No  → Is it under 60s?
│                   ├── Yes → shorts_meme
│                   └── No  → default to narrative_drama
```

---

## Category Reference

### 1. Narrative Drama (`narrative_drama`) — 敘事劇情

| Property | Value |
|----------|-------|
| Animation | `spring_energy` — bouncy, energetic springs |
| Audio | `character_voices` — per-character TTS voices |
| Dialog system | `dialogLines[]` array |
| Duration | 40–120s |
| Aspect ratio | 16:9 |
| Components | CharacterSprite, DialogBox, BackgroundLayer, ComicEffects, MangaSfx, SystemOverlay |

**Scene template:** TitleScene → ContentScene×N → BattleScene? → TransitionScene? → OutroScene
**When to use:** Character-driven stories with dialog, emotions, and multi-episode arcs.
**Existing projects:** weapon-forger, my-core-is-boss, xianxia-system-meme

### 2. Galgame VN (`galgame_vn`) — 美少女遊戲風

| Property | Value |
|----------|-------|
| Animation | `spring_energy` — bouncy, energetic springs |
| Audio | `character_voices` — per-character TTS voices |
| Dialog system | `dialogLines[]` array |
| Duration | 30–90s |
| Aspect ratio | 16:9 |
| Components | CharacterSprite, DialogBox, BackgroundLayer, ComicEffects, MangaSfx |

**Scene template:** TitleScene → JokeScene×N → OutroScene
**When to use:** Visual novel style with character sprites, dialog boxes, emotional transitions. Meme/joke driven.
**Existing projects:** galgame-meme-theater, galgame-youth-jokes

### 3. Tech Explainer (`tech_explainer`) — 技術講解

| Property | Value |
|----------|-------|
| Animation | `tween_clean` — smooth, precise interpolated motion |
| Audio | `single_narrator` — one TTS voice |
| Dialog system | `narration_script` (per-scene text blocks) |
| Duration | 60–180s |
| Aspect ratio | 16:9 |
| Components | BackgroundLayer, DialogBox |

**Scene template:** TitleScene → ProblemScene → ArchitectureScene → FeatureScene×N → DemoScene → ComparisonScene → OutroScene
**When to use:** Product/tool introduction with architecture diagrams, feature showcase, and workflow demos.
**Existing projects:** claude-code-intro, storygraph-explainer

### 4. Data Story (`data_story`) — 數據故事

| Property | Value |
|----------|-------|
| Animation | `tween_sequential` — step-by-step reveals |
| Audio | `narrator_plus_sfx` — narration with sound effects |
| Dialog system | `narration_script` |
| Duration | 45–120s |
| Aspect ratio | 16:9 |
| Components | BackgroundLayer, CandleChart, Candle |

**Scene template:** DataIntroScene → ChartScene×N → TrendScene×N → ConclusionScene
**When to use:** Data-driven narrative with animated charts, trend reveals, and insight narration.
**Existing projects:** taiwan-stock-market

### 5. Listicle / Top N (`listicle`) — 盤點清單

| Property | Value |
|----------|-------|
| Animation | `spring_pop` — dramatic pop-in for reveals |
| Audio | `narrator_plus_sfx` |
| Dialog system | `item_list` |
| Duration | 60–180s |
| Aspect ratio | 16:9 |
| Components | BackgroundLayer, ComicEffects, MangaSfx |

**Scene template:** HookScene → ItemScene×N → SummaryScene → OutroScene
**When to use:** Numbered list with dramatic reveals, rankings, and countdown animations.
**Existing projects:** *(none yet)*

### 6. Tutorial / How-To (`tutorial`) — 教學指南

| Property | Value |
|----------|-------|
| Animation | `tween_sequential` — step-by-step reveals |
| Audio | `single_narrator` |
| Dialog system | `step_guide` |
| Duration | 120–300s |
| Aspect ratio | 16:9 |
| Components | BackgroundLayer, DialogBox |

**Scene template:** IntroScene → StepScene×N → ResultScene → RecapScene → OutroScene
**When to use:** Step-by-step guide with code highlighting, progress tracking, and result demos.
**Existing projects:** *(none yet)*

### 7. Shorts / Meme (`shorts_meme`) — 短影音迷因

| Property | Value |
|----------|-------|
| Animation | `fast_cuts` — rapid scene transitions |
| Audio | `music_plus_sfx` — background music + sound effects |
| Dialog system | `none` (sfx only) |
| Duration | 15–60s |
| Aspect ratio | 9:16 (vertical) |
| Components | BackgroundLayer, ComicEffects, MangaSfx |

**Scene template:** HookScene → PunchlineScene → LoopOutroScene
**When to use:** Quick punchy content with hook, punchline, and loop-friendly ending.
**Existing projects:** *(none yet)*

---

## Category × Component Matrix

| Component | narrative_drama | galgame_vn | tech_explainer | data_story | listicle | tutorial | shorts_meme |
|-----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| CharacterSprite | X | X | | | | | |
| DialogBox | X | X | X | | | X | |
| BackgroundLayer | X | X | X | X | X | X | X |
| ComicEffects | X | X | | | X | | X |
| MangaSfx | X | X | | | X | | X |
| SystemOverlay | X | | | | | | |
| CandleChart | | | | X | | | |

---

## Category × Animation Style

| Style | Categories | Key APIs |
|-------|-----------|----------|
| `spring_energy` | narrative_drama, galgame_vn | `spring()`, `Easing.elastic`, `Easing.back` |
| `tween_clean` | tech_explainer | `interpolate()` with `Easing.bezier`, smooth curves |
| `spring_pop` | listicle | `spring()` with high `bounce`, scale transforms |
| `tween_sequential` | data_story, tutorial | `interpolate()` step-wise, `Easing.out` |
| `fast_cuts` | shorts_meme | Short `<Sequence>` durations, rapid `startFrom` jumps |

---

## Scaffolding with Category

When using `episodeforge` to scaffold, pass `--category`:

```bash
bun run episodeforge --series <series> --category <VideoCategoryId> --dry-run
```

If `--category` is omitted, episodeforge auto-detects from directory name via `detectCategoryFromDirname()`. For existing series with registered configs, the category is already set in `series-config.ts`.

---

## Category + Genre Interaction

A series has **both** a category and a genre:

| Series | Category | Genre |
|--------|----------|-------|
| weapon-forger | narrative_drama | xianxia_comedy |
| my-core-is-boss | narrative_drama | novel_system |
| galgame-meme-theater | galgame_vn | galgame_meme |
| xianxia-system-meme | narrative_drama | xianxia_comedy |
| storygraph-explainer | tech_explainer | (generic) |
| taiwan-stock-market | data_story | (generic) |

- **Category** → determines scene structure, components, animation style, audio mode
- **Genre** → determines story tone, character archetypes, running gag patterns, quality rubric extensions

Both are independent axes. Changing genre doesn't change category, and vice versa.
