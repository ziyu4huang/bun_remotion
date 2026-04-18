---
name: bun-graphify-phase23-lessons
description: Lessons from Phase 23 AI Cross-Link Discovery implementation in bun_graphify
type: feedback
---

## Bun 1.3.11 parser: optional chaining in nested map/filter fails

**Rule:** Avoid `?.` optional chaining inside multi-line arrow function callbacks within `.map()` or `.filter()` calls in Bun 1.3.11. The parser reports "Unexpected }" at the closing bracket.

**Why:** Bun 1.3.11's JavaScript parser has a bug where `?.` inside certain nested callback contexts causes a silent parse failure. The error message points to the wrong line (closing bracket) making diagnosis difficult. Works fine in `bun -e` one-liners but fails in `.ts` files run via `bun run`.

**How to apply:** Use ternary `(x ? x.prop : false)` instead of `x?.prop` inside multi-line `.map()` / `.filter()` callbacks. In `ai-crosslink-generator.ts:111-117`, replaced `nodes.find(n => n.id === l.source)?.episode` with `(srcNode ? srcNode.episode : false)`.

## File-based subagent pattern is proven but manual

**Rule:** For bun_graphify subagent integration, use the file-based JSON I/O pattern (write input → external AI → read output). This matches graphify-check.ts enrichment pattern and keeps the codebase consistent.

**Why:** bun_graphify has no direct AI API dependency. All AI calls go through Claude Code's Agent tool during skill execution. The file-based pattern writes structured JSON sidecars that subagents can consume.

**How to apply:** When adding new AI-powered features (cross-links, enrichment, NL extraction), always: (1) write `{feature}-input.json` with prompt + data, (2) check for `{feature}-output.json`, (3) validate before merging. Never add direct `fetch()` or SDK calls without a `--api` flag.

## PageRank top-10% favors plot nodes over characters

**Rule:** Raw PageRank on story KGs favors high-degree nodes (episode_plot, scene) over character_instance nodes. For "influential character" use cases, filter PageRank results by `node.type === "character_instance"` before ranking.

**Why:** In the my-core-is-boss KG (109 nodes), top 3 PageRank scores are all episode_plot nodes (0.093, 0.080, 0.065). Character nodes rank lower because they have fewer edges. The `getTopKByPageRank(scores, k, nodeType)` function already supports type filtering but the HTML glow uses raw PageRank across all types.

**How to apply:** For visualization glow effects, consider filtering to character_instance type only, or using a percentile-based threshold within each node type rather than across all nodes.
