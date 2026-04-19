# storygraph — Code TODO

> Cross-linked with skill docs:
> - Skill PLAN: `.claude/skills/storygraph/PLAN.md`
> - Skill TODO: `.claude/skills/storygraph/TODO.md`
> - Skill usage: `.claude/skills/storygraph/SKILL.md`

## Code-level Tasks

These are implementation tasks in `bun_app/storygraph/src/`. For architecture and pipeline-level tasks, see `.claude/skills/storygraph/TODO.md`.

### Phase 26 — Dual-Mode Pipeline with pi-agent AI Integration

> See `.claude/skills/storygraph/PLAN.md` Phase 26 for architecture.

#### P0 — Core infrastructure ✅

- [x] **26-A1: src/ai-client.ts** (~120 lines)
  - `callAI(prompt, overrides?)` → `string | null`
  - `parseArgsForAI(args)` → `{ mode, provider, model }`
  - Default: zai/glm-4.7-flash
  - JSON mode: strip markdown fences, validate with JSON.parse, retry once
  - Error handling: rate limit → 2s wait → retry; auth → immediate null

- [x] **26-A2: package.json** — Added `@mariozechner/pi-ai@0.67.68`

#### P1 — AI touchpoint automation

- [x] **26-B1: subagent-prompt.ts — buildEpisodeExtractionPrompt()** (~120 lines added)
  - Input: EpisodeExtractionInput (episode_id, narration_text, charNames, techPatterns)
  - 8 node types, 8 edge relation types (regex-compatible + triggers, uses, relates_to)
  - Narration truncated to ~3000 chars for context budget

- [x] **26-B2: graphify-episode.ts — --mode ai branch** (~60 lines added)
  - Title extraction hoisted before AI branch (shared by both paths)
  - AI branch: buildEpisodeExtractionPrompt() → callAI() → validate → fill defaults
  - Validates: node IDs start with EP_ID prefix, edge source/target exist
  - Falls back to regex Steps 2-7 on any failure
  - Regex mode verified working against weapon-forger ch1-ep1

- [x] **26-B3: ai-crosslink-generator.ts — --mode ai branch**
  - Parse `--mode ai` from args
  - When ai mode: after building prompt (existing code), call `callAI(prompt)` instead of writing crosslink-input.json
  - Parse response using existing `validateCrossLinks()` logic
  - Patch merged-graph.json as before
  - If API call fails: fall through to existing file-based pattern (backward compat)

- [x] **26-B4: graphify-check.ts — --mode ai branch**
  - Parse `--mode ai` from args
  - When ai mode: after writing check-enrichment-input.json, call `callAI(prompt)`
  - Write check-enrichment-output.md from response
  - If API call fails: skip enrichment (report still generated, just without LLM analysis)

#### P2 — Pipeline integration

- [x] **26-C1: graphify-pipeline.ts — --mode ai passthrough**
  - Parse `--mode`, `--provider`, `--model` from top-level args
  - Pass through to all `Bun.spawnSync` calls for episode, crosslink, check
  - Log mode at pipeline start: `Running in AI mode (zai/glm-4.7-flash)`

### Phase 27 — Hybrid Mode + Comparison Framework ✅

- [x] **27-A1: ai-client.ts — hybrid mode type**
  - `parseArgsForAI()` returns `"hybrid"` as valid mode
  - Default changed from `"regex"` to `"hybrid"`

- [x] **27-A2: graphify-episode.ts — hybrid extraction**
  - Regex runs first (steps 2-7), always
  - AI supplement (step 7.5): calls callAI(), merges exclusive nodes/edges
  - Dedup: regex wins on same node ID; AI edges only added if both endpoints exist
  - Logs exclusive node counts by type

- [x] **27-A3: graphify-pipeline.ts — hybrid passthrough**
  - `--mode hybrid` passed to all subprocesses
  - Console log shows HYBRID mode with provider/model

- [x] **27-A4: graphify-compare.ts — mode comparison tool**
  - Runs pipeline 3 times (regex, ai, hybrid)
  - Compares: node counts by type, edge counts by relation, quality metrics
  - Scores each mode and recommends best default
  - Restores best mode's output to storygraph_out/

- [x] **27-A5: Generation manifest**
  - graph.json: `{ manifest: { generator, version, mode, ai_model, timestamp } }`
  - merged-graph.json: `{ manifest: { generator, version, timestamp, episode_count, ... } }`
  - consistency-report.md: Generator, mode, AI model, source manifest
  - graph.html: `<meta name="generator">` + visible footer bar

### P0 — Fixes ✅

- [x] **All scripts: enforce absolute path for dir args**
  - All 9 scripts now validate: graphify-episode.ts, graphify-merge.ts, graphify-pipeline.ts, gen-story-html.ts, graphify-check.ts, ai-crosslink-generator.ts, graphify-gen-prompt.ts, extract-plan.ts, extract-corpus.ts
  - Pattern: `if (!dir.startsWith("/")) { console.error(...); process.exit(1); }`

### P1 — Code quality (done)

- [x] **gen-story-html.ts: escape HTML in node labels**
- [x] **graphify-check.ts: reduce false positive WARN**
- [x] **ai-crosslink-generator.ts: file-based subagent orchestration**
- [x] **gen-story-html.ts: AI cross-link visualization**
- [x] **graphify-pipeline.ts: step 3.5 AI cross-link discovery**

### P1 — Code quality (remaining)

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

### Phase 30 — Genre-Aware KG Pipeline (planned)

> See `.claude/skills/remotion-best-practices/PLAN.md` Phase 30 for architecture.
> Fixes hard-coded regex overfitting to my-core-is-boss.

- [ ] **30-A1: Genre enum + scoring profiles in SeriesConfig** — `series-config.ts`
- [ ] **30-A2: Genre-weighted scoring** — `graphify-compare.ts`
- [ ] **30-B1: Comedy arc analysis (checkComedyArc)** — `graphify-check.ts`
- [ ] **30-B2: Gag diversity score** — `story-algorithms.ts`
- [ ] **30-B3: Comedy subagent prompt** — `subagent-prompt.ts`
- [ ] **30-C1: Effect pattern per genre** — `series-config.ts`, `graphify-episode.ts`
- [ ] **30-C2: Title pattern per genre** — `series-config.ts`

### Phase 31 — Subagent-Based KG Quality Scoring (planned)

> Uses LLM subagent to evaluate KG quality instead of programmatic-only scoring.
> See `.claude/skills/remotion-best-practices/PLAN.md` Phase 31 for architecture.

- [ ] **31-A1: buildKGScorePrompt()** — `subagent-prompt.ts`
- [ ] **31-A2: scoreKG() orchestrator** — `graphify-score.ts` (NEW)
- [ ] **31-A3: Subagent scores in comparison report** — `graphify-compare.ts`
- [ ] **31-B1: Test corpus** — `test-corpus/` directory
- [ ] **31-B2: Regression runner** — `graphify-regression.ts` (NEW)

## Scripts Reference

| Script | Lines | Status |
|--------|-------|--------|
| `src/cli.ts` | ~250 | Stable |
| `src/ai-client.ts` | ~120 | **New (Phase 26)** — pi-ai SDK wrapper: callAI(), parseArgsForAI() |
| `src/scripts/series-config.ts` | ~130 | **New** — SeriesConfig type + configs + detectSeries() |
| `src/scripts/graphify-episode.ts` | ~550 | **+--mode ai** — AI extraction with regex fallback, config-driven, path validation |
| `src/scripts/graphify-merge.ts` | ~470 | Refactored — config-driven, plot-lines.md gag chains, path validation |
| `src/scripts/graphify-check.ts` | ~450 | Needs false positive reduction; Phase 26: +--mode ai enrichment |
| `src/scripts/graphify-pipeline.ts` | ~150 | Needs per-episode HTML + step 4; Phase 26: +--mode ai passthrough |
| `src/scripts/gen-story-html.ts` | ~340 | HTML escape done |
| `src/scripts/story-algorithms.ts` | ~170 | **New** — PageRank, Jaccard, arc/evolution scores |
| `src/scripts/subagent-prompt.ts` | ~250 | Cross-link + plot arc + foreshadow + episode extraction prompt builders |
| `src/scripts/ai-crosslink-generator.ts` | ~240 | File-based subagent orchestration; Phase 26: +--mode ai direct call |

---

## Development History

### Phase 26-A/B1/B2 — AI Pipeline Foundation (2026-04-18)

| Task | Status | Lines | Notes |
|------|--------|-------|-------|
| P0: Absolute path validation (9 scripts) | ✅ | ~3 each | extract-plan.ts, extract-corpus.ts added beyond original scope |
| 26-A1: ai-client.ts | ✅ | ~120 | pi-ai SDK wrapper, callAI() + parseArgsForAI() |
| 26-A2: @mariozechner/pi-ai dependency | ✅ | — | v0.67.68 installed |
| 26-B1: buildEpisodeExtractionPrompt() | ✅ | ~120 | 8 node types, 8 edge relations, ~3000 char context |
| 26-B2: graphify-episode.ts --mode ai | ✅ | ~60 | AI branch with regex fallback, verified against weapon-forger ch1-ep1 |

**Decisions:**
- Default model: `glm-4.7-flash` (not planned `glm-4.5-flash` — 4.7-flash is current and available)
- Node types reduced from 12 to 8: removed `running_gag`, `relationship`, `theme` (overlap with existing types)
- Title extraction hoisted before AI branch (shared by regex + AI paths)
- Narration truncated to ~3000 chars to stay within context budget

---

## Done

- [x] **Phase 26-A complete** — ai-client.ts + @mariozechner/pi-ai dependency
- [x] **Phase 26-B1 complete** — buildEpisodeExtractionPrompt() in subagent-prompt.ts
- [x] **Phase 26-B2 complete** — graphify-episode.ts --mode ai with regex fallback
- [x] **Absolute path validation** — All 9 scripts enforce absolute paths
- [x] **Series config system** — `series-config.ts`: SeriesConfig type, weapon-forger + my-core-is-boss configs, `detectSeries()` auto-detection
- [x] **graphify-episode.ts: series config refactoring** — Replaced hardcoded CHAR_NAMES, TECH_PATTERNS, TRAIT_PATTERNS with config-based lookup; added plot-lines.md gag parsing branch
- [x] **graphify-merge.ts: series config refactoring** — Replaced hardcoded charNames, added plot-lines.md gag chain parsing
- [x] **narrative.ts: generic episode detection** — Replaced weapon-forger-specific EPISODE_DIR_PATTERN with generic pattern; `detectEpisodes()` accepts optional pattern
- [x] **gen-story-html.ts: HTML escape** — Added `escapeHtml()`, applied to node labels, properties, neighbors, titles
- [x] **Phase 23: StoryCrossLink type** — Added to types.ts with link_type union, confidence, evidence, generated_by, rationale
- [x] **Phase 23: story-algorithms.ts** — PageRank (graphology-pagerank), Jaccard similarity, character arc score, gag evolution score
- [x] **Phase 23: subagent-prompt.ts** — `buildCrossLinkPrompt()` with graph summary + algorithm metrics
- [x] graphify-episode.ts: text-mention character fallback — `CHAR_NAMES` mapping detects characters in narration text (e.g., 滄溟子 in ch2ep3)
- [x] graphify-episode.ts: gag detection without PLAN.md column — fallback checks `colEpId === EP_ID` + truthy manifestation
