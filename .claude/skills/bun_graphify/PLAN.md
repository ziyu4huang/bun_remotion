# bun_graphify — Federated Story Knowledge Graph

> **Cross-linked docs:**
>
> Skill folder (this) | Code folder
> ---|---
> `PLAN.md` — Architecture, node types, edge relations | `bun_app/bun_graphify/PLAN.md` — Code-level plan + reuse reference
> `TODO.md` — Pipeline tasks, run history, known issues | `bun_app/bun_graphify/TODO.md` — Code-level tasks (file/line specific)
> `SKILL.md` — Operational playbook, commands | —

## Architecture (v0.12.0)

```
series-config.ts ─── Auto-detect series, load patterns (charNames, traits, tech, gag source)
      │
narration.ts (per episode)
  │
  ├─ [graphify-episode.ts] Regex extraction (fast, shallow, series-config-driven)
  │   Produces: episode_plot, scene, character_instance, tech_term,
  │             gag_manifestation, character_trait
  │
  ├─ [graphify-episode.ts --mode ai] NL extraction via pi-agent (slow, rich)
  │   Produces: episode_plot, scene, character_instance, plot_event,
  │             artifact, running_gag, character_trait, relationship, theme
  │   Falls back to regex if API fails
  │
  ├─ [graphify-episode.ts --mode hybrid] (DEFAULT) Regex first, AI supplements exclusives
  │   Regex produces: dense traits + tech terms (series-config patterns)
  │   AI adds: plot_event, artifact, gag_manifestation (AI-only types)
  │   Regex wins on duplicate node IDs; AI-exclusive edges added
  │
  └─ [gen-story-html.ts] graph.json → vis.js HTML (single + merged)
      │
      └─ [graphify-merge.ts] Concatenate sub-graphs + cross-episode link edges
          │
          ├─ same_character: ch1ep1_char_zhoumo ↔ ch1ep2_char_zhoumo
          ├─ story_continues: ch1ep1_plot → ch1ep2_plot → ...
          ├─ gag_evolves: ch1ep1_gag_X → ch1ep2_gag_X → ...
          │
          ├─ [story-algorithms.ts] PageRank, Jaccard, arc/evolution scores
          ├─ [subagent-prompt.ts] Build cross-link discovery prompt
          ├─ [ai-crosslink-generator.ts] Orchestrate: metrics → prompt → validate → patch
          │   ┌─ --mode regex: writes crosslink-input.json → STOPS → manual step
          │   └─ --mode ai/hybrid: calls pi-agent directly → parses → patches → continues
          │
          ├─ [graphify-check.ts] Traverse link edges → consistency report
          │   ┌─ --mode regex: writes check-enrichment-input.json → STOPS
          │   └─ --mode ai/hybrid: calls pi-agent → writes enrichment-output.md
          │
          └─ [ai-client.ts] pi-ai SDK wrapper for all AI calls
              ├─ Default: z.ai glm-4.7-flash (fast, cheap)
              ├─ Optional: anthropic/openai/google via pi-ai provider system
              └─ Fallback: graceful degradation to regex mode
```

### Triple-Mode Operation (Phase 27)

The pipeline supports three operating modes, selected via `--mode` flag:

| Mode | Episode Extraction | Cross-Link Discovery | Check Enrichment | AI Provider |
|------|-------------------|---------------------|------------------|-------------|
| `regex` | Regex from narration.ts | Writes input file → stops | Writes input file → stops | None (manual subagent) |
| `ai` | pi-agent NL analysis only | pi-agent direct API call | pi-agent direct API call | z.ai glm-4.7-flash (default) |
| `hybrid` (DEFAULT) | Regex first, AI supplements exclusives | pi-agent direct API call | pi-agent direct API call | z.ai glm-4.7-flash (default) |

**CLI flags:**
```
graphify-pipeline.ts <series-dir> [--mode regex|ai|hybrid] [--provider zai|anthropic|openai|google] [--model <modelId>]
graphify-episode.ts <ep-dir> [--mode regex|ai|hybrid] [--provider ...] [--model ...]
```

**Comparison tool:**
```
graphify-compare.ts <series-dir> [--keep] [--modes regex,ai,hybrid]
```

**AI touchpoints (3 total):**
1. **Per-episode NL extraction** — narration.ts → richer graph (8 node types vs 6)
2. **Cross-link discovery** — merged graph + metrics → AI cross-links
3. **Check enrichment** — consistency warnings → zh_TW analysis

### Series Config System (v0.6.0)

Each series has a `SeriesConfig` defining its characters, trait patterns, tech terms, and gag source. The pipeline auto-detects the series from directory name and loads the matching config. Adding a new series requires only adding a config object to `series-config.ts`.

| Series | Gag Source | Characters |
|--------|-----------|------------|
| weapon-forger | `PLAN.md` gag table | zhoumo, examiner, elder, luyang, mengjingzhou, soul |
| my-core-is-boss | `plot-lines.md` chapter table | linyi, zhaoxiaoqi, xiaoelder, chenmo |

### Simplified Merge (v0.4.0+)

**No synthetic nodes.** The merge concatenates per-episode sub-graphs and adds cross-episode link edges. Every node carries its `episode` property to identify source sub-graph.

| What v0.3.0 had | What v0.4.0+ does |
|------------------|-------------------|
| `char_zhoumo` canonical node | Removed — link edges connect instances directly |
| `instance_of` edges (char → canonical) | Removed — `same_character` links connect ep↔ep |
| `arc_ch1` story arc nodes | Removed — `story_continues` links chain plots |
| `gag_type_X` canonical nodes | Removed — `gag_evolves` links chain manifestations |

---

## Node Types

### Regex Pipeline (graphify-episode.ts, series-config-driven)

| Type | ID Format | Source |
|------|-----------|--------|
| episode_plot | `ch1ep1_plot` | narration.ts title match |
| scene | `ch1ep1_scene_{name}` | narration.ts scene structure |
| character_instance | `ch1ep1_char_{id}` | narration.ts `character:` fields |
| tech_term | `ch1ep1_tech_{term}` | Series-specific regex patterns on dialog text |
| gag_manifestation | `ch1ep1_gag_{type}` | PLAN.md gag table OR `plot-lines.md` chapter table (series-dependent) |
| character_trait | `ch1ep1_trait_{char}_{trait}` | Series-specific regex patterns per character |

### AI Pipeline (--mode ai, via pi-agent)

| Type | ID Format | Source |
|------|-----------|--------|
| (all regex types above) + `plot_event`, `artifact` | pi-agent NL analysis (8 total) |

### Regex Pipeline Limitations

1. **Characters:** Only detects from `character:` dialog fields. Characters mentioned in narration text but not speaking are missed (e.g., 滄溟子 in ch2ep3).
2. **Gags:** Supports both `PLAN.md` episode-column tables (weapon-forger) and `plot-lines.md` chapter-column tables (my-core-is-boss). For chapter-column format, all episodes in a chapter share the same gag manifestation text.
3. **Traits:** Series-specific regex patterns loaded from config. Better than hardcoded but still misses traits not in the pattern list. No false positive control.
4. **No:** plot_events, artifacts, relationships, themes — these require subagent analysis.

---

## Edge Relations

### Within Episode

| Relation | Source → Target | Pipeline |
|----------|----------------|----------|
| appears_in | character/scene/gag → plot | Both |
| character_speaks_like | trait → character | Regex |
| exhibits | trait → character | Subagent |
| uses_tech_term | character → tech_term | Regex |
| interacts_with | character ↔ character | Regex |
| involves | event → character | Subagent |
| frustrates | character → character | Subagent |
| part_of | event → scene | Subagent |
| leads_to | event → event | Subagent |
| creates / uses | character → artifact | Subagent |
| illustrates | event → theme | Subagent |

### Cross-Episode Link Edges (anchors)

| Relation | Connects | Conflict It Detects |
|----------|----------|-------------------|
| same_character | ep1_char_A ↔ ep2_char_A | 人設崩壞: trait drift |
| story_continues | ep1_plot → ep2_plot | Duplicate plot pattern |
| gag_evolves | ep1_gag_X → ep2_gag_X | Stagnation: no evolution |

---

## Pipeline Scripts

| Script | Purpose |
|--------|---------|
| `ai-client.ts` | pi-ai SDK wrapper: `callAI()` with provider/model selection, JSON mode, fallback |
| `series-config.ts` | Series config definitions + auto-detection (`detectSeries()`) |
| `graphify-episode.ts` | Regex extraction from narration.ts → per-episode graph.json |
| `graphify-episode.ts --mode ai` | NL extraction via pi-agent → richer graph |
| `graphify-episode.ts --mode hybrid` | Regex first, AI supplements exclusives (DEFAULT) |
| `graphify-merge.ts` | Concatenate + link edges → merged-graph.json |
| `graphify-check.ts` | Consistency checking via link edge traversal |
| `graphify-check.ts --mode ai/hybrid` | Check enrichment via pi-agent → zh_TW analysis |
| `graphify-pipeline.ts` | Orchestrate: episode → merge → html → check → crosslink → html |
| `graphify-pipeline.ts --mode hybrid` | Full hybrid pipeline: regex+AI extraction, AI enrichment (DEFAULT) |
| `graphify-compare.ts` | Run all modes, compare stats, recommend best default |
| `gen-story-html.ts` | graph.json → vis.js HTML (single + merged, AI cross-links, PageRank glow) |
| `story-algorithms.ts` | PageRank, Jaccard similarity, character arc score, gag evolution score |
| `subagent-prompt.ts` | Build prompts for cross-link, plot arc, foreshadowing discovery |
| `ai-crosslink-generator.ts` | Orchestrate cross-link discovery: metrics → prompt → validate → patch |
| `ai-crosslink-generator.ts --mode ai` | Direct pi-agent call instead of file-based handoff |
| `codebase-map.ts` | Generate CODEBASE_MAP.md (codebase mode) |

---

## Consistency Checks

| Check | Method | FAIL Criteria |
|-------|--------|---------------|
| Character Consistency | Traverse `same_character` links, compare traits | Core traits missing from episode instance |
| Gag Evolution | Traverse `gag_evolves` links, compare manifestations | Identical/near-identical (>0.8 similarity) = stagnation |
| Tech Term Diversity | Count tech_term nodes per episode | <2 terms = WARN |
| Trait Coverage | Check each character_instance has traits | No traits = WARN |
| Interaction Density | Count interaction edges per character per episode | No interactions = WARN |

**Edge relation compatibility:** `getTraits()` checks both `character_speaks_like` (regex) and `exhibits` (subagent). `checkInteractionDensity()` checks `interacts_with`, `involves`, `frustrates`.

---

## Output Structure

```
<series>/
├── PLAN.md                          # Series plan (gag table, characters)
├── TODO.md                          # Series-level tasks (episodes, assets)
├── bun_graphify_out/                # Series-level merged output
│   ├── merged-graph.json            # All nodes/edges + link_edges + communities
│   ├── link-edges.json              # Cross-episode link edges only
│   ├── graph.html                   # Interactive vis.js (episode coloring)
│   ├── regen-report.md              # Per-episode timing + stats table
│   ├── MERGED_REPORT.md             # Communities + link edge summary
│   └── consistency-report.md        # PASS/WARN/FAIL report
├── <series>-ch1-ep1/
│   ├── bun_graphify_out/
│   │   ├── graph.json               # Per-episode story KG
│   │   ├── .narrative_extract.json  # Raw extraction data
│   │   └── plan.json                # Run metadata
│   └── scripts/narration.ts         # Episode dialog source
```

---

## HTML Visualization

- **Library:** vis.js (vis-network) via CDN
- **Auto-detection:** merged-graph.json → merged mode; graph.json → single-episode mode
- **Merged mode features:**
  - Episode-based coloring (default) with By Type and By Community toggles
  - Link edges rendered dashed with distinct colors:
    - `same_character` → coral (#FF6B6B)
    - `story_continues` → teal (#4ECDC4)
    - `gag_evolves` → yellow (#FFE66D)
  - AI cross-links rendered dotted with distinct colors:
    - `character_theme_affinity` → pink (#FF85A1)
    - `gag_character_synergy` → gold (#FFD166)
    - `narrative_cluster` → teal (#06D6A0)
    - `story_anti_pattern` → red-pink (#EF476F)
  - PageRank glow: top 10% nodes get `borderWidth: 4` + `shadow` effect
  - PageRank in node tooltips and info panel
  - Episode legend with click-to-hide
  - Link edge legend with counts
  - AI cross-link legend with show/hide toggle checkbox
- **Single-episode mode:** Type-based coloring (existing behavior)
- **Both modes:** Search, node info panel with properties, community detection

---

## Status

- **v0.5.0** — Scene nodes, all-pairs same_character, narrator role
  - Scene nodes added (4 per episode: TitleScene, ContentScene1, ContentScene2, OutroScene)
  - same_character now all-pairs (not just sequential) — 61 links
  - Narrator excluded from uses_tech_term edges, marked as structural role
  - 7 episodes: 177 nodes, 371 edges, 85 link edges
  - Consistency: 13 PASS, 8 WARN, 0 FAIL
  - Remaining gaps: no escapeHtml, no per-episode HTML in pipeline, subagent JSON fragile
- **v0.6.0** — Series config system, my-core-is-boss support, Phase 23 foundation
  - **Series config system** (`series-config.ts`): auto-detect series, load character/tech/gag patterns
  - **my-core-is-boss**: 4 characters, game-UI tech terms, plot-lines.md gag source
  - **weapon-forger**: extracted existing hardcoded patterns into config (backward compatible)
  - **Absolute path validation** in episode + merge scripts
  - **HTML escape** in gen-story-html.ts
  - **Phase 23 types**: StoryCrossLink, CrossLinkType in types.ts
  - **Phase 23 algorithms**: story-algorithms.ts (PageRank, Jaccard, arc score, evolution score)
  - **Phase 23 prompt**: subagent-prompt.ts (buildCrossLinkPrompt)
  - my-core-is-boss results: 53 nodes, 72 edges (was 20/33), 5 PASS, 4 WARN
  - Remaining: ai-crosslink-generator.ts, pipeline step 4, vis.js AI cross-link rendering

---

## Phase 23 — AI Cross-Link Discovery (v0.8.0)

**Goal:** Use AI (Claude subagent) to analyze federated story KG,
discover non-obvious cross-episode patterns, and generate AI cross-link edges
alongside graph algorithm scores.

### 23-A Story Cross-Link Edge Types

| link_type | From → To | What It Reveals |
|-----------|-----------|-----------------|
| `character_theme_affinity` | character_instance ↔ theme/plot | Non-obvious character↔theme associations |
| `gag_character_synergy` | gag_manifestation ↔ character_instance | Which gags work best with which characters |
| `narrative_cluster` | scene ↔ scene (cross-ep) | Thematically grouped scenes |
| `story_anti_pattern` | episode_plot ↔ episode_plot | Repetitive plot structures, pacing problems |

Cross-link edge structure:
```
{
  from: string,           // node ID
  to: string,             // node ID
  link_type: string,      // one of above
  confidence: number,     // 0–1
  evidence: string[],     // supporting node/edge IDs
  generated_by: "ai" | "algorithm",
  rationale: string       // Human-readable explanation
}
```

Trigger: Run after merge step when ≥ 3 episodes exist in merged graph.

### 23-B Graph Algorithms for Narrative Analysis ✅

| Algorithm | Purpose | Story KG Application | Status |
|-----------|---------|---------------------|--------|
| PageRank | Identify influential nodes | Find structurally central characters (not just dialog-heavy) | Done |
| Jaccard Similarity | Compare episode structures | Detect repetitive plots across episodes | Done |
| Character Arc Score | Custom metric | Measure trait drift magnitude along same_character chains | Done |
| Gag Evolution Score | Custom metric | Measure gag variation depth along gag_evolves chains | Done |

### 23-C AI Cross-Link Generator ✅

- ✅ Subagent prompt template (`subagent-prompt.ts`): structured prompt with graph summary + algorithm metrics
- ✅ Orchestration (`ai-crosslink-generator.ts`): file-based subagent pattern
  - Reads merged-graph.json → computes PageRank + Jaccard → builds prompt
  - Writes `crosslink-input.json` (prompt + graph data + metrics)
  - Reads `crosslink-output.json` (Claude-generated JSON array) if present
  - Robust JSON parsing: fence stripping, array extraction, per-item validation
  - Patches merged-graph.json with validated `cross_links[]`
- ✅ merged-graph.json schema: optional `cross_links` field added
- ✅ Pipeline integration: step 3.5 in `graphify-pipeline.ts`

### 23-D Visualization ✅

- vis.js HTML: AI cross-links as dotted lines (distinct from dashed link edges)
  - `character_theme_affinity` → pink (#FF85A1)
  - `gag_character_synergy` → gold (#FFD166)
  - `narrative_cluster` → teal (#06D6A0)
  - `story_anti_pattern` → red-pink (#EF476F)
- High-PageRank nodes (top 10%) get glow/border effect (`shadow`, `borderWidth: 4`)
- PageRank in node tooltips and info panel
- Legend section for AI cross-links with type-specific colors
- Toggle: show/hide AI cross-links separately from deterministic link edges

### Known Limitations

1. **Manual AI invocation**: Pipeline writes `crosslink-input.json` but doesn't call Claude directly. Requires manual subagent step or future API integration.
2. **No algorithm-only cross-links**: `generated_by: "algorithm"` type is defined but never generated. Only AI cross-links flow through the pipeline.
3. **PageRank bias**: Raw PageRank favors high-degree nodes (plot nodes, scenes). Character-specific filtering would be more meaningful.
4. **Input size**: `crosslink-input.json` is ~66KB for 5 episodes. Larger series may hit context limits.

### Key Files

| Action | File | What |
|--------|------|------|
| Done | `src/scripts/series-config.ts` | SeriesConfig type, weapon-forger + my-core-is-boss configs, `detectSeries()` |
| Done | `src/scripts/story-algorithms.ts` | PageRank, Jaccard, arc/evolution scores |
| Done | `src/scripts/subagent-prompt.ts` | Cross-link discovery prompt builder (exports NodeSummary, EdgeSummary) |
| Done | `src/types.ts` | StoryCrossLink + CrossLinkType interfaces |
| Done | `src/scripts/ai-crosslink-generator.ts` | Cross-link orchestration: metrics → prompt → validate → patch |
| Done | `src/scripts/graphify-pipeline.ts` | Step 3.5: crosslink generator + HTML re-render |
| Done | `src/scripts/gen-story-html.ts` | AI cross-link dotted edges + PageRank glow + legend + toggle |

---

## Phase 27 — Hybrid Mode + Comparison Framework (v0.11.0, complete)

**Goal:** Combine regex density with AI-exclusive types. Validate with comparison tool. Set hybrid as default.

### What worked

- **Hybrid dedup is simple and effective** — regex wins on same node ID, AI adds exclusive types. No complex merging needed.
- **Comparison tool validates the approach** — `graphify-compare.ts` runs all 3 modes side-by-side and produces a clear recommendation table.
- **Hybrid scores 97 vs regex 54 vs ai 32** on my-core-is-boss (5 episodes). The regex density (31 traits, 29 tech terms) combined with AI exclusives (18 plot_events, 10 artifacts) dominates.

### Comparison results (my-core-is-boss)

| Metric | regex | ai | hybrid |
|--------|-------|----|--------|
| Total nodes | 109 | 98 | 199 |
| Node types | 5 | 8 | 8 |
| tech_term | 29 | 20 | 51 |
| character_trait | 31 | 10 | 44 |
| plot_event | 0 | 13 | 18 |
| artifact | 0 | 4 | 10 |
| Score | 54 | 32 | **97** |

### Gaps

1. **Hybrid has more WARN/FAIL** (15W/9F) than regex (6W/10F) — more nodes means more checks triggered. The scoring formula accounts for this, but individual check results should be reviewed per series.
2. **Per-episode breakdown in compare tool** derives from merged graph node attributes, not from per-episode graph.json. This works for merged stats but may miss per-episode nuances.
3. **AI cost** — hybrid mode makes 1 API call per episode (vs 0 for regex, 1 for ai). With z.ai glm-4.7-flash pricing, this is negligible.

### Key Files

| File | What |
|------|------|
| `src/ai-client.ts` | `parseArgsForAI()` default changed from `"regex"` to `"hybrid"` |
| `src/scripts/graphify-episode.ts` | Step 7.5: hybrid AI supplement merge (regex first, AI adds exclusives) |
| `src/scripts/graphify-pipeline.ts` | `--mode hybrid` passthrough to subprocesses |
| `src/scripts/graphify-compare.ts` | NEW — runs pipeline 3 modes, compares, recommends best default |
| All output files | Generation manifest: `{ generator, version, mode, ai_model, timestamp }` |

---

## Phase 26 — Dual-Mode Pipeline with pi-agent AI Integration (v0.10.0, complete)

**Goal:** Replace the manual file-based subagent handoff with direct pi-agent API calls, enabling a single-CLI execution for the entire pipeline. **Superseded by Phase 27 hybrid mode.**

### Problem Statement

The pipeline currently has **zero direct AI API calls**. All AI interaction uses a file-based handoff pattern:

```
Script writes crosslink-input.json → STOPS → human reads → sends to Claude → writes output → re-runs script
```

This means:
- Pipeline cannot run end-to-end without human intervention
- Per-episode NL analysis is only available via Claude Code Agent tool, not from CLI
- 3 AI touchpoints are manual: episode extraction, cross-link discovery, check enrichment

### Architecture

```
ai-client.ts (new — pi-ai SDK wrapper)
  │
  ├─ callAI(prompt, { provider, model, jsonMode })
  │   Default: z.ai glm-4.5-flash (fast, cheap, good for structured extraction)
  │   Fallback: graceful degradation to regex mode on API failure
  │
  └─ Used by:
      ├─ graphify-episode.ts --mode ai    → NL extraction (12 node types)
      ├─ ai-crosslink-generator.ts --mode ai → cross-link discovery
      └─ graphify-check.ts --mode ai      → check enrichment
```

### ai-client.ts Design

```typescript
// src/ai-client.ts
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";

export interface AIClientOptions {
  provider?: string;   // "zai" (default), "anthropic", "openai", "google"
  model?: string;      // "glm-4.5-flash" (default), or any pi-ai supported model
  jsonMode?: boolean;  // true (default) — expect JSON array/object response
  maxRetries?: number; // 2 (default)
}

export async function callAI(
  prompt: string,
  options?: AIClientOptions
): Promise<string> { ... }

export function parseArgsForAI(args: string[]): AIClientOptions {
  // Parse --mode ai --provider zai --model glm-4.5-flash from CLI args
}
```

### Episode NL Extraction Prompt (--mode ai)

New `buildEpisodeExtractionPrompt()` in `subagent-prompt.ts`:
- Input: narration.ts content + series config (character names, known patterns)
- Output: structured JSON with 12 node types + edges
- Prompt instructs: return `{ nodes: GraphNode[], edges: GraphEdge[] }`

### Per-Touchpoint Details

| Touchpoint | Current (regex) | --mode ai | Model | Why Flash |
|---|---|---|---|---|
| Episode extraction | 6 node types, regex | 12 node types, NL | glm-4.7-flash | Structured output from text, no reasoning needed |
| Cross-link discovery | Writes file → stops | Direct API call → patch | glm-4.7-flash | Pattern recognition on graph metrics |
| Check enrichment | Writes file → stops | Direct API call → analysis | glm-4.7-flash | zh_TW text generation from structured input |

### Fallback Strategy

Every AI call wraps in try/catch with fallback:
1. API call fails (network, rate limit, auth) → log warning, fall back to regex mode
2. JSON parse fails → log warning, retry once with stricter prompt, then fall back
3. Validation fails (invalid node IDs) → log warning, skip invalid items, continue pipeline

### CLI Integration

```bash
# Default: regex mode (backward compatible, no API key needed)
bun run --cwd bun_app/bun_graphify src/scripts/graphify-pipeline.ts <series-dir>

# Full AI mode: all touchpoints automated
bun run --cwd bun_app/bun_graphify src/scripts/graphify-pipeline.ts <series-dir> --mode ai

# AI mode with specific provider/model
bun run --cwd bun_app/bun_graphify src/scripts/graphify-pipeline.ts <series-dir> --mode ai --provider anthropic --model claude-haiku-4-5-20251001

# Single episode in AI mode
bun run --cwd bun_app/bun_graphify src/scripts/graphify-episode.ts <ep-dir> --mode ai
```

### Relationship to Phase 24/25

Phase 26 is **orthogonal** to Phase 24 (story quality) and Phase 25 (Remotion framework):
- Phase 24 adds new checks (duplicate content, plot arc, foreshadowing, character growth) — these also use the file-based subagent pattern
- Phase 26 upgrades the **delivery mechanism** for ALL subagent calls (Phase 23 + Phase 24 + future)
- Phase 26 should be implemented first or in parallel, as it benefits all subsequent phases

### Dependencies

- `@mariozechner/pi-ai` — already in `bun_pi_agent/package.json`, needs adding to `bun_graphify/package.json`
- `ZAI_API_KEY` env var — already configured in `~/.zshrc`
- bun_graphify package.json — add `pi-ai` as optional peer dependency
