# bun_graphify — Federated Story Knowledge Graph

> **Cross-linked docs:**
>
> Skill folder (this) | Code folder
> ---|---
> `PLAN.md` — Architecture, node types, edge relations | `bun_app/bun_graphify/PLAN.md` — Code-level plan + reuse reference
> `TODO.md` — Pipeline tasks, run history, known issues | `bun_app/bun_graphify/TODO.md` — Code-level tasks (file/line specific)
> `SKILL.md` — Operational playbook, commands | —

## Architecture (v0.4.0)

```
narration.ts (per episode)
  │
  ├─ [graphify-episode.ts] Regex extraction (fast, shallow)
  │   Produces: episode_plot, character_instance, tech_term,
  │             gag_manifestation, character_trait
  │
  ├─ [subagent] NL analysis (slow, rich) — via SKILL.md instructions
  │   Produces: episode_plot, scene, character_instance, plot_event,
  │             artifact, running_gag, character_trait, relationship, theme
  │
  └─ [gen-story-html.ts] graph.json → vis.js HTML (single + merged)
      │
      └─ [graphify-merge.ts] Concatenate sub-graphs + cross-episode link edges
          │
          ├─ same_character: ch1ep1_char_zhoumo ↔ ch1ep2_char_zhoumo
          ├─ story_continues: ch1ep1_plot → ch1ep2_plot → ...
          ├─ gag_evolves: ch1ep1_gag_X → ch1ep2_gag_X → ...
          │
          └─ [graphify-check.ts] Traverse link edges → consistency report
```

### Simplified Merge (v0.4.0)

**No synthetic nodes.** The merge concatenates per-episode sub-graphs and adds cross-episode link edges. Every node carries its `episode` property to identify source sub-graph.

| What v0.3.0 had | What v0.4.0 does |
|------------------|-------------------|
| `char_zhoumo` canonical node | Removed — link edges connect instances directly |
| `instance_of` edges (char → canonical) | Removed — `same_character` links connect ep↔ep |
| `arc_ch1` story arc nodes | Removed — `story_continues` links chain plots |
| `gag_type_X` canonical nodes | Removed — `gag_evolves` links chain manifestations |

---

## Node Types

### Regex Pipeline (graphify-episode.ts)

| Type | ID Format | Source |
|------|-----------|--------|
| episode_plot | `ch1ep1_plot` | narration.ts title match |
| character_instance | `ch1ep1_char_{id}` | narration.ts `character:` fields |
| tech_term | `ch1ep1_tech_{term}` | Regex pattern match on dialog text |
| gag_manifestation | `ch1ep1_gag_{type}` | PLAN.md gag table column match |
| character_trait | `ch1ep1_trait_{char}_{trait}` | Predefined regex patterns per character |

### Subagent Pipeline (richer)

| Type | ID Format | Source |
|------|-----------|--------|
| (all regex types) | + `scene`, `plot_event`, `artifact`, `relationship`, `theme` | NL analysis |

### Regex Pipeline Limitations

1. **Characters:** Only detects from `character:` dialog fields. Characters mentioned in narration text but not speaking are missed (e.g., 滄溟子 in ch2ep3).
2. **Gags:** Requires PLAN.md gag table column for the episode. Missing column = no gag nodes.
3. **Traits:** Predefined regex patterns only. Misses traits not in the pattern list. No false positive control.
4. **No:** scenes, plot_events, artifacts, relationships, themes — these require subagent analysis.

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
| `graphify-episode.ts` | Regex extraction from narration.ts → per-episode graph.json |
| `graphify-merge.ts` | Concatenate + link edges → merged-graph.json |
| `graphify-check.ts` | Consistency checking via link edge traversal |
| `graphify-pipeline.ts` | Orchestrate: episode → merge → html → check |
| `gen-story-html.ts` | graph.json → vis.js HTML (auto-detects single vs merged) |
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
  - Episode-based coloring (default) with By Type toggle
  - Link edges rendered dashed with distinct colors:
    - `same_character` → coral (#FF6B6B)
    - `story_continues` → teal (#4ECDC4)
    - `gag_evolves` → yellow (#FFE66D)
  - Episode legend with click-to-hide
  - Link edge legend with counts
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

## Phase 23 — AI Cross-Link Discovery 🔲

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

### 23-B Graph Algorithms for Narrative Analysis

Extend existing `src/analyze.ts` (already has betweennessCentrality, godNodes, bridgeNodes):

| Algorithm | Purpose | Story KG Application |
|-----------|---------|---------------------|
| PageRank | Identify influential nodes | Find structurally central characters (not just dialog-heavy) |
| Jaccard Similarity | Compare episode structures | Detect repetitive plots across episodes |
| Character Arc Score | Custom metric | Measure trait drift magnitude along same_character chains |
| Gag Evolution Score | Custom metric | Measure gag variation depth along gag_evolves chains |

### 23-C AI Cross-Link Generator

- Read merged-graph.json + algorithm outputs (PageRank scores, similarity matrix)
- Call Claude subagent with structured prompt:
  - Input: character summaries, plot summaries, gag summaries, algorithm scores
  - Prompt: "Analyze these narrative elements for non-obvious cross-episode connections..."
  - Output: `StoryCrossLink[]` (structured JSON)
- Write cross-links into merged-graph.json as new edges with `generated_by: "ai"`
- Triggered by: `graphify-pipeline.ts` step 4 (after merge, before check)

### 23-D Visualization Enhancements

- vis.js HTML: AI cross-links as dotted lines (distinct from dashed link edges)
  - `character_theme_affinity` → purple (#9B59B6)
  - `gag_character_synergy` → orange (#E67E22)
  - `narrative_cluster` → blue (#3498DB)
  - `story_anti_pattern` → red (#E74C3C)
- High-PageRank nodes get a glow/border effect
- Legend section for AI cross-links with confidence display
- Toggle: show/hide AI cross-links separately from deterministic link edges

### Key Files

| Action | File | What |
|--------|------|------|
| New | `src/scripts/story-algorithms.ts` | PageRank, Jaccard, arc/evolution scores |
| New | `src/scripts/ai-crosslink-generator.ts` | Claude subagent call + result parsing |
| Modify | `src/scripts/graphify-pipeline.ts` | Add step 4: algorithm + AI cross-link |
| Modify | `src/scripts/gen-story-html.ts` | Render AI cross-links + PageRank glow |
| Modify | `src/scripts/graphify-merge.ts` | Include cross_links in merged output |
