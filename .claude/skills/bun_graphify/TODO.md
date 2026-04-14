# bun_graphify TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/bun_graphify/PLAN.md` — Architecture, node types, edge relations
> - Skill TODO: `.claude/skills/bun_graphify/TODO.md` — **(this file)** Pipeline-level tasks, run history
> - Skill SKILL: `.claude/skills/bun_graphify/SKILL.md` — Operational playbook
> - Code PLAN: `bun_app/bun_graphify/PLAN.md` — Code-level plan + reuse reference
> - Code TODO: `bun_app/bun_graphify/TODO.md` — Code-level tasks (file/line specific)
>
> **Rule:** Pipeline/architecture tasks → this file. Code implementation tasks → `bun_app/bun_graphify/TODO.md`.

> **Status:** v0.4.0 — Simplified federated merge, episode coloring, operational SKILL

## Known Issues (from 2026-04-14 pipeline run)

- **`soul` has no same_character links** — Only 1 episode instance → no cross-episode link possible. Expected for single-episode characters.
- **8 WARN all from regex trait limitations** — Predefined trait patterns miss traits when dialog doesn't match regex. `萬物皆可修`, `毒舌警告` etc. are core traits per PLAN.md but regex misses them in some episodes. **Root cause:** regex pipeline uses pattern matching; subagent would catch these.
- **ch3ep1 has only 3 tech terms** — Below the diversity threshold but only a WARN, not a FAIL.
- **Generated graphify files tracked by mistake** — `.graphify_detect.json` and `**/.graphify_ast.json` were committed. Now gitignored as of 2026-04-14.

## P0 — Fix next

- [ ] **graphify-merge.ts: same_character for non-adjacent episodes** — Currently only links sequential episodes (ep[i] ↔ ep[i+1]). Should link all pairs sharing the character. File: `src/scripts/graphify-merge.ts` ~Step 4b
- [ ] **Subagent JSON extraction is fragile** — 2/7 episodes had broken JSON in prior runs. Need robust extraction: try JSON.parse → fix trailing commas → fix single quotes → `jsonrepair` npm package → re-run subagent.

## P1 — Feature completeness

- [ ] **Subagent prompt template** — Extract story analysis prompt into `bun_app/bun_graphify/src/scripts/subagent-prompt.ts` as a reusable function. Current prompt is hardcoded in SKILL.md instructions.
- [ ] **Batch per-episode HTML** — Pipeline only generates merged HTML. Add per-episode HTML generation step: `for each episode: gen-story-html.ts <ep-dir>`.
- [ ] **gag_evolves ID normalization** — Regex creates `${EP_ID}_gag_${gagName.replace(/\s+/g, "_")}`, subagent creates `${EP_ID}_gag_${type}`. Different naming conventions. Merge script needs fuzzy ID matching or both pipelines should use same convention.
- [ ] **Trait coverage: PLAN.md character baseline** — Read PLAN.md character personality descriptions and compare against detected traits. This would distinguish "regex missed it" (false positive WARN) from "character actually changed" (real drift).

## P2 — Architecture improvements

- [ ] **Incremental updates** — Check `narration.ts` mtime vs `graph.json` mtime. Only re-process changed episodes.
- [ ] **Dual pipeline merge** — Support mixing regex pipeline output (fast, shallow) with subagent output (slow, rich) for the same episode. Merge by node ID prefix matching.
- [ ] **Confidence scoring** — Regex edges: confidence based on pattern match count. Subagent edges: confidence based on explicit vs inferred. Currently all confidence=1.0.
- [ ] **Cross-series support** — Auto-detect series type (weapon-forger, galgame-meme-theater) and adapt node types/edge relations.

## Pipeline Run History

### 2026-04-14 — weapon-forger (7 episodes, regex pipeline)

| Metric | Value |
|--------|-------|
| Per-episode nodes | 20 (ch1ep3) — 26 (ch2ep2) |
| Per-episode edges | 23 (ch1ep3) — 37 (ch2ep2) |
| Merged nodes | 150 |
| Merged edges | 268 |
| Link edges | 43 (22 same_character, 6 story_continues, 15 gag_evolves) |
| Communities | 11 |
| Consistency | 13 PASS, 8 WARN, 0 FAIL |
| Known gaps | ch2ep3 missing 3 gag nodes, soul character only 1 ep |

### Previous (v0.3.0) — weapon-forger (7 episodes, mixed regex+subagent)

| Metric | Value |
|--------|-------|
| Merged nodes | 285 (included canonical/arc/gag_type nodes) |
| Merged edges | 451 |
| Link edges | 45 |
| Consistency | 8 PASS, 38 WARN, 0 FAIL |

**Improvement:** 150 nodes (no bloat) vs 285, 8 WARN vs 38 WARN, 0 FAIL maintained.

## Done

- [x] Simplified merge — no canonical/arc/gag_type nodes, pure concatenation + link edges
- [x] Episode-based coloring for merged graph HTML (default: By Episode, toggle: By Type)
- [x] Link edges rendered dashed with distinct colors per type
- [x] Auto-detect series pattern (generic `-chN-epM`, not hardcoded `weapon-forger`)
- [x] SKILL.md rewritten as operational playbook with knowledge capture protocol
- [x] graphify-check.ts aligned with both regex and subagent edge relations
- [x] Pipeline step 2.5: merged HTML generation
- [x] Per-episode story KG from narration.ts (regex + subagent)
- [x] Federated merge with link edges (same_character, story_continues, gag_evolves)
- [x] Consistency checking (character drift, gag stagnation, trait coverage, tech term diversity, interaction density)
- [x] vis.js HTML visualization
- [x] Memory/feedback capture for lessons learned
- [x] Character detection: text-mention fallback — CHAR_NAMES mapping in graphify-episode.ts detects characters mentioned in narration text (not just `character:` fields)
- [x] Gag detection without PLAN.md column — fallback logic checks `colEpId === EP_ID` + truthy manifestation, works even without explicit column
