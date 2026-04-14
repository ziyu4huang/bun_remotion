# bun_graphify — Code TODO

> Cross-linked with skill docs:
> - Skill PLAN: `.claude/skills/bun_graphify/PLAN.md`
> - Skill TODO: `.claude/skills/bun_graphify/TODO.md`
> - Skill usage: `.claude/skills/bun_graphify/SKILL.md`

## Code-level Tasks

These are implementation tasks in `bun_app/bun_graphify/src/`. For architecture and pipeline-level tasks, see `.claude/skills/bun_graphify/TODO.md`.

### P0 — Fix next

- [ ] **All scripts: enforce absolute path for dir args**
  - graphify-episode.ts and graphify-merge.ts now validate. Still needed: `graphify-pipeline.ts`, `gen-story-html.ts`, `graphify-check.ts`
  - Files: `graphify-pipeline.ts`, `gen-story-html.ts`, `graphify-check.ts`

### P1 — Code quality

- [x] **gen-story-html.ts: escape HTML in node labels**
  - Added `escapeHtml()` in embedded script, applied to node labels, properties, neighbor names
  - File: `src/scripts/gen-story-html.ts`

- [ ] **graphify-check.ts: reduce false positive WARN**
  - Add `source` field to CheckResult: `"regex"` or `"subagent"` so report readers know which pipeline produced the data
  - Adjust trait coverage threshold: if episode has <3 lines for a character, skip trait check (not enough data)
  - File: `src/scripts/graphify-check.ts`

- [ ] **graphify-pipeline.ts: per-episode HTML generation**
  - Add step 1.5: run gen-story-html.ts on each episode dir after extraction
  - Currently only generates merged HTML
  - File: `src/scripts/graphify-pipeline.ts`

### P2 — Architecture

- [ ] **Unified node ID convention**
  - Regex: `${EP_ID}_gag_${gagName.replace(/\s+/g, "_")}`
  - Subagent: `${EP_ID}_gag_${type}` (different naming)
  - Define a canonical ID function shared by both pipelines
  - Files: `graphify-episode.ts`, subagent prompt template

- [ ] **Incremental pipeline**
  - Check `narration.ts` mtime vs `graph.json` mtime
  - Skip episode extraction if unchanged
  - File: `src/scripts/graphify-pipeline.ts`

## Scripts Reference

| Script | Lines | Status |
|--------|-------|--------|
| `src/cli.ts` | ~250 | Stable |
| `src/scripts/graphify-episode.ts` | ~480 | Stable — text-mention + gag fallback done |
| `src/scripts/graphify-merge.ts` | ~436 | Needs same_character fix |
| `src/scripts/graphify-check.ts` | ~450 | Needs false positive reduction |
| `src/scripts/graphify-pipeline.ts` | ~150 | Needs per-episode HTML |
| `src/scripts/gen-story-html.ts` | ~330 | Needs HTML escape |

## Phase 23 — AI Cross-Link Discovery 🔲

### P0 — Type + schema
- [x] **types.ts: StoryCrossLink interface** — Added CrossLinkType union + StoryCrossLink to `src/types.ts`
- [ ] **graphify-merge.ts: cross_links in output** — Add `cross_links: StoryCrossLink[]` to merged-graph.json schema

### P1 — Algorithms
- [x] **story-algorithms.ts: PageRank** — `computePageRank()` + `getTopKByPageRank()` via graphology-pagerank
- [x] **story-algorithms.ts: Jaccard similarity** — `computeJaccardSimilarity()` comparing node type + edge pattern sets
- [x] **story-algorithms.ts: Character arc score** — `computeCharacterArcScore()` measures trait drift along same_character chains
- [x] **story-algorithms.ts: Gag evolution depth** — `computeGagEvolutionScore()` measures word-level variation

### P2 — AI generator
- [x] **subagent-prompt.ts: Cross-link prompt builder** — `buildCrossLinkPrompt()` with graph summary + PageRank + Jaccard metrics
- [ ] **ai-crosslink-generator.ts: Subagent orchestrator** — Read merged-graph.json + algorithm outputs, build prompt, spawn subagent, parse JSON
- [ ] **graphify-pipeline.ts: Step 4 integration** — After merge, run algorithms → AI generator → write cross_links

### P3 — Visualization
- [ ] **gen-story-html.ts: AI cross-link rendering** — Dotted edges with type-specific colors, confidence-based opacity
- [ ] **gen-story-html.ts: PageRank glow** — High-score nodes get highlighted border
- [ ] **gen-story-html.ts: Cross-link legend + toggle** — Separate toggle from deterministic link edges

---

## Done

- [x] **Series config system** — `series-config.ts`: SeriesConfig type, weapon-forger + my-core-is-boss configs, `detectSeries()` auto-detection
- [x] **graphify-episode.ts: series config refactoring** — Replaced hardcoded CHAR_NAMES, TECH_PATTERNS, TRAIT_PATTERNS with config-based lookup; added plot-lines.md gag parsing branch
- [x] **graphify-merge.ts: series config refactoring** — Replaced hardcoded charNames, added plot-lines.md gag chain parsing
- [x] **narrative.ts: generic episode detection** — Replaced weapon-forger-specific EPISODE_DIR_PATTERN with generic pattern; `detectEpisodes()` accepts optional pattern
- [x] **gen-story-html.ts: HTML escape** — Added `escapeHtml()`, applied to node labels, properties, neighbors, titles
- [x] **Absolute path validation** — graphify-episode.ts and graphify-merge.ts validate absolute paths at entry
- [x] **Phase 23: StoryCrossLink type** — Added to types.ts with link_type union, confidence, evidence, generated_by, rationale
- [x] **Phase 23: story-algorithms.ts** — PageRank (graphology-pagerank), Jaccard similarity, character arc score, gag evolution score
- [x] **Phase 23: subagent-prompt.ts** — `buildCrossLinkPrompt()` with graph summary + algorithm metrics
- [x] graphify-episode.ts: text-mention character fallback — `CHAR_NAMES` mapping detects characters in narration text (e.g., 滄溟子 in ch2ep3)
- [x] graphify-episode.ts: gag detection without PLAN.md column — fallback checks `colEpId === EP_ID` + truthy manifestation
