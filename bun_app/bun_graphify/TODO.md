# bun_graphify — Code TODO

> Cross-linked with skill docs:
> - Skill PLAN: `.claude/skills/bun_graphify/PLAN.md`
> - Skill TODO: `.claude/skills/bun_graphify/TODO.md`
> - Skill usage: `.claude/skills/bun_graphify/SKILL.md`

## Code-level Tasks

These are implementation tasks in `bun_app/bun_graphify/src/`. For architecture and pipeline-level tasks, see `.claude/skills/bun_graphify/TODO.md`.

### P0 — Fix next

- [ ] **graphify-merge.ts: same_character for non-adjacent episodes**
  - Currently only links sequential episodes (ep[i] ↔ ep[i+1])
  - Should also link same character across non-adjacent episodes when they share the character
  - e.g., ch1ep1_char_zhoumo → ch1ep3_char_zhoumo (skip ch1ep2)
  - File: `src/scripts/graphify-merge.ts` ~Step 4b

### P1 — Code quality

- [ ] **gen-story-html.ts: escape HTML in node labels**
  - Node labels with `<` or `>` or `"`` break the info panel innerHTML
  - Add `escapeHtml()` function for label/property rendering
  - File: `src/scripts/gen-story-html.ts` ~line 260 (node click handler)

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

## Done

- [x] graphify-episode.ts: text-mention character fallback — `CHAR_NAMES` mapping detects characters in narration text (e.g., 滄溟子 in ch2ep3)
- [x] graphify-episode.ts: gag detection without PLAN.md column — fallback checks `colEpId === EP_ID` + truthy manifestation
