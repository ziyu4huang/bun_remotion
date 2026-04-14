---
name: bun_graphify
description: Bun/TypeScript knowledge graph generator — codebase AST analysis AND federated story knowledge graph for Remotion series
trigger: /bun_graphify
---

# /bun_graphify

Bun/TypeScript knowledge graph generator with two modes:
1. **Codebase mode** — AST extraction from source code → code structure graph
2. **Story KG mode** — Natural language analysis of narration.ts → federated story knowledge graph

## Prerequisites

```bash
bun install --cwd bun_app/bun_graphify
python -c "import graphify" 2>/dev/null || pip install graphifyy -q
```

## Mode Detection

- Path is a **Remotion episode directory** (contains `scripts/narration.ts`) → **Single Episode mode**
- Path is a **Remotion series directory** (contains episode dirs matching `*-ch*-ep*`) → **Pipeline mode** (all episodes)
- Otherwise → **Codebase mode** (AST pipeline)

---

## Operations

### op: pipeline `<series-dir>`

Full federated graph pipeline: episode extraction → merge → HTML → consistency check.

**Command:**
```bash
bun run --cwd bun_app/bun_graphify src/scripts/graphify-pipeline.ts <series-dir>
```

**Inputs:**
- Series directory containing episode dirs (`*-ch*-ep*`)
- Each episode dir has `scripts/narration.ts`
- Optional: `PLAN.md` at series root (for gag table, character metadata)

**Outputs:**
- Per-episode: `<ep-dir>/bun_graphify_out/graph.json`
- Series-level: `<series-dir>/bun_graphify_out/merged-graph.json`
- Series-level: `<series-dir>/bun_graphify_out/graph.html` (interactive visualization)
- Series-level: `<series-dir>/bun_graphify_out/link-edges.json`
- Series-level: `<series-dir>/bun_graphify_out/consistency-report.md`

**Validation:**
1. Check all episodes processed: `ls <series-dir>/*/bun_graphify_out/graph.json | wc -l`
2. Check merged graph exists: `test -f <series-dir>/bun_graphify_out/merged-graph.json`
3. Check link edges present: `cat <series-dir>/bun_graphify_out/link-edges.json | jq length`
4. Check HTML opens without JS errors: `open <series-dir>/bun_graphify_out/graph.html`

**Knowledge Capture:** Record node counts, link edge counts, check results (PASS/WARN/FAIL) to TODO.md.

---

### op: episode `<episode-dir>`

Extract story KG for a single episode from narration.ts.

**Command:**
```bash
bun run --cwd bun_app/bun_graphify src/scripts/graphify-episode.ts <episode-dir> [--series-dir <series-dir>]
```

**Inputs:**
- Episode directory with `scripts/narration.ts`
- Optional `--series-dir` for PLAN.md gag matching

**Outputs:**
- `<ep-dir>/bun_graphify_out/graph.json` — Episode story KG
- `<ep-dir>/bun_graphify_out/.narrative_extract.json` — Raw extraction data
- `<ep-dir>/bun_graphify_out/plan.json` — Run metadata

**Subagent Alternative:** For richer analysis, spawn a Claude subagent to analyze narration.ts and produce story KG JSON with node types: `episode_plot`, `scene`, `character_instance`, `plot_event`, `artifact`, `running_gag`, `character_trait`, `relationship`, `theme`.

**Validation:** Check graph.json has 20-50 nodes. Verify JSON is valid: `jq . <ep-dir>/bun_graphify_out/graph.json > /dev/null`.

---

### op: merge `<series-dir>`

Merge per-episode sub-graphs into federated graph with cross-episode link edges.

**Command:**
```bash
bun run --cwd bun_app/bun_graphify/src/scripts/graphify-merge.ts <series-dir>
```

**Inputs:** All `<ep-dir>/bun_graphify_out/graph.json` files + optional `PLAN.md`

**Outputs:**
- `bun_graphify_out/merged-graph.json` — All nodes/edges + link edges
- `bun_graphify_out/link-edges.json` — Cross-episode link edges only
- `bun_graphify_out/MERGED_REPORT.md` — Summary report

**Link Edge Types (anchors for consistency checking):**
| Link Edge | Connects | Checks For |
|-----------|----------|------------|
| `same_character` | Character A in ep1 ↔ A in ep2 | Trait drift, personality conflict |
| `story_continues` | Plot node ep1 → Plot node ep2 | Duplicate plot, story arc gaps |
| `gag_evolves` | Gag manifestation → next | Stagnation, repetition |

**Validation:**
- Link edges exist: `jq '. | length' link-edges.json`
- Every node has `episode` property: `jq '.nodes[] | select(.episode == null)' merged-graph.json` should be empty

---

### op: html `<dir>`

Generate interactive vis.js HTML visualization.

**Command:**
```bash
bun run --cwd bun_app/bun_graphify src/scripts/gen-story-html.ts <dir>
```

Auto-detects:
- `<dir>` contains `bun_graphify_out/merged-graph.json` → merged mode (episode coloring)
- `<dir>` contains `bun_graphify_out/graph.json` → single episode mode (type coloring)

**Features:**
- Episode-based coloring (default for merged) with type toggle
- Link edges shown as dashed colored lines
- Search, node info panel, legend with click-to-hide

**Validation:** Open in browser. Check no console errors. Verify toggle works.

---

### op: check `<series-dir>`

Run consistency checks on merged graph via link edge traversal.

**Command:**
```bash
bun run --cwd bun_app/bun_graphify src/scripts/graphify-check.ts <series-dir>
```

**Inputs:** `bun_graphify_out/merged-graph.json` + `link-edges.json`

**Outputs:** `bun_graphify_out/consistency-report.md`

**Checks:**
| Check | Traverses | Detects |
|-------|-----------|---------|
| Character Consistency | `same_character` links | Missing core traits across episodes |
| Gag Evolution | `gag_evolves` links | Identical/near-identical manifestations |
| Tech Term Diversity | Per-episode nodes | <2 tech terms per episode |
| Trait Coverage | Character nodes | Characters with no detected traits |
| Interaction Density | Per-episode edges | Characters with no interactions |

---

### op: codebase `<path>`

AST extraction from source code → code structure graph.

**Command:**
```bash
bun run --cwd bun_app/bun_graphify src/cli.ts full <paths...> --output-dir graphify-out
```

**Validation:** Show stats. Offer to open graph.html.

---

## Knowledge Capture Protocol

After EVERY operation, Claude MUST:

1. **Inspect output** — Read JSON stats, check node/edge counts
2. **Record to TODO.md:**
   - Mark completed items as `[x]`
   - Add warnings/anomalies as new `[ ]` items
   - Note any script errors or unexpected behavior
3. **Capture lessons** — If a new lesson was learned (script bug, format mismatch, etc.):
   - Write to `.agent/memory/feedback/` with type `feedback`
   - Follow existing memory file format (YAML frontmatter + structured content)
4. **Update this SKILL.md** — If a command or behavior changed, update the relevant operation section

## Self-Reflection Checklist

After completing a full pipeline run, Claude MUST review:

1. **Output quality:**
   - Per-episode graphs: 20-50 nodes each?
   - Merged graph: link edges present for all expected types?
   - Consistency report: any FAIL items that need attention?
   - HTML: opens without errors, visualization is readable?

2. **Cross-episode links:**
   - `same_character`: Are all recurring characters linked across episodes?
   - `story_continues`: Is the plot chain complete and in order?
   - `gag_evolves`: Do gag chains match PLAN.md gag table?

3. **Comparison with previous run** (if applicable):
   - Node counts changed? Why?
   - Previously failing checks now pass?
   - Any new warnings?

4. **Record findings** to TODO.md and feedback memory.

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `src/cli.ts` | Codebase mode: detect → extract → build → cluster → export |
| `src/scripts/graphify-episode.ts` | Per-episode regex extraction from narration.ts |
| `src/scripts/graphify-merge.ts` | Concatenate sub-graphs + add link edges |
| `src/scripts/graphify-check.ts` | Consistency checking via link edges |
| `src/scripts/graphify-pipeline.ts` | Full pipeline: episode → merge → html → check |
| `src/scripts/gen-story-html.ts` | graph.json → vis.js HTML (single + merged) |
| `src/scripts/codebase-map.ts` | Generate CODEBASE_MAP.md |

## Important Notes

- **bun_graphify_out/** is in `.gitignore` — output is ephemeral
- **Never put TypeScript syntax in HTML templates** — crashes browsers
- **Subagent JSON is fragile** — always validate with try/catch before writing
- **Always run from `bun_app/bun_graphify/` cwd** — graphology imports need it

## See Also

- [PLAN.md](PLAN.md) — Full architecture, node types, edge relations
- [TODO.md](TODO.md) — Pipeline-level tasks, run history, known issues
- [../../bun_app/bun_graphify/PLAN.md](../../bun_app/bun_graphify/PLAN.md) — Code-level plan + reuse reference
- [../../bun_app/bun_graphify/TODO.md](../../bun_app/bun_graphify/TODO.md) — Code-level tasks (file/line specific)
